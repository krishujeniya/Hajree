from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_staff
from app.db.base import get_db
from app.db.models import User
from app.schemas.recognition import RecognitionOut
from app.services import face_service, storage, subject_service

router = APIRouter(tags=["recognition"])


@router.post("/recognition", response_model=RecognitionOut)
def recognize_class_photo(
    subject_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> RecognitionOut:
    subject_service.require_subject_access(db, user, subject_id)
    data = storage.read_upload(file)
    allowed = set(subject_service.student_ids(db, subject_id))
    return face_service.recognize(db, data, allowed_user_ids=allowed)
