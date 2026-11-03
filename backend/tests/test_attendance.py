from __future__ import annotations


def test_attendance_dashboard(client, teacher_headers):
    # Act
    response = client.get("/api/attendance/dashboard?subject_id=1&threshold=75", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["subject"]["id"] == 1
    assert "metrics" in data
    assert "overall_attendance" in data["metrics"]
    assert "total_students" in data["metrics"]
    assert "defaulters" in data


def test_student_my_attendance(client, student_headers):
    # Act
    response = client.get("/api/attendance/me", headers=student_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "overall_percentage" in data
    assert "subjects" in data
    assert len(data["subjects"]) >= 1


def test_export_attendance_csv(client, teacher_headers):
    # Act
    response = client.get("/api/attendance/subjects/1/export.csv", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]
    csv_text = response.text
    assert "Student" in csv_text or "Attendance" in csv_text or "Name" in csv_text


def test_export_attendance_pdf(client, teacher_headers):
    # Act
    response = client.get("/api/attendance/subjects/1/export.pdf", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    # PDF magic bytes
    assert response.content.startswith(b"%PDF")


def test_get_lecture_attendance(client, teacher_headers):
    # Act
    response = client.get("/api/lectures/1/attendance", headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["lecture"]["id"] == 1
    assert "students" in data
    assert len(data["students"]) >= 5


def test_save_lecture_attendance_batch(client, teacher_headers):
    # Arrange
    payload = {
        "records": [
            {"user_id": 3, "status": "P"},
            {"user_id": 4, "status": "A"},
        ]
    }

    # Act
    response = client.put("/api/lectures/1/attendance", json=payload, headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    statuses = {s["user_id"]: s["status"] for s in data["students"]}
    assert statuses.get(3) == "P"
    assert statuses.get(4) == "A"


def test_manual_attendance_mark_by_enrollment(client, teacher_headers):
    # Arrange (mark student 240233111029 present)
    payload = {
        "enrollment": "240233111029",
    }

    # Act
    response = client.post("/api/lectures/1/attendance/manual", json=payload, headers=teacher_headers)

    # Assert
    assert response.status_code == 200
    data = response.json()
    student_record = next((s for s in data["students"] if s["enrollment"] == "240233111029"), None)
    assert student_record is not None
    assert student_record["status"] == "P"
