from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_staff, get_student
from app.core.config import get_settings
from app.core.errors import ValidationError
from app.db.base import get_db
from app.db.models import User
from app.schemas.attendance import (
    DashboardOut,
    NotifyResult,
    StudentReportOut,
)
from app.services import attendance_service, email_service, report_service, subject_service

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    subject_id: int,
    threshold: int = Query(default=75, ge=0, le=100),
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> DashboardOut:
    subject_service.require_subject_access(db, user, subject_id)
    return attendance_service.get_dashboard(db, subject_id, threshold)


@router.get("/me", response_model=StudentReportOut)
def my_attendance(
    user: User = Depends(get_student),
    db: Session = Depends(get_db),
) -> StudentReportOut:
    return attendance_service.get_student_report(db, user.id)


@router.get("/students/{user_id}", response_model=StudentReportOut)
def student_report(
    user_id: int,
    _: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> StudentReportOut:
    return attendance_service.get_student_report(db, user_id)


def _export_filename(subject_name: str, extension: str) -> str:
    safe_name = "".join(char if char.isalnum() else "_" for char in subject_name).strip("_")
    return f"{safe_name or 'subject'}_attendance.{extension}"


@router.get("/subjects/{subject_id}/export.csv")
def export_csv(
    subject_id: int,
    threshold: int = Query(default=75, ge=0, le=100),
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> Response:
    subject_service.require_subject_access(db, user, subject_id)
    data = attendance_service.get_dashboard(db, subject_id, threshold)
    return Response(
        content=report_service.build_csv(data),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(_export_filename(data.subject.name, 'csv'))}"
        },
    )


@router.get("/subjects/{subject_id}/export.pdf")
def export_pdf(
    subject_id: int,
    threshold: int = Query(default=75, ge=0, le=100),
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> Response:
    subject_service.require_subject_access(db, user, subject_id)
    data = attendance_service.get_dashboard(db, subject_id, threshold)
    return Response(
        content=report_service.build_pdf(data),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(_export_filename(data.subject.name, 'pdf'))}"
        },
    )


@router.post("/subjects/{subject_id}/notify-defaulters", response_model=NotifyResult)
def notify_defaulters(
    subject_id: int,
    background_tasks: BackgroundTasks,
    threshold: int = Query(default=75, ge=0, le=100),
    user: User = Depends(get_staff),
    db: Session = Depends(get_db),
) -> NotifyResult:
    settings = get_settings()
    if not settings.smtp_configured:
        raise ValidationError(
            "Email is not configured. Set SMTP_USERNAME and SMTP_PASSWORD on the server."
        )
    subject_service.require_subject_access(db, user, subject_id)
    data = attendance_service.get_dashboard(db, subject_id, threshold)
    recipients = email_service.valid_recipients(data.defaulters)
    if not recipients:
        raise ValidationError("None of the defaulters has a valid email address.")

    background_tasks.add_task(
        email_service.send_defaulter_emails, recipients, data.subject.name, threshold
    )
    return attendance_service.notify_result(
        queued=len(recipients), skipped=len(data.defaulters) - len(recipients)
    )
