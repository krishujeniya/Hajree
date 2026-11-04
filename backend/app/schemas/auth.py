from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.enums import Role
from app.schemas.user import UserOut


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=64, pattern=r"^[A-Za-z0-9._@-]+$")
    name: str = Field(min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    password: str = Field(min_length=8, max_length=128)
    role: Role = Role.STUDENT

    @field_validator("role")
    @classmethod
    def restrict_roles(cls, value: Role) -> Role:
        if value != Role.STUDENT:
            raise ValueError("Only student accounts can be created through self-registration")
        return value

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    dev_reset_url: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    new_password: str = Field(min_length=8, max_length=128)
