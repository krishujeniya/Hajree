from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.logging import (
    RequestContextMiddleware,
    SecurityHeadersMiddleware,
    configure_logging,
    request_id_ctx,
)
from app.core.ratelimit import limiter
from app.db.init_db import init_database, start_warmup_thread

logger = logging.getLogger("hajree.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    init_database()
    start_warmup_thread()
    logger.info("Hajree API is ready")
    yield
    logger.info("Hajree API shut down")


def _error(status: int, message: str, code: str, extra: dict | None = None) -> JSONResponse:
    payload = {"detail": message, "code": code}
    if extra:
        payload.update(extra)
    return JSONResponse(status_code=status, content=payload)


def create_app() -> FastAPI:
    settings = get_settings()
    docs_enabled = settings.debug or not settings.is_production

    app = FastAPI(
        title=f"{settings.app_name} API",
        version=settings.app_version,
        description="Face-recognition attendance platform.",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
        lifespan=lifespan,
    )

    app.state.limiter = limiter

    # --- Middleware (last added = outermost) ---
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition", "X-Request-ID"],
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_host_list)
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    # --- Exception handlers ---
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return _error(exc.status_code, exc.message, exc.code, exc.extra)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = []
        for error in exc.errors():
            field = ".".join(str(part) for part in error.get("loc", [])[1:]) or "request"
            errors.append({"field": field, "message": error.get("msg", "Invalid value")})
        message = errors[0]["message"] if errors else "Please check the submitted values."
        if errors:
            message = f"{errors[0]['field']}: {message}"
        return _error(422, message, "validation_error", {"errors": errors})

    @app.exception_handler(RateLimitExceeded)
    async def handle_rate_limit(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return _error(429, "Too many requests. Please wait a moment and try again.", "rate_limited")

    @app.exception_handler(IntegrityError)
    async def handle_integrity(request: Request, exc: IntegrityError) -> JSONResponse:
        logger.warning("Database constraint violation", exc_info=exc)
        return _error(409, "That change conflicts with existing data.", "conflict")

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled server error")
        return _error(
            500,
            "Something went wrong on our side. Please try again.",
            "internal_error",
            {"request_id": request_id_ctx.get()},
        )

    # --- Routes ---
    app.include_router(api_router, prefix=settings.api_prefix)

    # --- Single-page app (built assets) ---
    dist = settings.frontend_dist
    index_file = dist / "index.html"
    if index_file.exists():
        from fastapi.staticfiles import StaticFiles

        assets_dir = dist / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="spa-assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa(full_path: str):
            api_root = settings.api_prefix.strip("/")
            if full_path == api_root or full_path.startswith(f"{api_root}/"):
                raise HTTPException(status_code=404, detail="Not found")
            candidate = (dist / full_path).resolve()
            if full_path and candidate.is_file() and candidate.is_relative_to(dist.resolve()):
                return FileResponse(candidate)
            return FileResponse(index_file)
    else:

        @app.get("/", include_in_schema=False)
        async def root() -> dict:
            return {
                "app": settings.app_name,
                "version": settings.app_version,
                "api": settings.api_prefix,
                "docs": "/docs",
            }

    return app


app = create_app()
