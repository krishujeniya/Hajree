from __future__ import annotations

import numpy as np

from app.ml.face_engine import DetectedFace, FaceEngine


def test_detected_face_dataclass():
    # Arrange & Act
    embedding = np.array([0.1, 0.2, 0.3], dtype=np.float32)
    face = DetectedFace(
        embedding=embedding,
        x=10,
        y=20,
        w=100,
        h=100,
        confidence=0.98,
        is_real=True,
    )

    # Assert
    assert face.x == 10
    assert face.y == 20
    assert face.w == 100
    assert face.h == 100
    assert face.confidence == 0.98
    assert face.is_real is True
    assert face.embedding.size == 3


def test_face_engine_search_empty_index():
    # Arrange
    engine = FaceEngine()
    probe = np.array([1.0, 0.0, 0.0], dtype=np.float32)

    # Act
    result = engine.search(probe)

    # Assert
    assert result is None
    assert engine.size == 0


def test_face_engine_index_and_search_match():
    # Arrange
    engine = FaceEngine()
    vec1 = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    vec2 = np.array([0.0, 1.0, 0.0], dtype=np.float32)

    # Act
    engine.replace_index([(101, vec1), (102, vec2)])

    # Assert
    assert engine.size == 2
    # Search for vector identical to vec1
    match = engine.search(np.array([0.99, 0.01, 0.0], dtype=np.float32))
    assert match is not None
    user_id, distance = match
    assert user_id == 101
    assert distance < 0.05

    # Search for vector identical to vec2
    match2 = engine.search(np.array([0.0, 1.0, 0.0], dtype=np.float32))
    assert match2 is not None
    user_id2, distance2 = match2
    assert user_id2 == 102
    assert distance2 < 0.01


def test_face_engine_quality_ok_rejects_small_face():
    # Arrange
    engine = FaceEngine()
    dummy_img = np.zeros((200, 200, 3), dtype=np.uint8)
    small_face = DetectedFace(
        embedding=np.zeros(128, dtype=np.float32),
        x=10,
        y=10,
        w=40,  # Below 80px threshold
        h=40,
        confidence=0.95,
        is_real=True,
    )

    # Act
    ok, reason = engine.quality_ok(dummy_img, small_face)

    # Assert
    assert ok is False
    assert "small" in reason.lower()


def test_face_engine_quality_ok_rejects_blurry_face():
    # Arrange (solid uniform black has 0 Laplacian variance)
    engine = FaceEngine()
    dummy_img = np.zeros((300, 300, 3), dtype=np.uint8)
    large_uniform_face = DetectedFace(
        embedding=np.zeros(128, dtype=np.float32),
        x=20,
        y=20,
        w=150,
        h=150,
        confidence=0.95,
        is_real=True,
    )

    # Act
    ok, reason = engine.quality_ok(dummy_img, large_uniform_face)

    # Assert
    assert ok is False
    assert "blurry" in reason.lower()
