from __future__ import annotations

import logging
import threading
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.enums import AttendanceSource, AttendanceStatus, Role
from app.core.security import hash_password
from app.db import models  # noqa: F401 - register ORM metadata
from app.db.base import Base, SessionLocal, engine
from app.db.models import (
    Attendance,
    Lecture,
    StudentSubject,
    Subject,
    TeacherSubject,
    User,
)
from app.ml.face_engine import face_engine
from app.services import face_service

logger = logging.getLogger("hajree.startup")


def _seed_demo_data(db: Session) -> None:
    settings = get_settings()
    # 1. Admin
    admin = User(
        username=settings.admin_username,
        name=settings.admin_name,
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        role=Role.ADMIN,
    )
    # 2. Teacher
    teacher = User(
        username="teacher",
        name="Prof. Sarah Jenkins",
        email="teacher@hajree.ai",
        password_hash=hash_password("changeme"),
        role=Role.TEACHER,
    )
    # 3. Students
    students_data = [
        ("student", "Alex Chen", "student@hajree.ai"),
        ("240233111029", "Rahul Sharma", "rahul@hajree.ai"),
        ("240233111030", "Priya Patel", "priya@hajree.ai"),
        ("240233111031", "Aarav Mehta", "aarav@hajree.ai"),
        ("240233111032", "Ananya Desai", "ananya@hajree.ai"),
    ]
    student_users: list[User] = []
    for username, name, email in students_data:
        student_users.append(
            User(
                username=username,
                name=name,
                email=email,
                password_hash=hash_password("changeme"),
                role=Role.STUDENT,
            )
        )

    db.add(admin)
    db.add(teacher)
    for s in student_users:
        db.add(s)
    db.flush()

    # 4. Subjects
    sub1 = Subject(name="CS301 - Computer Vision & Deep Learning")
    sub2 = Subject(name="CS204 - Data Structures & Algorithms")
    db.add_all([sub1, sub2])
    db.flush()

    # 5. Teacher Assignment
    db.add(TeacherSubject(user_id=teacher.id, subject_id=sub1.id))
    db.add(TeacherSubject(user_id=teacher.id, subject_id=sub2.id))

    # 6. Student Enrollment
    for s in student_users:
        db.add(StudentSubject(user_id=s.id, subject_id=sub1.id))
        db.add(StudentSubject(user_id=s.id, subject_id=sub2.id))
    db.flush()

    # 7. Lectures & Attendance History
    today = date.today()
    lectures_data = [
        (sub1.id, "Lecture 1: Introduction to Face Embeddings", today - timedelta(days=10)),
        (sub1.id, "Lecture 2: SFace & CNN Architecture", today - timedelta(days=7)),
        (sub1.id, "Lecture 3: Real-time OpenCV Pipeline", today - timedelta(days=3)),
        (sub1.id, "Lecture 4: Anti-Spoofing & Liveness", today - timedelta(days=1)),
        (sub2.id, "Lecture 1: Asymptotic Complexity & Trees", today - timedelta(days=8)),
        (sub2.id, "Lecture 2: Graph Traversal & Dijkstra", today - timedelta(days=4)),
    ]

    for idx, (sub_id, name, held_on) in enumerate(lectures_data):
        lec = Lecture(
            subject_id=sub_id,
            name=name,
            held_on=held_on,
            created_by_id=teacher.id,
        )
        db.add(lec)
        db.flush()

        for _s_idx, s in enumerate(student_users):
            # Give realistic attendance: Alex has 100%, Rahul 75%, Priya 100%, Aarav 50% (defaulter), Ananya 100%
            is_present = True
            if s.username == "240233111031" and idx % 2 == 1 or s.username == "240233111029" and idx == 3:
                is_present = False

            db.add(
                Attendance(
                    lecture_id=lec.id,
                    user_id=s.id,
                    status=AttendanceStatus.PRESENT if is_present else AttendanceStatus.ABSENT,
                    source=AttendanceSource.BULK,
                    marked_by_id=teacher.id,
                )
            )

    db.commit()
    logger.info("Created bootstrap admin user '%s' and rich demo data", settings.admin_username)


def init_database() -> None:
    settings = get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.face_images_dir.mkdir(parents=True, exist_ok=True)

    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        user_count = int(db.execute(select(func.count(User.id))).scalar_one())
        if user_count == 0:
            _seed_demo_data(db)
        else:
            # Ensure bootstrap admin exists and has valid credentials
            admin = db.execute(select(User).where(User.role == Role.ADMIN)).scalars().first()
            if admin:
                admin.username = settings.admin_username
                admin.password_hash = hash_password(settings.admin_password)
                admin.is_active = True
                db.commit()
            else:
                db.add(
                    User(
                        username=settings.admin_username,
                        name=settings.admin_name,
                        email=settings.admin_email,
                        password_hash=hash_password(settings.admin_password),
                        role=Role.ADMIN,
                    )
                )
                db.commit()

        entries = face_service.load_index(db)
        logger.info("Loaded %s face embeddings into the recognition index", entries)


def warm_up_face_model() -> None:
    logger.info("Warming up the face recognition model")
    face_engine.warm_up()
    logger.info("Face recognition model ready")


def start_warmup_thread() -> None:
    settings = get_settings()
    if not settings.face_warmup:
        return
    thread = threading.Thread(target=warm_up_face_model, name="face-warmup", daemon=True)
    thread.start()
