from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import attendance, auth, lectures, meta, recognition, subjects, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(subjects.router)
api_router.include_router(lectures.router)
api_router.include_router(attendance.router)
api_router.include_router(recognition.router)
api_router.include_router(meta.router)
