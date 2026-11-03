from __future__ import annotations

import contextlib
import threading
import time
from collections.abc import Sequence
from dataclasses import dataclass
from typing import List, Optional, Tuple

import cv2
import numpy as np

from app.core.config import get_settings
from app.core.errors import ValidationError

# Detector failures are common for low-quality frames; report them as user errors.
NO_FACE_MESSAGE = "No face detected. Use a clear, well-lit photo facing the camera."
MULTIPLE_FACE_MESSAGE = "Multiple faces detected. Capture one person per enrollment photo."


@dataclass
class DetectedFace:
    embedding: np.ndarray
    x: int
    y: int
    w: int
    h: int
    confidence: float
    is_real: bool


class FaceEngine:
    """Thread-safe wrapper around DeepFace with an in-memory embedding index.

    DeepFace models are not thread-safe, so every inference call is serialised.
    The index is rebuilt from the database when embeddings change.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._index_lock = threading.Lock()
        self._matrix: np.ndarray = np.zeros((0, 0), dtype=np.float32)
        self._user_ids: np.ndarray = np.zeros((0,), dtype=np.int64)
        self._warmed = False

    # ------------------------------------------------------------------ model
    def warm_up(self) -> None:
        settings = get_settings()
        if self._warmed:
            return
        try:
            from deepface import DeepFace

            with self._lock:
                DeepFace.build_model(settings.face_model)
                dummy = np.zeros((160, 160, 3), dtype=np.uint8)
                with contextlib.suppress(Exception):
                    DeepFace.extract_faces(
                        dummy,
                        detector_backend=settings.face_detector,
                        enforce_detection=False,
                    )
            self._warmed = True
        except Exception:  # pragma: no cover - model download / env specific
            # Warm-up is an optimisation; inference will retry lazily.
            self._warmed = False

    # ------------------------------------------------------------- inference
    def detect_faces(self, image_rgb: np.ndarray, enforce_detection: bool = True) -> List[DetectedFace]:
        settings = get_settings()
        if image_rgb.ndim != 3 or image_rgb.shape[2] != 3:
            raise ValidationError("Expected an RGB image.")

        # DeepFace uses OpenCV conventions internally (BGR).
        image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
        try:
            from deepface import DeepFace

            with self._lock:
                representations = DeepFace.represent(
                    img_path=image_bgr,
                    model_name=settings.face_model,
                    detector_backend=settings.face_detector,
                    enforce_detection=enforce_detection,
                    align=True,
                    normalization="base",
                    anti_spoofing=settings.face_anti_spoofing,
                )
            self._warmed = True
        except ValueError as exc:
            if "Face could not be detected" in str(exc):
                if enforce_detection:
                    raise ValidationError(NO_FACE_MESSAGE) from None
                return []
            raise ValidationError("Could not analyse the image, please try another photo.") from None
        except Exception as exc:  # pragma: no cover - depends on runtime model
            raise ValidationError(f"Face analysis failed: {exc}") from None

        if isinstance(representations, dict):
            representations = [representations]

        faces: List[DetectedFace] = []
        for item in representations or []:
            embedding = np.asarray(item.get("embedding", []), dtype=np.float32)
            if embedding.size == 0:
                continue
            area = item.get("facial_area") or {}
            confidence = float(item.get("face_confidence") or 0.0)
            if confidence and confidence < settings.face_min_confidence:
                continue
            faces.append(
                DetectedFace(
                    embedding=embedding,
                    x=int(area.get("x", 0)),
                    y=int(area.get("y", 0)),
                    w=int(area.get("w", 0)),
                    h=int(area.get("h", 0)),
                    confidence=confidence,
                    is_real=bool(item.get("is_real", True)),
                )
            )
        return faces

    @staticmethod
    def quality_ok(image_rgb: np.ndarray, face: DetectedFace) -> Tuple[bool, str]:
        """Reject tiny or blurry enrollment images before they pollute the index."""
        if face.w < 80 or face.h < 80:
            return False, "Face is too small in the frame. Move closer to the camera."
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        crop = gray[
            max(face.y, 0) : max(face.y + face.h, 1),
            max(face.x, 0) : max(face.x + face.w, 1),
        ]
        if crop.size == 0:
            return False, "Face crop was empty. Please retake the photo."
        variance = float(cv2.Laplacian(crop, cv2.CV_64F).var())
        if variance < 35:
            return False, "Image is blurry. Hold the camera steady and try again."
        return True, ""

    # ----------------------------------------------------------------- index
    def replace_index(self, entries: Sequence[Tuple[int, np.ndarray]]) -> None:
        cleaned: List[np.ndarray] = []
        user_ids: List[int] = []
        for user_id, vector in entries:
            norm = np.linalg.norm(vector)
            if norm == 0 or not np.isfinite(norm):
                continue
            cleaned.append(vector / norm)
            user_ids.append(user_id)

        with self._index_lock:
            if cleaned:
                self._matrix = np.vstack(cleaned).astype(np.float32)
                self._user_ids = np.asarray(user_ids, dtype=np.int64)
            else:
                self._matrix = np.zeros((0, 0), dtype=np.float32)
                self._user_ids = np.zeros((0,), dtype=np.int64)

    def add_to_index(self, user_id: int, vector: np.ndarray) -> None:
        norm = np.linalg.norm(vector)
        if norm == 0:
            return
        vector = (vector / norm).astype(np.float32)
        with self._index_lock:
            if self._matrix.size == 0:
                self._matrix = vector.reshape(1, -1)
                self._user_ids = np.asarray([user_id], dtype=np.int64)
            else:
                if vector.shape[0] != self._matrix.shape[1]:
                    return
                self._matrix = np.vstack([self._matrix, vector.reshape(1, -1)])
                self._user_ids = np.append(self._user_ids, np.int64(user_id))

    def search(self, embedding: np.ndarray) -> Optional[Tuple[int, float]]:
        """Return the best (user_id, cosine distance) match, or None."""
        with self._index_lock:
            if self._matrix.size == 0:
                return None
            matrix = self._matrix
            user_ids = self._user_ids
        norm = np.linalg.norm(embedding)
        if norm == 0:
            return None
        probe = embedding / norm
        distances = 1.0 - matrix @ probe
        if not np.isfinite(distances).any():
            return None
        best = int(np.argmin(distances))
        return int(user_ids[best]), float(distances[best])

    @property
    def size(self) -> int:
        with self._index_lock:
            return int(self._user_ids.shape[0])

    @property
    def is_warm(self) -> bool:
        return self._warmed


face_engine = FaceEngine()


def timed(fn):
    def wrapper(*args, **kwargs):
        started = time.perf_counter()
        result = fn(*args, **kwargs)
        return result, int((time.perf_counter() - started) * 1000)

    return wrapper


__all__ = [
    "DetectedFace",
    "FaceEngine",
    "MULTIPLE_FACE_MESSAGE",
    "NO_FACE_MESSAGE",
    "face_engine",
]
