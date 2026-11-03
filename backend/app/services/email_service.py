from __future__ import annotations

import logging
import smtplib
from collections.abc import Sequence
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import List, Tuple

from app.core.config import get_settings
from app.schemas.attendance import ReportStudent

logger = logging.getLogger("hajri.email")


def _send(to_email: str, subject: str, html: str, text: str) -> None:
    settings = get_settings()
    if not settings.smtp_configured:
        raise RuntimeError("SMTP credentials are not configured.")

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = formataddr((settings.email_from_name, settings.sender_email or ""))
    message["To"] = to_email
    message.attach(MIMEText(text, "plain", "utf-8"))
    message.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        server.ehlo()
        if settings.smtp_use_tls:
            server.starttls()
            server.ehlo()
        server.login(settings.smtp_username or "", settings.smtp_password or "")
        server.sendmail(settings.sender_email or "", [to_email], message.as_string())


def send_password_reset(to_email: str, name: str, reset_url: str) -> None:
    subject = "Reset your Hajri.ai password"
    text = (
        f"Hi {name},\n\n"
        f"Use this link to reset your Hajri.ai password. It expires in 30 minutes.\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )
    html = f"""
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
      <h2 style="color:#4f46e5;margin:0 0 8px">Reset your password</h2>
      <p>Hi {name},</p>
      <p>Click the button below to choose a new password. The link expires in 30 minutes.</p>
      <p style="margin:24px 0">
        <a href="{reset_url}" style="background:#4f46e5;color:#fff;padding:12px 20px;
        border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
      </p>
      <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email.</p>
    </div>
    """
    _send(to_email, subject, html, text)


def _low_attendance_message(name: str, subject_name: str, percentage: float, threshold: int) -> Tuple[str, str, str]:
    subject = f"Low attendance in {subject_name}"
    text = (
        f"Hi {name},\n\n"
        f"Your attendance in {subject_name} is {percentage:.1f}%, below the "
        f"{threshold}% requirement. Please meet your teacher to catch up.\n\n"
        "— Hajri.ai"
    )
    html = f"""
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
      <h2 style="color:#b91c1c;margin:0 0 8px">Attendance alert</h2>
      <p>Hi {name},</p>
      <p>Your attendance in <strong>{subject_name}</strong> is
      <strong style="color:#b91c1c">{percentage:.1f}%</strong>, below the
      {threshold}% requirement.</p>
      <p>Please meet your teacher to plan how to catch up.</p>
      <p style="color:#6b7280;font-size:13px">— Hajri.ai</p>
    </div>
    """
    return subject, html, text


def send_defaulter_emails(students: Sequence[ReportStudent], subject_name: str, threshold: int) -> int:
    """Send low-attendance emails. Returns the number sent successfully."""
    settings = get_settings()
    if not settings.smtp_configured:
        logger.warning("Skipping defaulter emails: SMTP is not configured.")
        return 0

    sent = 0
    for student in students:
        if not student.email or "@" not in student.email:
            continue
        subject, html, text = _low_attendance_message(
            student.name, subject_name, student.percentage, threshold
        )
        try:
            _send(student.email, subject, html, text)
            sent += 1
        except Exception as exc:  # pragma: no cover - network dependent
            logger.error("Failed to email %s: %s", student.email, exc)
    return sent


def valid_recipients(students: Sequence[ReportStudent]) -> List[ReportStudent]:
    return [student for student in students if student.email and "@" in student.email]
