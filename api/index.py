from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend directory is in the import search path
ROOT_DIR = Path(__file__).resolve().parent.parent
backend_dir = ROOT_DIR / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app as _app  # noqa: E402


async def app(scope, receive, send):
    if scope.get("type") == "http":
        headers = dict(scope.get("headers", []))
        # Vercel edge proxy populates original path in x-forwarded-uri or x-matched-path
        orig_uri = (
            headers.get(b"x-forwarded-uri", b"").decode("latin1")
            or headers.get(b"x-matched-path", b"").decode("latin1")
        )
        if orig_uri and scope.get("path") in {"/api/index.py", "/api/index", "/api"}:
            clean_path = orig_uri.split("?")[0]
            scope["path"] = clean_path
            scope["raw_path"] = clean_path.encode("latin1")
    await _app(scope, receive, send)


__all__ = ["app"]
