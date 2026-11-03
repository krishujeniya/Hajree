from __future__ import annotations

import contextlib
import io
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings
from app.core.errors import ValidationError

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_DIMENSION = 2000


def read_upload(upload: UploadFile) -> bytes:
    settings = get_settings()
    if upload.content_type and upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError("Unsupported image type. Use JPEG, PNG or WebP.")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = upload.file.read(max_bytes + 1)
    if not data:
        raise ValidationError("The uploaded file is empty.")
    if len(data) > max_bytes:
        raise ValidationError(f"Image is larger than {settings.max_upload_mb} MB.")
    return data


def open_image(data: bytes) -> Image.Image:
    """Decode image bytes, validating them and normalising orientation."""
    try:
        with Image.open(io.BytesIO(data)) as probe:
            probe.verify()
        image = Image.open(io.BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError):
        raise ValidationError("The file is not a valid image.") from None

    image = image.convert("RGB")
    if max(image.size) > MAX_IMAGE_DIMENSION:
        image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)
    return image


def save_enrollment_image(user_id: int, image: Image.Image) -> Path:
    """Persist a re-encoded copy (strips metadata) and return its path."""
    settings = get_settings()
    folder = settings.face_images_dir / str(user_id)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{uuid.uuid4().hex}.jpg"
    image.save(path, format="JPEG", quality=90, optimize=True)
    return path


def delete_user_images(user_id: int) -> None:
    folder = get_settings().face_images_dir / str(user_id)
    if folder.exists():
        shutil.rmtree(folder, ignore_errors=True)


def remove_file(path: str | Path) -> None:
    with contextlib.suppress(OSError, ValueError):
        Path(path).unlink(missing_ok=True)
