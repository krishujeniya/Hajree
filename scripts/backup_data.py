#!/usr/bin/env python3
"""Backup utility for Hajree.

Creates timestamped backups of the SQLite database and enrolled face photos.
"""

import shutil
import sys
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings  # noqa: E402


def create_backup() -> Path:
    """Create a timestamped backup of database and biometric face assets."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = settings.data_dir / "backups" / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    print(f"Creating backup at: {backup_dir}")

    # Backup database
    db_file = None
    for candidate in [settings.data_dir / "hajree.db", settings.data_dir / "hajri.db"]:
        if candidate.exists():
            db_file = candidate
            break

    if db_file and db_file.exists():
        shutil.copy2(db_file, backup_dir / db_file.name)
        print(f"Database backed up: {db_file.name}")
    else:
        print("Database file not found")

    # Backup face images
    face_dir = settings.face_images_dir
    if face_dir.exists():
        shutil.copytree(face_dir, backup_dir / "face_images", dirs_exist_ok=True)
        print("Face images backed up")
    else:
        print("Face images directory not found")

    print(f"Backup complete: {backup_dir}")
    return backup_dir


def main() -> None:
    """Execute backup task."""
    print("Hajree Backup Utility\n")
    try:
        backup_path = create_backup()
        print(f"Backup saved to: {backup_path}")
    except Exception as e:
        print(f"Backup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
