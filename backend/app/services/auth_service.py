from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AuthenticationError, ValidationError
from app.core.security import (
    hash_opaque_token,
    hash_password,
    new_opaque_token,
    verify_password,
)
from app.db.models import PasswordResetToken, User
from app.services import user_service

RESET_TOKEN_TTL_MINUTES = 30


def authenticate(db: Session, username: str, password: str) -> User:
    user = user_service.get_user_by_username(db, username.strip())
    if not user or not verify_password(password, user.password_hash):
        raise AuthenticationError("Incorrect username or password.")
    if not user.is_active:
        raise AuthenticationError("This account has been deactivated.")
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> User:
    if not verify_password(current_password, user.password_hash):
        raise ValidationError("Current password is incorrect.")
    if len(new_password) < 8:
        raise ValidationError("New password must be at least 8 characters long.")
    if current_password == new_password:
        raise ValidationError("New password must be different from the current one.")
    user.password_hash = hash_password(new_password)
    user.token_version += 1
    db.commit()
    db.refresh(user)
    return user


def create_password_reset(db: Session, email: str) -> Optional[Tuple[User, str]]:
    """Create a single-use reset token. Returns None when the account is unknown."""
    user = db.execute(select(User).where(User.email == email.strip())).scalar_one_or_none()
    if not user or not user.is_active:
        return None

    now = datetime.now(timezone.utc)
    db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
    )
    for token in db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
        )
    ).scalars():
        token.used_at = now

    raw_token = new_opaque_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_opaque_token(raw_token),
            expires_at=now + timedelta(minutes=RESET_TOKEN_TTL_MINUTES),
        )
    )
    db.commit()
    return user, raw_token


def reset_password(db: Session, raw_token: str, new_password: str) -> User:
    if len(new_password) < 8:
        raise ValidationError("Password must be at least 8 characters long.")
    token = db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_opaque_token(raw_token)
        )
    ).scalar_one_or_none()
    if not token:
        raise ValidationError("This reset link is invalid or has already been used.")
    if token.used_at is not None:
        raise ValidationError("This reset link has already been used.")
    if token.expires_at < datetime.now(timezone.utc):
        raise ValidationError("This reset link has expired. Request a new one.")

    user = db.get(User, token.user_id)
    if not user:
        raise ValidationError("This reset link is invalid.")
    user.password_hash = hash_password(new_password)
    user.token_version += 1
    token.used_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
