from __future__ import annotations

import enum


class Role(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "P"
    ABSENT = "A"


class AttendanceSource(str, enum.Enum):
    FACE = "face"
    MANUAL = "manual"
    BULK = "bulk"
