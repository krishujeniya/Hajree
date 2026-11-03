from __future__ import annotations

from typing import Optional

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.errors import AuthenticationError, ForbiddenError
from app.core.security import decode_token
from app.db.base import get_db
from app.db.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials if credentials else None
    if not token:
        # Fall back to a cookie so server-rendered downloads still work.
        token = request.cookies.get("hajree_access")
    if not token:
        raise AuthenticationError("Sign in to continue.")

    try:
        payload = decode_token(token, expected_type="access")
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise AuthenticationError("Your session has expired. Please sign in again.") from None

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise AuthenticationError("This account is not available.")
    if int(payload.get("ver", 0)) != user.token_version:
        raise AuthenticationError("Your session has expired. Please sign in again.")
    return user


def require_roles(*roles: Role):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenError()
        return user

    return dependency


get_admin = require_roles(Role.ADMIN)
get_staff = require_roles(Role.ADMIN, Role.TEACHER)
get_student = require_roles(Role.STUDENT)
