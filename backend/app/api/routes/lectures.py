from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_staff
from app.db.base import get_db
from app.db.models import User
from app.schemas.attendance import (
    AttendanceUpdate,
    LectureAttendanceOut,
    ManualAttendanceRequest,
)
from app.schemas.common import Message
from app.services import attendance_service, lecture_service, subject_service

router = APIRouter(prefix="/lectures", tags=["lectures"])


def _require_lecture_access(db: Session, user: User, lecture_id: int):
    lecture = lecture_service.get_lecture(db, lecture_id)
    subject_service.require_subject_access(db, user, lecture.subject_id)
    return lecture


@router.get("/{lecture_id}/attendance", response_model=LectureAttendanceOut)
def get_attendance(
    lecture_id: int,
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> LectureAttendanceOut:
    _require_lecture_access(db, user, lecture_id)
    return attendance_service.get_lecture_attendance(db, lecture_id)


@router.put("/{lecture_id}/attendance", response_model=LectureAttendanceOut)
def save_attendance(
    lecture_id: int,
    payload: AttendanceUpdate,
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> LectureAttendanceOut:
    _require_lecture_access(db, user, lecture_id)
    return attendance_service.update_attendance(db, lecture_id, payload.records, user.id)


@router.post("/{lecture_id}/attendance/manual", response_model=LectureAttendanceOut)
def mark_manual(
    lecture_id: int,
    payload: ManualAttendanceRequest,
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> LectureAttendanceOut:
    _require_lecture_access(db, user, lecture_id)
    return attendance_service.mark_manual(db, lecture_id, payload, user.id)


@router.delete("/{lecture_id}", response_model=Message)
def delete_lecture(
    lecture_id: int,
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> Message:
    _require_lecture_access(db, user, lecture_id)
    lecture_service.delete_lecture(db, lecture_id)
    return Message(message="Lecture deleted.")
