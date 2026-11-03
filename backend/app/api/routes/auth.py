from __future__ import annotations

import logging
from typing import Optional

import jwt
from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.errors import AuthenticationError, ForbiddenError
from app.core.ratelimit import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.db.base import get_db
from app.db.models import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import Message
from app.schemas.user import PasswordChange, ProfileUpdate, UserCreate, UserOut
from app.services import auth_service, email_service, user_service

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("hajree.auth")

REFRESH_COOKIE = "hajree_refresh"
ACCESS_COOKIE = "hajree_access"


def _user_out(db: Session, user: User) -> UserOut:
    counts = user_service.face_counts(db, [user.id])
    return user_service.to_out(user, counts.get(user.id, 0))


def _set_refresh_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=settings.refresh_token_ttl_days * 24 * 3600,
        httponly=True,
        secure=settings.cookie_is_secure,
        samesite="lax",
        path="/api/auth",
    )


def _set_access_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=token,
        max_age=settings.access_token_ttl_minutes * 60,
        httponly=True,
        secure=settings.cookie_is_secure,
        samesite="lax",
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth")
    response.delete_cookie(ACCESS_COOKIE, path="/")


def _issue_session(db: Session, user: User, response: Response) -> TokenResponse:
    settings = get_settings()
    access = create_access_token(user.id, user.token_version)
    refresh = create_refresh_token(user.id, user.token_version)
    _set_refresh_cookie(response, refresh)
    _set_access_cookie(response, access)
    return TokenResponse(
        access_token=access,
        expires_in=settings.access_token_ttl_minutes * 60,
        user=_user_out(db, user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit(get_settings().login_rate_limit)
def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = auth_service.authenticate(db, payload.username, payload.password)
    return _issue_session(db, user, response)


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit(get_settings().registration_rate_limit)
def register(
    request: Request,
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    settings = get_settings()
    if not settings.allow_self_registration:
        raise ForbiddenError("Self registration is disabled. Ask an administrator for an account.")
    user = user_service.create_user(
        db,
        UserCreate(
            username=payload.username,
            name=payload.name,
            email=payload.email,
            password=payload.password,
            role=payload.role,
        ),
    )
    return _issue_session(db, user, response)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise AuthenticationError("Your session has expired. Please sign in again.")
    try:
        payload = decode_token(token, expected_type="refresh")
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        _clear_auth_cookies(response)
        raise AuthenticationError("Your session has expired. Please sign in again.") from None

    user = db.get(User, user_id)
    if not user or not user.is_active or int(payload.get("ver", 0)) != user.token_version:
        _clear_auth_cookies(response)
        raise AuthenticationError("Your session is no longer valid. Please sign in again.")

    # Rotate the refresh token on every use.
    return _issue_session(db, user, response)


@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    _clear_auth_cookies(response)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    return _user_out(db, user)


@router.patch("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    email = str(payload.email) if payload.email else None
    updated = user_service.update_profile(db, user, payload.name, email)
    return _user_out(db, updated)


@router.post("/change-password", response_model=TokenResponse)
@limiter.limit("10/hour")
def change_password(
    request: Request,
    payload: PasswordChange,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TokenResponse:
    updated = auth_service.change_password(
        db, user, payload.current_password, payload.new_password
    )
    return _issue_session(db, updated, response)


@router.post("/forgot-password", response_model=ForgotPasswordResponse, status_code=202)
@limiter.limit(get_settings().password_reset_rate_limit)
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    settings = get_settings()
    created = auth_service.create_password_reset(db, str(payload.email))
    dev_url: Optional[str] = None
    message = "If an account exists for that email, a reset link has been sent."

    if created:
        user, raw_token = created
        reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
        if settings.smtp_configured and user.email:
            background_tasks.add_task(
                email_service.send_password_reset, user.email, user.name, reset_url
            )
        else:
            logger.warning("SMTP not configured; password reset link generated for %s", user.username)
            if not settings.is_production:
                dev_url = reset_url

    return ForgotPasswordResponse(message=message, dev_reset_url=dev_url)


@router.post("/reset-password", response_model=Message)
@limiter.limit("10/hour")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> Message:
    auth_service.reset_password(db, payload.token, payload.new_password)
    return Message(message="Password updated. You can now sign in.")
