from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend directory is in the import search path
ROOT_DIR = Path(__file__).resolve().parent.parent
backend_dir = ROOT_DIR / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import logging
from app.main import app as _app  # noqa: E402

logger = logging.getLogger("hajree.vercel")


async def app(scope, receive, send):
    if scope.get("type") == "http":
        headers = dict(scope.get("headers", []))
        # Extract headers to check for original request path
        header_map = {k.decode("latin1").lower(): v.decode("latin1", errors="replace") for k, v in headers.items()}
        orig_uri = (
            header_map.get("x-forwarded-uri")
            or header_map.get("x-matched-path")
            or header_map.get("x-now-route-matches")
            or header_map.get("x-vercel-forwarded-for")
        )
        logger.info(
            "Vercel request: scope_path=%s, matched_path=%s, forwarded_uri=%s, all_headers=%s",
            scope.get("path"),
            header_map.get("x-matched-path"),
            header_map.get("x-forwarded-uri"),
            list(header_map.keys()),
        )
        path_override = header_map.get("x-forwarded-uri") or header_map.get("x-matched-path")
        if path_override and scope.get("path") in {"/api/index.py", "/api/index", "/api"}:
            clean_path = path_override.split("?")[0]
            scope["path"] = clean_path
            scope["raw_path"] = clean_path.encode("latin1")
    await _app(scope, receive, send)


__all__ = ["app"]
