from __future__ import annotations


def test_list_users_as_admin(client, admin_headers):
    # Act
    response = client.get("/api/users", headers=admin_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 7
    usernames = [u["username"] for u in data]
    assert "admin" in usernames
    assert "teacher" in usernames
    assert "student" in usernames


def test_list_users_unauthorized_for_student(client, student_headers):
    # Act
    response = client.get("/api/users", headers=student_headers)

    # Assert
    assert response.status_code == 403


def test_get_user_self(client, student_headers):
    # Act
    response = client.get("/api/users/3", headers=student_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 3
    assert data["username"] == "student"


def test_get_user_other_forbidden_for_student(client, student_headers):
    # Act (student tries to inspect teacher user 2)
    response = client.get("/api/users/2", headers=student_headers)

    # Assert
    assert response.status_code == 403


def test_create_user_by_admin(client, admin_headers):
    # Arrange
    payload = {
        "username": "instructor101",
        "name": "Prof. Alan Turing",
        "email": "alan@turing.org",
        "password": "Password123!",
        "role": "teacher",
    }

    # Act
    response = client.post("/api/users", json=payload, headers=admin_headers)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "instructor101"
    assert data["role"] == "teacher"


def test_update_user_by_admin(client, admin_headers):
    # Arrange (update user 3)
    payload = {
        "name": "Alexander Chen Updated",
    }

    # Act
    response = client.patch("/api/users/3", json=payload, headers=admin_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alexander Chen Updated"


def test_face_status_endpoint(client, student_headers):
    # Act
    response = client.get("/api/users/3/face", headers=student_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 3
    assert data["username"] == "student"
    assert "target" in data
    assert "ready" in data


def test_reset_face_enrollment_as_admin(client, admin_headers):
    # Act
    response = client.delete("/api/users/3/face", headers=admin_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "reset" in data["message"].lower()
