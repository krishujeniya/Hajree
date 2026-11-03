from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_admin, get_current_user
from app.core.enums import Role
from app.core.errors import ForbiddenError, ValidationError
from app.db.base import get_db
from app.db.models import User
from app.schemas.common import Message
from app.schemas.recognition import EnrollmentStatusOut, EnrollmentUploadOut
from app.schemas.user import UserAdminUpdate, UserCreate, UserOut
from app.services import face_service, storage, user_service

router = APIRouter(prefix="/users", tags=["users"])


def _face_target(db: Session, actor: User, user_id: int) -> User:
    target = user_service.get_user(db, user_id)
    if actor.role != Role.ADMIN and actor.id != target.id:
        raise ForbiddenError("You can only manage your own face enrollment.")
    if target.role != Role.STUDENT:
        raise ValidationError("Face enrollment is only available for students.")
    return target


@router.get("", response_model=List[UserOut])
def list_users(
    role: Optional[Role] = None,
    search: Optional[str] = None,
    include_inactive: bool = True,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> List[UserOut]:
    return user_service.list_users(db, role=role, search=search, include_inactive=include_inactive)


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> UserOut:
    user = user_service.create_user(db, payload)
    return user_service.to_out(user)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if actor.role != Role.ADMIN and actor.id != user_id:
        raise ForbiddenError()
    user = user_service.get_user(db, user_id)
    counts = user_service.face_counts(db, [user.id])
    return user_service.to_out(user, counts.get(user.id, 0))


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> UserOut:
    user = user_service.get_user(db, user_id)
    user = user_service.update_user(db, user, payload)
    counts = user_service.face_counts(db, [user.id])
    return user_service.to_out(user, counts.get(user.id, 0))


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    actor: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> None:
    if actor.id == user_id:
        raise ValidationError("You cannot delete your own account.")
    user = user_service.get_user(db, user_id)
    user_service.delete_user(db, user)
    face_service.load_index(db)


@router.get("/{user_id}/face", response_model=EnrollmentStatusOut)
def face_status(
    user_id: int,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EnrollmentStatusOut:
    _face_target(db, actor, user_id)
    return face_service.enrollment_status(db, user_id)


@router.post("/{user_id}/face-images", response_model=EnrollmentUploadOut)
def upload_face_image(
    user_id: int,
    file: UploadFile = File(...),
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EnrollmentUploadOut:
    target = _face_target(db, actor, user_id)
    data = storage.read_upload(file)
    return face_service.add_enrollment_image(db, target, data)


@router.delete("/{user_id}/face", response_model=Message)
def reset_face_enrollment(
    user_id: int,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Message:
    _face_target(db, actor, user_id)
    face_service.reset_enrollment(db, user_id)
    return Message(message="Face enrollment has been reset. Capture a new set of photos.")
