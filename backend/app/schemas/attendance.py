from __future__ import annotations

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.enums import AttendanceStatus
from app.schemas.common import ORMModel


class LectureCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    held_on: Optional[date] = None

    def cleaned_name(self) -> str:
        return self.name.strip()


class LectureOut(ORMModel):
    id: int
    subject_id: int
    name: str
    held_on: date
    created_at: datetime
    present_count: int = 0
    total_students: int = 0


class AttendanceRecordIn(BaseModel):
    user_id: int
    status: AttendanceStatus


class AttendanceUpdate(BaseModel):
    records: List[AttendanceRecordIn] = Field(min_length=1, max_length=1000)


class ManualAttendanceRequest(BaseModel):
    enrollment: str = Field(min_length=1, max_length=64)


class LectureStudent(BaseModel):
    user_id: int
    enrollment: str
    name: str
    status: AttendanceStatus


class LectureAttendanceOut(BaseModel):
    lecture: LectureOut
    students: List[LectureStudent]
    present_count: int
    absent_count: int


class SubjectBrief(BaseModel):
    id: int
    name: str


class DashboardMetrics(BaseModel):
    total_students: int
    total_lectures: int
    overall_attendance: float
    defaulter_count: int


class TrendPoint(BaseModel):
    lecture_id: int
    lecture: str
    held_on: date
    present: int
    total: int
    percentage: float


class ReportStudent(BaseModel):
    user_id: int
    enrollment: str
    name: str
    email: Optional[str] = None
    present: int
    total: int
    percentage: float
    marks: Dict[str, AttendanceStatus]


class DashboardOut(BaseModel):
    subject: SubjectBrief
    threshold: int
    metrics: DashboardMetrics
    trends: List[TrendPoint]
    students: List[ReportStudent]
    defaulters: List[ReportStudent]


class StudentLectureRecord(BaseModel):
    lecture_id: int
    lecture: str
    held_on: date
    status: AttendanceStatus


class StudentSubjectReport(BaseModel):
    subject_id: int
    subject: str
    total_lectures: int
    present: int
    percentage: float
    records: List[StudentLectureRecord]


class StudentReportOut(BaseModel):
    overall_percentage: float
    subjects: List[StudentSubjectReport]


class NotifyResult(BaseModel):
    queued: int
    skipped: int
    errors: List[str] = []
