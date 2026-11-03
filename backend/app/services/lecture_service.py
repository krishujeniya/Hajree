from __future__ import annotations

from datetime import date
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import AttendanceSource, AttendanceStatus
from app.core.errors import ConflictError, NotFoundError
from app.db.models import Attendance, Lecture, StudentSubject
from app.schemas.attendance import LectureOut


def get_lecture(db: Session, lecture_id: int) -> Lecture:
    lecture = db.get(Lecture, lecture_id)
    if not lecture:
        raise NotFoundError("Lecture not found")
    return lecture


def list_lectures(db: Session, subject_id: int) -> List[LectureOut]:
    lectures = list(
        db.execute(
            select(Lecture)
            .where(Lecture.subject_id == subject_id)
            .order_by(Lecture.held_on.desc(), Lecture.id.desc())
        ).scalars()
    )
    if not lectures:
        return []
    total_students = int(
        db.execute(
            select(func.count(StudentSubject.user_id)).where(
                StudentSubject.subject_id == subject_id
            )
        ).scalar_one()
    )
    present_rows = db.execute(
        select(Attendance.lecture_id, func.count(Attendance.id))
        .where(
            Attendance.lecture_id.in_([lecture.id for lecture in lectures]),
            Attendance.status == AttendanceStatus.PRESENT,
        )
        .group_by(Attendance.lecture_id)
    ).all()
    present = {lecture_id: int(count) for lecture_id, count in present_rows}
    return [
        LectureOut(
            id=lecture.id,
            subject_id=lecture.subject_id,
            name=lecture.name,
            held_on=lecture.held_on,
            created_at=lecture.created_at,
            present_count=present.get(lecture.id, 0),
            total_students=total_students,
        )
        for lecture in lectures
    ]


def to_out(db: Session, lecture: Lecture) -> LectureOut:
    total = int(
        db.execute(
            select(func.count(StudentSubject.user_id)).where(
                StudentSubject.subject_id == lecture.subject_id
            )
        ).scalar_one()
    )
    present = int(
        db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.lecture_id == lecture.id,
                Attendance.status == AttendanceStatus.PRESENT,
            )
        ).scalar_one()
    )
    return LectureOut(
        id=lecture.id,
        subject_id=lecture.subject_id,
        name=lecture.name,
        held_on=lecture.held_on,
        created_at=lecture.created_at,
        present_count=present,
        total_students=total,
    )


def create_lecture(
    db: Session,
    subject_id: int,
    name: str,
    held_on: Optional[date],
    created_by_id: Optional[int],
) -> Lecture:
    cleaned = name.strip()
    if not cleaned:
        raise ConflictError("Lecture name cannot be empty.")
    duplicate = db.execute(
        select(Lecture).where(
            Lecture.subject_id == subject_id, func.lower(Lecture.name) == cleaned.lower()
        )
    ).scalar_one_or_none()
    if duplicate:
        raise ConflictError(f"Lecture '{cleaned}' already exists for this subject.")

    lecture = Lecture(
        subject_id=subject_id,
        name=cleaned,
        held_on=held_on or date.today(),
        created_by_id=created_by_id,
    )
    db.add(lecture)
    db.flush()
    for user_id in db.execute(
        select(StudentSubject.user_id).where(StudentSubject.subject_id == subject_id)
    ).scalars():
        db.add(
            Attendance(
                lecture_id=lecture.id,
                user_id=user_id,
                status=AttendanceStatus.ABSENT,
                source=AttendanceSource.BULK,
            )
        )
    db.commit()
    db.refresh(lecture)
    return lecture


def delete_lecture(db: Session, lecture_id: int) -> None:
    lecture = get_lecture(db, lecture_id)
    db.delete(lecture)
    db.commit()
