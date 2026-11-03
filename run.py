#!/usr/bin/env python3
"""
Hajree Launcher
Starts the FastAPI backend and serves the React SaaS Web UI.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"


def main():
    print("🚀 Initializing Hajree SaaS Platform...")

    # Build frontend if dist does not exist
    if not (FRONTEND_DIST / "index.html").exists():
        print("📦 Frontend build not detected. Building React assets...")
        bun_path = shutil.which("bun") or shutil.which("npm")
        if bun_path:
            pkg_cmd = ["bun", "run", "build"] if "bun" in bun_path else ["npm", "run", "build"]
            subprocess.run(pkg_cmd, cwd=str(ROOT_DIR / "frontend"), check=True)

    host = os.environ.get("HOST", "0.0.0.0")
    port = os.environ.get("PORT", "8000")
    reload_flag = ["--reload"] if "--reload" in sys.argv or "--dev" in sys.argv else []

    print(f"✨ Starting Hajree API & Web UI on http://localhost:{port}")
    print("   - Web UI & Dashboard: http://localhost:8000")
    print("   - API Documentation:  http://localhost:8000/docs")

    uv_path = shutil.which("uv")
    if uv_path:
        cmd = [
            "uv",
            "run",
            "uvicorn",
            "app.main:app",
            "--app-dir",
            "backend",
            "--host",
            host,
            "--port",
            port,
            *reload_flag,
        ]
        if sys.platform != "win32":
            try:
                os.execvp("uv", cmd)
            except OSError:
                subprocess.run(cmd)
                return
        else:
            subprocess.run(cmd)
            return

    venv_python = ROOT_DIR / ".venv" / ("bin" if sys.platform != "win32" else "Scripts") / "python"
    python_exe = str(venv_python) if venv_python.exists() else sys.executable

    cmd = [
        python_exe,
        "-m",
        "uvicorn",
        "app.main:app",
        "--app-dir",
        "backend",
        "--host",
        host,
        "--port",
        port,
        *reload_flag,
    ]
    subprocess.run(cmd)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Hajree shut down gracefully.")
