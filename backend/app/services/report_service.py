from __future__ import annotations

import csv
import io
from typing import List

from fpdf import FPDF
from fpdf.enums import XPos, YPos

from app.schemas.attendance import DashboardOut, ReportStudent


def _safe(text: str) -> str:
    """Core PDF fonts only support latin-1; replace unsupported characters."""
    return str(text).encode("latin-1", "replace").decode("latin-1")


class AttendancePDF(FPDF):
    def header(self) -> None:
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(30, 27, 75)
        self.cell(0, 10, "Hajree - Attendance Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_draw_color(99, 102, 241)
        self.set_line_width(0.6)
        self.line(self.l_margin, 22, self.w - self.r_margin, 22)
        self.ln(8)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 140)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def build_csv(dashboard: DashboardOut) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    lectures = dashboard.trends
    headers = (
        ["Enrollment", "Name", "Email"]
        + [f"{point.lecture} ({point.held_on.isoformat()})" for point in lectures]
        + ["Present", "Total", "Percentage"]
    )
    writer.writerow(headers)
    for student in dashboard.students:
        marks = [student.marks.get(str(point.lecture_id), "A") for point in lectures]
        writer.writerow(
            [student.enrollment, student.name, student.email or ""]
            + ["P" if mark == "P" else "A" for mark in marks]
            + [student.present, student.total, f"{student.percentage:.2f}"]
        )
    # Excel-friendly UTF-8 with BOM.
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")


def _student_table(pdf: FPDF, students: List[ReportStudent]) -> None:
    widths = [18, 58, 52, 22, 20, 26]
    headers = ["#", "Name", "Enrollment", "Present", "Total", "%"]
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(238, 240, 255)
    pdf.set_text_color(40, 40, 60)
    for width, header in zip(widths, headers):
        pdf.cell(width, 8, header, border=1, align="C", fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 9)
    for index, student in enumerate(students, start=1):
        fill = index % 2 == 0
        pdf.set_fill_color(249, 250, 255)
        pdf.cell(widths[0], 7, str(index), border=1, align="C", fill=fill)
        pdf.cell(widths[1], 7, _safe(student.name)[:34], border=1, fill=fill)
        pdf.cell(widths[2], 7, _safe(student.enrollment)[:30], border=1, fill=fill)
        pdf.cell(widths[3], 7, str(student.present), border=1, align="C", fill=fill)
        pdf.cell(widths[4], 7, str(student.total), border=1, align="C", fill=fill)
        pdf.cell(widths[5], 7, f"{student.percentage:.1f}", border=1, align="C", fill=fill)
        pdf.ln()


def build_pdf(dashboard: DashboardOut) -> bytes:
    pdf = AttendancePDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(30, 27, 75)
    pdf.cell(0, 8, _safe(f"Subject: {dashboard.subject.name}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(70, 70, 90)
    pdf.cell(
        0,
        6,
        f"Students: {dashboard.metrics.total_students}    "
        f"Lectures: {dashboard.metrics.total_lectures}    "
        f"Overall: {dashboard.metrics.overall_attendance:.2f}%    "
        f"Threshold: {dashboard.threshold}%",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 27, 75)
    pdf.cell(0, 8, "Student Summary", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    _student_table(pdf, dashboard.students)

    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(
        0,
        8,
        _safe(f"Defaulters Below {dashboard.threshold}% ({len(dashboard.defaulters)})"),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    if dashboard.defaulters:
        pdf.set_font("Helvetica", "", 9)
        for student in dashboard.defaulters:
            pdf.cell(
                0,
                6,
                _safe(
                    f"- {student.name} ({student.enrollment}) - {student.percentage:.1f}%"
                ),
                new_x=XPos.LMARGIN,
                new_y=YPos.NEXT,
            )
    else:
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 6, "No defaulters. Every student is above the threshold.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(120, 120, 140)
    pdf.multi_cell(
        0,
        5,
        "Per-lecture breakdown is available in the CSV export. "
        "Generated automatically by Hajree.",
    )
    return bytes(pdf.output())
