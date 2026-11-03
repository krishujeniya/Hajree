from __future__ import annotations


def test_list_subjects(client, teacher_headers):
    # Act
    response = client.get("/api/subjects", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    names = [s["name"] for s in data]
    assert any("Computer Vision" in n for n in names)


def test_create_subject_as_admin(client, admin_headers):
    # Arrange
    payload = {"name": "CS401 - Artificial Intelligence & Robotics"}

    # Act
    response = client.post("/api/subjects", json=payload, headers=admin_headers)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "CS401 - Artificial Intelligence & Robotics"
    assert "id" in data


def test_create_subject_unauthorized_for_student(client, student_headers):
    # Arrange
    payload = {"name": "Hacking Course"}

    # Act
    response = client.post("/api/subjects", json=payload, headers=student_headers)

    # Assert
    assert response.status_code == 403


def test_get_subject_details(client, teacher_headers):
    # Act
    response = client.get("/api/subjects/1", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert "Computer Vision" in data["name"]


def test_list_subject_students(client, teacher_headers):
    # Act
    response = client.get("/api/subjects/1/students", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    usernames = [s["enrollment"] for s in data]
    assert "student" in usernames


def test_create_subject_lecture(client, teacher_headers):
    # Arrange
    payload = {
        "name": "Lecture 5: Neural Embedding Projections",
    }

    # Act
    response = client.post("/api/subjects/1/lectures", json=payload, headers=teacher_headers)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Lecture 5: Neural Embedding Projections"
    assert data["subject_id"] == 1


def test_list_subject_lectures(client, teacher_headers):
    # Act
    response = client.get("/api/subjects/1/lectures", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
