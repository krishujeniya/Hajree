from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import AttendanceSource, AttendanceStatus, Role
from app.core.errors import ValidationError
from app.db.models import Attendance, Lecture, StudentSubject, Subject, User
from app.schemas.attendance import (
    AttendanceRecordIn,
    DashboardMetrics,
    DashboardOut,
    LectureAttendanceOut,
    LectureStudent,
    ManualAttendanceRequest,
    NotifyResult,
    ReportStudent,
    StudentLectureRecord,
    StudentReportOut,
    StudentSubjectReport,
    SubjectBrief,
    TrendPoint,
)
from app.services import lecture_service, subject_service


def _round(value: float) -> float:
    return round(value + 0.0, 2)


def get_dashboard(db: Session, subject_id: int, threshold: int) -> DashboardOut:
    subject = subject_service.get_subject(db, subject_id)
    students = subject_service.list_students(db, subject_id)
    lectures = list(
        db.execute(
            select(Lecture)
            .where(Lecture.subject_id == subject_id)
            .order_by(Lecture.held_on.asc(), Lecture.id.asc())
        ).scalars()
    )
    rows = db.execute(
        select(Attendance.lecture_id, Attendance.user_id, Attendance.status)
        .join(Lecture, Lecture.id == Attendance.lecture_id)
        .where(Lecture.subject_id == subject_id)
    ).all()

    marks: Dict[int, Dict[int, AttendanceStatus]] = {student.user_id: {} for student in students}
    for lecture_id, user_id, status in rows:
        if user_id in marks:
            marks[user_id][lecture_id] = status

    total_lectures = len(lectures)
    report_students: List[ReportStudent] = []
    total_present = 0

    for student in students:
        student_marks = marks.get(student.user_id, {})
        present = sum(
            1
            for lecture in lectures
            if student_marks.get(lecture.id) == AttendanceStatus.PRESENT
        )
        total_present += present
        percentage = (present / total_lectures * 100) if total_lectures else 100.0
        report_students.append(
            ReportStudent(
                user_id=student.user_id,
                enrollment=student.enrollment,
                name=student.name,
                email=student.email,
                present=present,
                total=total_lectures,
                percentage=_round(percentage),
                marks={
                    str(lecture.id): student_marks.get(lecture.id, AttendanceStatus.ABSENT)
                    for lecture in lectures
                },
            )
        )

    report_students.sort(key=lambda item: item.name.lower())
    defaulters = (
        sorted(
            [student for student in report_students if student.percentage < threshold],
            key=lambda item: (item.percentage, item.name.lower()),
        )
        if total_lectures > 0
        else []
    )

    trends: List[TrendPoint] = []
    for lecture in lectures:
        present = sum(
            1
            for student in students
            if marks.get(student.user_id, {}).get(lecture.id) == AttendanceStatus.PRESENT
        )
        trends.append(
            TrendPoint(
                lecture_id=lecture.id,
                lecture=lecture.name,
                held_on=lecture.held_on,
                present=present,
                total=len(students),
                percentage=_round((present / len(students) * 100) if students else 0.0),
            )
        )

    possible = len(students) * total_lectures
    overall = (total_present / possible * 100) if possible else 100.0

    return DashboardOut(
        subject=SubjectBrief(id=subject.id, name=subject.name),
        threshold=threshold,
        metrics=DashboardMetrics(
            total_students=len(students),
            total_lectures=total_lectures,
            overall_attendance=_round(overall),
            defaulter_count=len(defaulters),
        ),
        trends=trends,
        students=report_students,
        defaulters=defaulters,
    )


def get_lecture_attendance(db: Session, lecture_id: int) -> LectureAttendanceOut:
    lecture = lecture_service.get_lecture(db, lecture_id)
    rows = db.execute(
        select(User.id, User.username, User.name, Attendance.status)
        .join(Attendance, Attendance.user_id == User.id)
        .where(Attendance.lecture_id == lecture_id, User.role == Role.STUDENT)
        .order_by(User.name)
    ).all()
    students = [
        LectureStudent(user_id=row[0], enrollment=row[1], name=row[2], status=row[3]) for row in rows
    ]
    present = sum(1 for student in students if student.status == AttendanceStatus.PRESENT)
    return LectureAttendanceOut(
        lecture=lecture_service.to_out(db, lecture),
        students=students,
        present_count=present,
        absent_count=len(students) - present,
    )


def update_attendance(
    db: Session,
    lecture_id: int,
    records: List[AttendanceRecordIn],
    marked_by_id: Optional[int],
    source: AttendanceSource = AttendanceSource.FACE,
) -> LectureAttendanceOut:
    lecture = lecture_service.get_lecture(db, lecture_id)
    enrolled = set(subject_service.student_ids(db, lecture.subject_id))
    invalid = [record.user_id for record in records if record.user_id not in enrolled]
    if invalid:
        raise ValidationError(
            "Some students are not enrolled in this subject. Refresh the page and try again."
        )

    existing = {
        attendance.user_id: attendance
        for attendance in db.execute(
            select(Attendance).where(Attendance.lecture_id == lecture_id)
        ).scalars()
    }
    for record in records:
        attendance = existing.get(record.user_id)
        if attendance is None:
            db.add(
                Attendance(
                    lecture_id=lecture_id,
                    user_id=record.user_id,
                    status=record.status,
                    source=source,
                    marked_by_id=marked_by_id,
                )
            )
        else:
            attendance.status = record.status
            attendance.source = source
            attendance.marked_by_id = marked_by_id
    db.commit()
    return get_lecture_attendance(db, lecture_id)


def mark_manual(db: Session, lecture_id: int, payload: ManualAttendanceRequest, marked_by_id: int) -> LectureAttendanceOut:
    lecture = lecture_service.get_lecture(db, lecture_id)
    student = db.execute(
        select(User).where(User.username == payload.enrollment.strip(), User.role == Role.STUDENT)
    ).scalar_one_or_none()
    if not student:
        raise ValidationError(f"No student found with enrollment '{payload.enrollment}'.")
    attendance = db.execute(
        select(Attendance).where(
            Attendance.lecture_id == lecture_id, Attendance.user_id == student.id
        )
    ).scalar_one_or_none()
    if not attendance:
        raise ValidationError("This student is not enrolled in the subject.")
    attendance.status = AttendanceStatus.PRESENT
    attendance.source = AttendanceSource.MANUAL
    attendance.marked_by_id = marked_by_id
    db.commit()
    return get_lecture_attendance(db, lecture.id)


def get_student_report(db: Session, user_id: int) -> StudentReportOut:
    subjects = list(
        db.execute(
            select(Subject)
            .join(StudentSubject, StudentSubject.subject_id == Subject.id)
            .where(StudentSubject.user_id == user_id)
            .order_by(Subject.name)
        ).scalars()
    )
    reports: List[StudentSubjectReport] = []
    total_present = 0
    total_lectures_all = 0

    for subject in subjects:
        lectures = list(
            db.execute(
                select(Lecture)
                .where(Lecture.subject_id == subject.id)
                .order_by(Lecture.held_on.asc(), Lecture.id.asc())
            ).scalars()
        )
        statuses = {
            lecture_id: status
            for lecture_id, status in db.execute(
                select(Attendance.lecture_id, Attendance.status)
                .join(Lecture, Lecture.id == Attendance.lecture_id)
                .where(Attendance.user_id == user_id, Lecture.subject_id == subject.id)
            ).all()
        }
        records = [
            StudentLectureRecord(
                lecture_id=lecture.id,
                lecture=lecture.name,
                held_on=lecture.held_on,
                status=statuses.get(lecture.id, AttendanceStatus.ABSENT),
            )
            for lecture in lectures
        ]
        present = sum(1 for record in records if record.status == AttendanceStatus.PRESENT)
        total_lectures = len(records)
        percentage = (present / total_lectures * 100) if total_lectures else 100.0
        total_present += present
        total_lectures_all += total_lectures
        reports.append(
            StudentSubjectReport(
                subject_id=subject.id,
                subject=subject.name,
                total_lectures=total_lectures,
                present=present,
                percentage=_round(percentage),
                records=records,
            )
        )

    overall = (
        (total_present / total_lectures_all * 100) if total_lectures_all else 100.0
    )
    return StudentReportOut(overall_percentage=_round(overall), subjects=reports)


def count_present(db: Session, lecture_id: int) -> int:
    return int(
        db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.lecture_id == lecture_id,
                Attendance.status == AttendanceStatus.PRESENT,
            )
        ).scalar_one()
    )


def notify_result(queued: int, skipped: int = 0, errors: Optional[List[str]] = None) -> NotifyResult:
    return NotifyResult(queued=queued, skipped=skipped, errors=errors or [])
