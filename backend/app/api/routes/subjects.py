from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_admin, get_current_user, get_staff
from app.core.enums import Role
from app.db.base import get_db
from app.db.models import User
from app.schemas.attendance import LectureCreate, LectureOut
from app.schemas.common import Message
from app.schemas.subject import (
    StudentInSubject,
    StudentMembershipRequest,
    SubjectCreate,
    SubjectOut,
    TeacherAssignmentRequest,
)
from app.schemas.user import UserOut
from app.services import lecture_service, subject_service, user_service

router = APIRouter(prefix="/subjects", tags=["subjects"])


def _subject_out(db: Session, subject_id: int) -> SubjectOut:
    subject = subject_service.get_subject(db, subject_id)
    counts = subject_service.counts_for(db, [subject.id])
    return subject_service.to_out(subject, counts.get(subject.id, {}))


@router.get("", response_model=List[SubjectOut])
def list_subjects(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[SubjectOut]:
    return subject_service.list_subjects(db, user)


@router.post("", response_model=SubjectOut, status_code=201)
def create_subject(
    payload: SubjectCreate,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> SubjectOut:
    subject = subject_service.create_subject(db, payload.name)
    return _subject_out(db, subject.id)


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(
    subject_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubjectOut:
    subject_service.require_subject_access(db, user, subject_id)
    return _subject_out(db, subject_id)


@router.delete("/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> None:
    subject_service.delete_subject(db, subject_id)


@router.get("/{subject_id}/students", response_model=List[StudentInSubject])
def list_students(
    subject_id: int,
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> List[StudentInSubject]:
    subject_service.require_subject_access(db, user, subject_id)
    return subject_service.list_students(db, subject_id)


@router.get("/{subject_id}/students/available", response_model=List[StudentInSubject])
def available_students(
    subject_id: int,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> List[StudentInSubject]:
    enrolled = {student.user_id for student in subject_service.list_students(db, subject_id)}
    students = db.query(User).filter(User.role == Role.STUDENT).order_by(User.name).all()
    return [
        StudentInSubject(
            user_id=student.id,
            enrollment=student.username,
            name=student.name,
            email=student.email,
        )
        for student in students
        if student.id not in enrolled
    ]


@router.post("/{subject_id}/students", response_model=Message)
def add_students(
    subject_id: int,
    payload: StudentMembershipRequest,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> Message:
    added = subject_service.add_students(db, subject_id, payload.user_ids)
    return Message(message=f"Added {added} student(s) to the subject.")


@router.delete("/{subject_id}/students", response_model=Message)
def remove_students(
    subject_id: int,
    payload: StudentMembershipRequest,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> Message:
    removed = subject_service.remove_students(db, subject_id, payload.user_ids)
    return Message(message=f"Removed {removed} student(s) from the subject.")


@router.get("/{subject_id}/teachers", response_model=List[UserOut])
def list_teachers(
    subject_id: int,
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> List[UserOut]:
    subject_service.require_subject_access(db, user, subject_id)
    teachers = subject_service.list_teachers(db, subject_id)
    counts = user_service.face_counts(db, [teacher.id for teacher in teachers])
    return [user_service.to_out(teacher, counts.get(teacher.id, 0)) for teacher in teachers]


@router.post("/{subject_id}/teachers", response_model=Message, status_code=201)
def assign_teacher(
    subject_id: int,
    payload: TeacherAssignmentRequest,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> Message:
    subject_service.assign_teacher(db, subject_id, payload.user_id)
    return Message(message="Teacher assigned to the subject.")


@router.delete("/{subject_id}/teachers/{user_id}", response_model=Message)
def unassign_teacher(
    subject_id: int,
    user_id: int,
    _: User = Depends(get_admin),
    db: Session = Depends(get_db),
) -> Message:
    subject_service.remove_teacher(db, subject_id, user_id)
    return Message(message="Teacher removed from the subject.")


@router.get("/{subject_id}/lectures", response_model=List[LectureOut])
def list_lectures(
    subject_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[LectureOut]:
    subject_service.require_subject_access(db, user, subject_id)
    return lecture_service.list_lectures(db, subject_id)


@router.post("/{subject_id}/lectures", response_model=LectureOut, status_code=201)
def create_lecture(
    subject_id: int,
    payload: LectureCreate,
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> LectureOut:
    subject_service.require_subject_access(db, user, subject_id)
    lecture = lecture_service.create_lecture(
        db,
        subject_id,
        payload.cleaned_name(),
        payload.held_on,
        user.id,
    )
    return lecture_service.to_out(db, lecture)
