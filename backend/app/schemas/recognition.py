from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class FaceArea(BaseModel):
    x: int
    y: int
    w: int
    h: int


class RecognizedFace(BaseModel):
    index: int
    matched: bool
    user_id: Optional[int] = None
    enrollment: Optional[str] = None
    name: Optional[str] = None
    distance: Optional[float] = None
    confidence: float = 0.0
    is_real: bool = True
    area: FaceArea


class RecognitionOut(BaseModel):
    width: int
    height: int
    faces: List[RecognizedFace]
    matched_count: int
    unmatched_count: int
    elapsed_ms: int


class EnrollmentStatusOut(BaseModel):
    user_id: int
    username: str
    count: int
    target: int
    ready: bool


class EnrollmentUploadOut(BaseModel):
    count: int
    target: int
    ready: bool
    face_confidence: float
