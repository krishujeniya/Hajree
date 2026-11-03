from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.enums import Role
from app.schemas.common import ORMModel


class UserOut(ORMModel):
    id: int
    username: str
    name: str
    email: Optional[str] = None
    role: Role
    is_active: bool
    created_at: datetime
    face_image_count: int = 0


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64, pattern=r"^[A-Za-z0-9._@-]+$")
    name: str = Field(min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    password: str = Field(min_length=8, max_length=128)
    role: Role = Role.STUDENT

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        return value

    @field_validator("username", "name", mode="before")
    @classmethod
    def strip_strings(cls, value):
        return value.strip() if isinstance(value, str) else value


class UserAdminUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[Role] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        return value


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: Optional[EmailStr] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        return value


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
