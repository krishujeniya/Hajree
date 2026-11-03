from __future__ import annotations

from collections.abc import Sequence
from typing import Dict, List

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.enums import AttendanceSource, AttendanceStatus, Role
from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.db.models import (
    Attendance,
    Lecture,
    StudentSubject,
    Subject,
    TeacherSubject,
    User,
)
from app.schemas.subject import StudentInSubject, SubjectOut


def get_subject(db: Session, subject_id: int) -> Subject:
    subject = db.get(Subject, subject_id)
    if not subject:
        raise NotFoundError("Subject not found")
    return subject


def counts_for(db: Session, subject_ids: Sequence[int]) -> Dict[int, Dict[str, int]]:
    if not subject_ids:
        return {}
    result: Dict[int, Dict[str, int]] = {
        subject_id: {"student_count": 0, "teacher_count": 0, "lecture_count": 0}
        for subject_id in subject_ids
    }
    for name, model in (
        ("student_count", StudentSubject),
        ("teacher_count", TeacherSubject),
        ("lecture_count", Lecture),
    ):
        rows = db.execute(
            select(model.subject_id, func.count()).where(model.subject_id.in_(subject_ids)).group_by(model.subject_id)
        ).all()
        for subject_id, count in rows:
            result[subject_id][name] = int(count)
    return result


def to_out(subject: Subject, counts: Dict[str, int]) -> SubjectOut:
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        created_at=subject.created_at,
        student_count=counts.get("student_count", 0),
        teacher_count=counts.get("teacher_count", 0),
        lecture_count=counts.get("lecture_count", 0),
    )


def list_subjects(db: Session, user: User) -> List[SubjectOut]:
    query = select(Subject)
    if user.role == Role.TEACHER:
        query = query.join(TeacherSubject, TeacherSubject.subject_id == Subject.id).where(
            TeacherSubject.user_id == user.id
        )
    elif user.role == Role.STUDENT:
        query = query.join(StudentSubject, StudentSubject.subject_id == Subject.id).where(
            StudentSubject.user_id == user.id
        )
    subjects = list(db.execute(query.order_by(Subject.name)).scalars().all())
    counts = counts_for(db, [subject.id for subject in subjects])
    return [to_out(subject, counts.get(subject.id, {})) for subject in subjects]


def create_subject(db: Session, name: str) -> Subject:
    name = name.strip()
    existing = db.execute(select(Subject).where(func.lower(Subject.name) == name.lower())).scalar_one_or_none()
    if existing:
        raise ConflictError(f"Subject '{name}' already exists.")
    subject = Subject(name=name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def delete_subject(db: Session, subject_id: int) -> None:
    subject = get_subject(db, subject_id)
    db.delete(subject)
    db.commit()


def user_has_subject_access(db: Session, user: User, subject_id: int) -> bool:
    if user.role == Role.ADMIN:
        return db.get(Subject, subject_id) is not None
    model = TeacherSubject if user.role == Role.TEACHER else StudentSubject
    row = db.execute(
        select(model).where(model.user_id == user.id, model.subject_id == subject_id)
    ).first()
    return row is not None


def require_subject_access(db: Session, user: User, subject_id: int) -> Subject:
    subject = get_subject(db, subject_id)
    if not user_has_subject_access(db, user, subject_id):
        raise ForbiddenError("You are not assigned to this subject.")
    return subject


def student_ids(db: Session, subject_id: int) -> List[int]:
    return [
        row
        for row in db.execute(
            select(StudentSubject.user_id).where(StudentSubject.subject_id == subject_id)
        ).scalars()
    ]


def list_students(db: Session, subject_id: int) -> List[StudentInSubject]:
    rows = db.execute(
        select(User.id, User.username, User.name, User.email)
        .join(StudentSubject, StudentSubject.user_id == User.id)
        .where(StudentSubject.subject_id == subject_id, User.role == Role.STUDENT)
        .order_by(User.name)
    ).all()
    return [
        StudentInSubject(user_id=row[0], enrollment=row[1], name=row[2], email=row[3])
        for row in rows
    ]


def add_students(db: Session, subject_id: int, user_ids: Sequence[int]) -> int:
    get_subject(db, subject_id)
    existing = set(student_ids(db, subject_id))
    lecture_ids = list(
        db.execute(select(Lecture.id).where(Lecture.subject_id == subject_id)).scalars()
    )
    added = 0
    for user_id in user_ids:
        if user_id in existing:
            continue
        user = db.get(User, user_id)
        if not user or user.role != Role.STUDENT:
            continue
        db.add(StudentSubject(user_id=user_id, subject_id=subject_id))
        for lecture_id in lecture_ids:
            db.add(
                Attendance(
                    lecture_id=lecture_id,
                    user_id=user_id,
                    status=AttendanceStatus.ABSENT,
                    source=AttendanceSource.BULK,
                )
            )
        existing.add(user_id)
        added += 1
    db.commit()
    return added


def remove_students(db: Session, subject_id: int, user_ids: Sequence[int]) -> int:
    get_subject(db, subject_id)
    if not user_ids:
        return 0
    lecture_ids = list(
        db.execute(select(Lecture.id).where(Lecture.subject_id == subject_id)).scalars()
    )
    if lecture_ids:
        db.execute(
            delete(Attendance).where(
                Attendance.lecture_id.in_(lecture_ids), Attendance.user_id.in_(list(user_ids))
            )
        )
    result = db.execute(
        delete(StudentSubject).where(
            StudentSubject.subject_id == subject_id,
            StudentSubject.user_id.in_(list(user_ids)),
        )
    )
    db.commit()
    return int(result.rowcount or 0)


def list_teachers(db: Session, subject_id: int) -> List[User]:
    return list(
        db.execute(
            select(User)
            .join(TeacherSubject, TeacherSubject.user_id == User.id)
            .where(TeacherSubject.subject_id == subject_id)
            .order_by(User.name)
        ).scalars()
    )


def assign_teacher(db: Session, subject_id: int, user_id: int) -> None:
    get_subject(db, subject_id)
    user = db.get(User, user_id)
    if not user or user.role != Role.TEACHER:
        raise NotFoundError("Teacher not found")
    existing = db.execute(
        select(TeacherSubject).where(
            TeacherSubject.subject_id == subject_id, TeacherSubject.user_id == user_id
        )
    ).first()
    if existing:
        raise ConflictError("This teacher is already assigned to the subject.")
    db.add(TeacherSubject(subject_id=subject_id, user_id=user_id))
    db.commit()


def remove_teacher(db: Session, subject_id: int, user_id: int) -> None:
    result = db.execute(
        delete(TeacherSubject).where(
            TeacherSubject.subject_id == subject_id, TeacherSubject.user_id == user_id
        )
    )
    db.commit()
    if not result.rowcount:
        raise NotFoundError("This teacher is not assigned to the subject.")


def teacher_subject_ids(db: Session, user_id: int) -> List[int]:
    return list(
        db.execute(select(TeacherSubject.subject_id).where(TeacherSubject.user_id == user_id)).scalars()
    )


def unassigned_subjects(db: Session, teacher_id: int) -> List[Subject]:
    assigned = set(teacher_subject_ids(db, teacher_id))
    return [
        subject
        for subject in db.execute(select(Subject).order_by(Subject.name)).scalars()
        if subject.id not in assigned
    ]
