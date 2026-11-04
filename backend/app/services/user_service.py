from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Dict, List, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.core.security import hash_password
from app.db.models import FaceEmbedding, User
from app.schemas.user import UserAdminUpdate, UserCreate, UserOut
from app.services import storage


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found")
    return user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    cleaned = username.strip().lower()
    return db.execute(
        select(User).where(
            (func.lower(User.username) == cleaned)
            | (func.lower(User.email) == cleaned)
        )
    ).scalar_one_or_none()


def face_counts(db: Session, user_ids: Optional[Sequence[int]] = None) -> Dict[int, int]:
    query = select(FaceEmbedding.user_id, func.count(FaceEmbedding.id)).group_by(
        FaceEmbedding.user_id
    )
    if user_ids is not None:
        if not user_ids:
            return {}
        query = query.where(FaceEmbedding.user_id.in_(list(user_ids)))
    return {user_id: count for user_id, count in db.execute(query).all()}


def to_out(user: User, faces: int = 0) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        face_image_count=faces,
    )


def list_users(
    db: Session,
    role: Optional[Role] = None,
    search: Optional[str] = None,
    include_inactive: bool = True,
) -> List[UserOut]:
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if not include_inactive:
        query = query.where(User.is_active.is_(True))
    if search:
        term = f"%{search.strip()}%"
        query = query.where(or_(User.name.ilike(term), User.username.ilike(term), User.email.ilike(term)))
    users = list(db.execute(query.order_by(User.name)).scalars().all())
    counts = face_counts(db, [user.id for user in users])
    return [to_out(user, counts.get(user.id, 0)) for user in users]


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long.")


def create_user(db: Session, payload: UserCreate) -> User:
    _validate_password(payload.password)
    if get_user_by_username(db, payload.username):
        raise ConflictError(f"Username '{payload.username}' is already taken.")
    if payload.email:
        norm_email = str(payload.email).strip().lower()
        existing_email = db.execute(
            select(User).where(func.lower(User.email) == norm_email)
        ).first()
        if existing_email:
            raise ConflictError(f"Email '{payload.email}' is already in use.")
    user = User(
        username=payload.username,
        name=payload.name,
        email=str(payload.email) if payload.email else None,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, payload: UserAdminUpdate) -> User:
    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.email is not None:
        new_email = str(payload.email).strip().lower() if payload.email else None
        if new_email and new_email != (user.email.lower() if user.email else None):
            existing_email = db.execute(
                select(User).where(func.lower(User.email) == new_email, User.id != user.id)
            ).first()
            if existing_email:
                raise ConflictError(f"Email '{payload.email}' is already in use.")
        user.email = str(payload.email) if payload.email else None
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role is not None and payload.role != user.role:
        if user.role == Role.ADMIN:
            raise ValidationError("Admin roles cannot be changed from the API.")
        user.role = payload.role
        user.token_version += 1
    if payload.password:
        _validate_password(payload.password)
        user.password_hash = hash_password(payload.password)
        user.token_version += 1
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    if user.role == Role.ADMIN:
        raise ValidationError("Admin accounts cannot be deleted from the API.")
    user_id = user.id
    db.delete(user)
    db.commit()
    storage.delete_user_images(user_id)


def update_profile(db: Session, user: User, name: str, email: Optional[str]) -> User:
    name = name.strip()
    if len(name) < 2:
        raise ValidationError("Name must be at least 2 characters long.")
    if email:
        norm_email = email.strip().lower()
        if norm_email != (user.email.lower() if user.email else None):
            existing = db.execute(
                select(User).where(func.lower(User.email) == norm_email, User.id != user.id)
            ).first()
            if existing:
                raise ConflictError(f"Email '{email}' is already in use.")
    user.name = name
    user.email = email.strip() if email else None
    db.commit()
    db.refresh(user)
    return user


def count_by_role(db: Session, role: Role) -> int:
    return int(db.execute(select(func.count(User.id)).where(User.role == role)).scalar_one())


def iter_students(db: Session, user_ids: Iterable[int]) -> List[User]:
    ids = list(user_ids)
    if not ids:
        return []
    return list(
        db.execute(
            select(User).where(User.id.in_(ids), User.role == Role.STUDENT)
        ).scalars()
    )
