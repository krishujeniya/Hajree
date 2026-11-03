from __future__ import annotations

from typing import Any, Dict, Optional


class AppError(Exception):
    """Domain error rendered as a consistent JSON payload."""

    def __init__(
        self,
        status_code: int,
        message: str,
        code: str = "error",
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.code = code
        self.extra = extra or {}


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(404, message, "not_found")


class ConflictError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(409, message, "conflict")


class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action") -> None:
        super().__init__(403, message, "forbidden")


class AuthenticationError(AppError):
    def __init__(self, message: str = "Invalid authentication credentials") -> None:
        super().__init__(401, message, "unauthorized")


class ValidationError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(422, message, "validation_error")
