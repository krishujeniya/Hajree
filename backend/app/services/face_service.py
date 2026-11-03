from __future__ import annotations

import time
from collections.abc import Iterable
from typing import List, Optional, Set

import numpy as np
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.enums import Role
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.db.models import FaceEmbedding, User
from app.ml.face_engine import MULTIPLE_FACE_MESSAGE, NO_FACE_MESSAGE, face_engine
from app.schemas.recognition import (
    EnrollmentStatusOut,
    EnrollmentUploadOut,
    FaceArea,
    RecognitionOut,
    RecognizedFace,
)
from app.services import storage


def load_index(db: Session) -> int:
    """Load every stored embedding into memory for fast matching."""
    rows = db.execute(
        select(FaceEmbedding.user_id, FaceEmbedding.vector, FaceEmbedding.dimension)
    ).all()
    entries = []
    for user_id, blob, dimension in rows:
        vector = np.frombuffer(blob, dtype=np.float32)
        if dimension and vector.size != dimension:
            continue
        entries.append((user_id, vector))
    face_engine.replace_index(entries)
    return len(entries)


def enrollment_status(db: Session, user_id: int) -> EnrollmentStatusOut:
    settings = get_settings()
    user = db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    count = int(
        db.execute(
            select(func.count(FaceEmbedding.id)).where(FaceEmbedding.user_id == user_id)
        ).scalar_one()
    )
    return EnrollmentStatusOut(
        user_id=user.id,
        username=user.username,
        count=count,
        target=settings.enrollment_target_images,
        ready=count >= settings.enrollment_target_images,
    )


def add_enrollment_image(db: Session, user: User, data: bytes) -> EnrollmentUploadOut:
    settings = get_settings()
    if user.role != Role.STUDENT:
        raise ValidationError("Face enrollment is only available for students.")

    existing = db.execute(
        select(FaceEmbedding.id).where(FaceEmbedding.user_id == user.id)
    ).all()
    if len(existing) >= settings.enrollment_target_images:
        raise ConflictError(
            "Enrollment already complete. Reset the enrollment to capture new photos."
        )

    image = storage.open_image(data)
    image_np = np.asarray(image)
    faces = face_engine.detect_faces(image_np, enforce_detection=True)
    if not faces:
        raise ValidationError(NO_FACE_MESSAGE)
    if len(faces) > 1:
        raise ValidationError(MULTIPLE_FACE_MESSAGE)

    face = faces[0]
    quality_ok, reason = face_engine.quality_ok(image_np, face)
    if not quality_ok:
        raise ValidationError(reason)

    path = storage.save_enrollment_image(user.id, image)
    try:
        embedding = FaceEmbedding(
            user_id=user.id,
            image_path=str(path),
            model=settings.face_model,
            dimension=int(face.embedding.size),
            vector=face.embedding.astype(np.float32).tobytes(),
        )
        db.add(embedding)
        db.commit()
    except Exception:
        db.rollback()
        storage.remove_file(path)
        raise

    face_engine.add_to_index(user.id, face.embedding)
    count = len(existing) + 1
    return EnrollmentUploadOut(
        count=count,
        target=settings.enrollment_target_images,
        ready=count >= settings.enrollment_target_images,
        face_confidence=round(face.confidence, 4),
    )


def reset_enrollment(db: Session, user_id: int) -> None:
    db.execute(delete(FaceEmbedding).where(FaceEmbedding.user_id == user_id))
    db.commit()
    storage.delete_user_images(user_id)
    load_index(db)


def recognize(
    db: Session,
    data: bytes,
    allowed_user_ids: Optional[Set[int]] = None,
) -> RecognitionOut:
    settings = get_settings()
    started = time.perf_counter()
    image = storage.open_image(data)
    image_np = np.asarray(image)

    faces = face_engine.detect_faces(image_np, enforce_detection=True)
    if not faces:
        raise ValidationError(NO_FACE_MESSAGE)
    if face_engine.size == 0:
        raise ValidationError(
            "No enrolled faces are available yet. Enroll at least one student first."
        )

    matches = [
        face_engine.search(face.embedding) if face.is_real else None for face in faces
    ]
    user_ids = [match[0] for match in matches if match]
    users = {}
    if user_ids:
        users = {
            user.id: user
            for user in db.execute(select(User).where(User.id.in_(set(user_ids)))).scalars()
        }

    results: List[RecognizedFace] = []
    for index, (face, match) in enumerate(zip(faces, matches)):
        matched = False
        user_id = None
        enrollment = None
        name = None
        distance = None
        confidence = 0.0

        if match:
            candidate_id, candidate_distance = match
            candidate = users.get(candidate_id)
            permitted = allowed_user_ids is None or candidate_id in allowed_user_ids
            if (
                candidate_distance <= settings.face_distance_threshold
                and candidate is not None
                and candidate.role == Role.STUDENT
                and candidate.is_active
                and permitted
            ):
                matched = True
                user_id = candidate.id
                enrollment = candidate.username
                name = candidate.name
                distance = round(candidate_distance, 4)
                ratio = 1.0 - (candidate_distance / settings.face_distance_threshold)
                confidence = round(max(0.0, min(1.0, ratio)), 4)

        results.append(
            RecognizedFace(
                index=index,
                matched=matched,
                user_id=user_id,
                enrollment=enrollment,
                name=name,
                distance=distance,
                confidence=confidence,
                is_real=face.is_real,
                area=FaceArea(x=face.x, y=face.y, w=face.w, h=face.h),
            )
        )

    matched_count = len({face.user_id for face in results if face.matched})
    return RecognitionOut(
        width=image.width,
        height=image.height,
        faces=results,
        matched_count=matched_count,
        unmatched_count=len(results) - sum(1 for face in results if face.matched),
        elapsed_ms=int((time.perf_counter() - started) * 1000),
    )


def enrolled_student_ids(db: Session, ids: Iterable[int]) -> Set[int]:
    ids = list(ids)
    if not ids:
        return set()
    return set(
        db.execute(
            select(FaceEmbedding.user_id).where(FaceEmbedding.user_id.in_(ids)).distinct()
        ).scalars()
    )
