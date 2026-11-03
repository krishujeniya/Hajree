from __future__ import annotations


def test_login_success_with_username(client):
    # Arrange
    credentials = {"username": "admin", "password": "changeme"}

    # Act
    response = client.post("/api/auth/login", json=credentials)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"


def test_login_success_case_insensitive_email(client):
    # Arrange
    credentials = {"username": "ADMIN@example.com", "password": "changeme"}

    # Act
    response = client.post("/api/auth/login", json=credentials)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "admin"


def test_login_invalid_password(client):
    # Arrange
    credentials = {"username": "admin", "password": "incorrect_password"}

    # Act
    response = client.post("/api/auth/login", json=credentials)

    # Assert
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == "unauthorized"


def test_login_nonexistent_user(client):
    # Arrange
    credentials = {"username": "does_not_exist", "password": "password"}

    # Act
    response = client.post("/api/auth/login", json=credentials)

    # Assert
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == "unauthorized"


def test_register_student_success(client):
    # Arrange
    payload = {
        "username": "newstudent99",
        "name": "Jane Doe",
        "email": "janedoe99@example.com",
        "password": "Password123!",
    }

    # Act
    response = client.post("/api/auth/register", json=payload)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["username"] == "newstudent99"
    assert data["user"]["role"] == "student"
    assert "access_token" in data


def test_register_duplicate_username_conflict(client):
    # Arrange
    payload = {
        "username": "admin",
        "name": "Another Admin",
        "email": "unique_email@example.com",
        "password": "Password123!",
    }

    # Act
    response = client.post("/api/auth/register", json=payload)

    # Assert
    assert response.status_code == 409


def test_auth_me_authenticated(client, student_headers):
    # Act
    response = client.get("/api/auth/me", headers=student_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "student"
    assert data["role"] == "student"


def test_auth_me_unauthenticated(client):
    # Act
    response = client.get("/api/auth/me")

    # Assert
    assert response.status_code == 401


def test_logout(client, student_headers):
    # Act
    response = client.post("/api/auth/logout", headers=student_headers)

    # Assert
    assert response.status_code == 204
