# Stage 1: Build React Frontend
FROM oven/bun:1.1-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package.json ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install
COPY frontend/ ./
RUN bun run build

# Stage 2: Python Backend & Unified Platform
FROM python:3.11-slim
WORKDIR /app

# System dependencies for OpenCV and headless graphics
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast, reliable Python dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock* ./
RUN uv pip install --system -r pyproject.toml

# Copy backend and root files
COPY backend ./backend
COPY assets ./assets
COPY --from=frontend-builder /build/dist ./frontend/dist
COPY run.py .

# Storage directories
RUN mkdir -p data/face_images data/reports

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:8000/api/health || exit 1

ENV HOST=0.0.0.0
ENV PORT=8000

CMD ["uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
