from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import ORMModel
from app.schemas.user import UserOut


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Subject name cannot be empty")
        return value


class SubjectOut(ORMModel):
    id: int
    name: str
    created_at: datetime
    student_count: int = 0
    teacher_count: int = 0
    lecture_count: int = 0


class StudentInSubject(ORMModel):
    user_id: int
    enrollment: str
    name: str
    email: Optional[str] = None


class TeacherAssignment(BaseModel):
    user_ids: List[int]


class TeacherAssignmentRequest(BaseModel):
    user_id: int


class StudentMembershipRequest(BaseModel):
    user_ids: List[int] = Field(min_length=1, max_length=500)


class TeacherSubjects(ORMModel):
    user: UserOut
    subject_ids: List[int]
