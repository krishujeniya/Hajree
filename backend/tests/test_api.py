from __future__ import annotations


def test_meta_endpoint(client):
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "Hajree"
    assert "version" in data


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_auth_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "changeme"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"


def test_auth_login_invalid(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "code" in response.json()


def test_auth_me(client, admin_headers):
    response = client.get("/api/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"


def test_subjects_list(client, teacher_headers):
    response = client.get("/api/subjects", headers=teacher_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    subject_names = [s["name"] for s in data]
    assert any("Computer Vision" in name for name in subject_names)


def test_attendance_dashboard(client, teacher_headers):
    response = client.get("/api/attendance/dashboard?subject_id=1", headers=teacher_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["subject"]["id"] == 1
    assert "overall_attendance" in data["metrics"]
    assert "total_students" in data["metrics"]
    assert "defaulters" in data


def test_student_attendance_me(client, student_headers):
    response = client.get("/api/attendance/me", headers=student_headers)
    assert response.status_code == 200
    data = response.json()
    assert "overall_percentage" in data
    assert "subjects" in data
    assert len(data["subjects"]) >= 1


def test_spa_static_path_traversal(client):
    response = client.get("/../../../etc/passwd")
    assert response.status_code in (404, 200)
    # Ensure arbitrary system file is never returned
    assert "root:x:" not in response.text
