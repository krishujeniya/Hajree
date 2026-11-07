# Hajree Platform — Deployment Guide

This guide details how to deploy the **FastAPI backend on Vercel** and the **React frontend on GitHub Pages**.

---

## 1. Frontend Deployment on GitHub Pages

The frontend is a React + Vite + TypeScript application configured to build with relative asset links and automated SPA routing fallback (`404.html`).

### Step 1: Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub: `https://github.com/<username>/Hajree`.
2. Click **Settings** → **Pages** (under the "Code and automation" section).
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.

### Step 2: Configure Environment Variables
1. In repository **Settings** → **Secrets and variables** → **Actions**.
2. Switch to the **Variables** tab.
3. Click **New repository variable**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://<your-vercel-backend-name>.vercel.app/api`
   *(Leave blank or set to `/api` if testing locally).*

### Step 3: Trigger the Deployment
- Push changes to the `main` branch affecting `frontend/**` or `.github/workflows/deploy-pages.yml`.
- Or manually trigger it:
  1. Go to the **Actions** tab on GitHub.
  2. Select **Deploy Frontend to GitHub Pages**.
  3. Click **Run workflow** → select branch `main` → click **Run workflow**.

Your site will be live at:
```
https://<username>.github.io/Hajree/
```

---

## 2. Backend Deployment on Vercel

The backend entrypoint is configured in `api/index.py` and routed via `vercel.json` to the FastAPI ASGI application.

### Step 1: Import Project into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select your GitHub repository (`Hajree`).
4. Keep the **Framework Preset** as **Other**.
5. Set the **Root Directory** to `./` (repository root).

### Step 2: Set Environment Variables on Vercel
Under **Settings** → **Environment Variables**, add the following:

| Variable Name | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `VERCEL_SUPPORT_LARGE_FUNCTIONS` | `1` | Enables bundle support up to 5 GB on Fluid Compute for deep learning packages |
| `CORS_ORIGINS` | `https://<username>.github.io` | Allows cross-origin API requests from GitHub Pages |
| `COOKIE_SAMESITE` | `none` | Allows session cookies to be shared cross-origin between `github.io` and `vercel.app` |
| `COOKIE_SECURE` | `true` | Required by browsers when `SameSite=None` |
| `SECRET_KEY` | *(Generate a 64-char random string)* | Production secret for signing JWT access and refresh tokens |
| `FACE_WARMUP` | `false` | Disables background warmup thread to avoid cold start execution hangs |
| `ENVIRONMENT` | `production` | Enables production security guardrails |
| `DATABASE_URL` | `postgresql://user:pass@host/dbname` | *(Optional/Recommended)* Remote PostgreSQL database (e.g. Neon, Supabase). Defaults to `/tmp/data/hajree.db` (ephemeral) |

### Step 3: Deploy
Click **Deploy**. Vercel will install the dependencies from `requirements.txt` and launch the API serverless handler.

Your API health endpoint will be accessible at:
```
https://<your-project>.vercel.app/api/health/ready
```

---

## 3. Architecture & Operational Considerations

- **Serverless vs Containerized Backend**:
  Vercel serverless functions have ephemeral file storage (wiped when instances spin down) and execution time limits.
  - If you use Vercel, attach an external managed PostgreSQL database (`DATABASE_URL`) to persist attendance records.
  - For full-speed biometric facial analysis with local embeddings and SQLite, consider deploying via the provided `Dockerfile` / `docker-compose.yml` on Render, Railway, or VPS.
