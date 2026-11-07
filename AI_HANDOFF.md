# AI Handoff — Hajree Platform Bug Resolution & Production Deployment

## Deployment Status (Live & Verified)
1. **Frontend (GitHub Pages)**:
   - **Live URL**: `https://krishujeniya.github.io/Hajree/`
   - **Repository**: `krishujeniya/Hajree`
   - **Deployment Mechanism**: GitHub Actions workflow (`.github/workflows/deploy-pages.yml`)
   - **Configured Variable**: `VITE_API_URL=https://hajree.vercel.app/api`
   - **Verification**: HTTP/2 200, valid SPA assets loaded with `/Hajree/` base prefix.

2. **Backend (Vercel Serverless ASGI)**:
   - **Live URL**: `https://hajree.vercel.app`
   - **Project**: `itzkrishujeniya/hajree`
   - **Vercel Runtime**: Python 3.12 (`vercel-runtime>=0.24.1`)
   - **Vercel Feature**: `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` (Fluid Compute for ML dependencies)
   - **Configured Environment Variables**:
     - `VERCEL_SUPPORT_LARGE_FUNCTIONS=1`
     - `CORS_ORIGINS=https://krishujeniya.github.io`
     - `COOKIE_SAMESITE=none`
     - `COOKIE_SECURE=true`
     - `FACE_WARMUP=false`
     - `ENVIRONMENT=production`
     - `ADMIN_PASSWORD=<configured>`
     - `SECRET_KEY=<configured>`
   - **Verification**:
     - `GET https://hajree.vercel.app/api/health` -> HTTP 200 `{"status":"ok","version":"2.0.0"}`
     - `GET https://hajree.vercel.app/api/meta` -> HTTP 200 `{"app_name":"Hajree","version":"2.0.0",...}`
     - `OPTIONS https://hajree.vercel.app/api/auth/login` -> HTTP 200 with CORS headers
     - `POST https://hajree.vercel.app/api/auth/login` -> HTTP 200 with `SameSite=None; Secure` cookies

## Git State
- **Branch**: `main`
- **Latest Commit**: `a507684`
- **Remote Origin**: `https://github.com/krishujeniya/Hajree.git`
- **Working Tree**: Clean

## Key Configuration Files
- `api/index.py`: Serverless ASGI entrypoint restoring `scope["path"]` and `scope["query_string"]` from rewrite parameters.
- `vercel.json`: Path routing rules using named parameters (`:match*`) mapping to `/api/index.py?__path=...`.
- `requirements.txt`: Root dependencies for Vercel build.
- `backend/app/ml/face_engine.py`: Safe OpenCV fallback to prevent missing `libGL.so.1` failures in serverless environments.
- `.github/workflows/deploy-pages.yml`: GitHub Actions automated deployment with SPA 404 fallback.
- `frontend/vite.config.ts`: Configured dynamic base path (`process.env.VITE_BASE_PATH || "./"`).

## Verification Checks
- **UI Audit**: `node scripts/audit-ui.mjs` (PASS: 13 views verified)
- **GitHub Pages**: `curl -ILs https://krishujeniya.github.io/Hajree/` (HTTP/2 200)
- **Vercel API Health**: `curl -s https://hajree.vercel.app/api/health` (HTTP/2 200)
- **Vercel Admin Auth**: `curl -X POST https://hajree.vercel.app/api/auth/login` (HTTP/2 200)
