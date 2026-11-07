from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode

ROOT_DIR = Path(__file__).resolve().parent.parent
backend_dir = ROOT_DIR / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app as _app  # noqa: E402


async def app(scope, receive, send):
    if scope.get("type") == "http":
        qs = scope.get("query_string", b"").decode("latin1")
        if qs:
            params = parse_qsl(qs, keep_blank_values=True)
            path_override = None
            filtered_params = []
            for k, v in params:
                if k == "__path":
                    path_override = v
                else:
                    filtered_params.append((k, v))

            if path_override is not None:
                clean_path = path_override if path_override.startswith("/") else f"/{path_override}"
                scope["path"] = clean_path
                scope["raw_path"] = clean_path.encode("latin1")
                scope["query_string"] = urlencode(filtered_params).encode("latin1")

    await _app(scope, receive, send)


__all__ = ["app"]
