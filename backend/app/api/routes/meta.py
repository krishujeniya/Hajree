from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.base import get_db
from app.ml.face_engine import face_engine

router = APIRouter(tags=["meta"])


class AppMeta(BaseModel):
    app_name: str
    version: str
    environment: str
    self_registration: bool
    enrollment_target: int
    logo_url: Optional[str]
    docs_url: Optional[str]


class HealthResponse(BaseModel):
    status: str
    version: str


class ReadinessResponse(BaseModel):
    status: str
    database: bool
    face_index_entries: int
    model_warm: bool


@router.get("/meta", response_model=AppMeta)
def app_meta() -> AppMeta:
    settings = get_settings()
    logo = settings.assets_dir / "logo.png"
    return AppMeta(
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        self_registration=settings.allow_self_registration,
        enrollment_target=settings.enrollment_target_images,
        logo_url="/api/branding/logo" if logo.exists() else None,
        docs_url="/docs" if settings.debug or not settings.is_production else None,
    )


@router.get("/branding/logo", include_in_schema=False)
def branding_logo() -> FileResponse:
    settings = get_settings()
    logo = settings.assets_dir / "logo.png"
    if not logo.exists():
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Logo not found")
    return FileResponse(logo, media_type="image/png")


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", version=get_settings().app_version)


@router.get("/health/ready", response_model=ReadinessResponse)
def readiness(db: Session = Depends(get_db)) -> ReadinessResponse:
    database_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        database_ok = False
    status = "ok" if database_ok and face_engine.is_warm else "degraded"
    return ReadinessResponse(
        status=status,
        database=database_ok,
        face_index_entries=face_engine.size,
        model_warm=face_engine.is_warm,
    )
