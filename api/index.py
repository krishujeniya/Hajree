from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend directory is in the import search path
ROOT_DIR = Path(__file__).resolve().parent.parent
backend_dir = ROOT_DIR / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app  # noqa: E402

__all__ = ["app"]
