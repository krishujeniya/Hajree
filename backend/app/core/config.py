from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = ROOT_DIR / ".env"

_DEFAULT_SECRET = "change-me-in-production"


def _default_data_dir() -> Path:
    if os.environ.get("VERCEL"):
        return Path("/tmp/data")
    return ROOT_DIR / "data"


class Settings(BaseSettings):
    """Typed application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "Hajree"
    app_version: str = "2.0.0"
    environment: Literal["development", "production", "test"] = "development"
    debug: bool = False
    api_prefix: str = "/api"
    log_level: str = "INFO"

    # --- Security ---
    secret_key: SecretStr = SecretStr(_DEFAULT_SECRET)
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 7
    password_min_length: int = 8
    login_rate_limit: str = "10/minute"
    registration_rate_limit: str = "5/hour"
    password_reset_rate_limit: str = "5/hour"
    cookie_secure: Optional[bool] = None
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    trusted_hosts: str = "*"

    # --- CORS (comma separated origins) ---
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Storage ---
    data_dir: Path = Field(default_factory=_default_data_dir)
    database_url: Optional[str] = None
    auto_create_tables: bool = True

    # --- Bootstrap admin ---
    admin_username: str = "admin"
    admin_password: str = "changeme"
    admin_email: str = "admin@example.com"
    admin_name: str = "Default Admin"

    # --- Registration ---
    allow_self_registration: bool = True

    # --- Face recognition ---
    face_model: str = "SFace"
    face_detector: str = "yunet"
    face_distance_threshold: float = 0.60
    face_min_confidence: float = 0.65
    face_anti_spoofing: bool = False
    face_warmup: bool = True
    enrollment_target_images: int = 10
    max_upload_mb: int = 10

    # --- Email ---
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    email_from: Optional[str] = None
    email_from_name: str = "Hajree"

    # --- Frontend ---
    frontend_url: str = "http://localhost:5173"
    frontend_dist: Path = Field(default_factory=lambda: ROOT_DIR / "frontend" / "dist")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cookie_is_secure(self) -> bool:
        if self.cookie_secure is not None:
            return self.cookie_secure
        if self.cookie_samesite == "none":
            return True
        return self.is_production

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def trusted_host_list(self) -> List[str]:
        return [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        legacy_db = self.data_dir / "hajri.db"
        if legacy_db.exists() and not (self.data_dir / "hajree.db").exists():
            return f"sqlite:///{legacy_db.as_posix()}"
        return f"sqlite:///{(self.data_dir / 'hajree.db').as_posix()}"

    @property
    def face_images_dir(self) -> Path:
        return self.data_dir / "face_images"

    @property
    def assets_dir(self) -> Path:
        return ROOT_DIR / "assets"

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_username and self.smtp_password)

    @property
    def sender_email(self) -> Optional[str]:
        return self.email_from or self.smtp_username

    @model_validator(mode="after")
    def _validate_production_secrets(self) -> Settings:
        secret = self.secret_key.get_secret_value()
        if self.is_production:
            if secret == _DEFAULT_SECRET or len(secret) < 32:
                raise ValueError(
                    "SECRET_KEY must be set to a random value of at least 32 characters in production."
                )
            if self.admin_password in {"changeme", "admin", ""}:
                raise ValueError("ADMIN_PASSWORD must be changed in production.")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def load_legacy_env_fallback() -> None:
    """Map legacy environment variable names when the new ones are absent."""
    aliases = {
        "SMTP_USERNAME": "SENDER_EMAIL",
        "SMTP_PASSWORD": "SENDER_PASSWORD",
    }
    for target, legacy in aliases.items():
        if not os.getenv(target) and os.getenv(legacy):
            os.environ[target] = os.environ[legacy]
    if not os.getenv("EMAIL_FROM") and os.getenv("SENDER_EMAIL"):
        os.environ["EMAIL_FROM"] = os.environ["SENDER_EMAIL"]


load_legacy_env_fallback()
