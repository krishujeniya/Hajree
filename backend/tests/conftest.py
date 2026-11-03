from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.core.security import create_access_token
from app.db.base import Base, get_db
from app.db.init_db import _seed_demo_data
from app.main import app

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)
with TestSessionLocal() as session:
    _seed_demo_data(session)


@pytest.fixture
def db_session():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers():
    token = create_access_token(user_id=1, version=0)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def teacher_headers():
    token = create_access_token(user_id=2, version=0)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_headers():
    token = create_access_token(user_id=3, version=0)
    return {"Authorization": f"Bearer {token}"}
