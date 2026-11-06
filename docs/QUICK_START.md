# Hajree — Quick Start

Hajree is a FastAPI + React/TypeScript attendance application. The modern UI is served from the FastAPI server. The older Streamlit sources under `src/` are legacy and are not the recommended app entry point.

## Local setup

```bash
git clone https://github.com/krishujeniya/Hajree.git
cd Hajree
cp .env.example .env
# Configure your .env for the deployment.
python run.py
```

Open http://localhost:8000 for the public product site. Use **Open Hajree** to sign in, or **Student registration** to create a student account when registration is enabled. The authenticated workspace is also available at http://localhost:8000/app. API documentation is at http://localhost:8000/docs in environments where FastAPI docs are enabled.

## Frontend development

```bash
cd frontend
npm install
npm run dev
```

Vite listens on http://localhost:5173 and proxies `/api` to the FastAPI backend on port 8000. The repo includes a Bun lockfile if you prefer Bun.

## Docker

```bash
docker compose up --build
```

Open http://localhost:8000.

## Production security checklist

- Replace all bootstrap credentials before deployment. Never use `changeme` in a real institution.
- Set a strong `SECRET_KEY` and `ADMIN_PASSWORD` and use TLS/HTTPS.
- Review trusted hosts, CORS, database backups and the retention/deletion policy for biometric data.
- Get appropriate consent for face enrollment and retain a non-biometric attendance option.
- Anti-spoofing is **disabled by default** in `backend/app/core/config.py`; do not assume presentation-attack protection is active.
- Confirm faculty recognition results before finalizing attendance. Verify accuracy in your actual environment.

## Quality checks

```bash
cd frontend && npm run build
cd ..
python -m pytest backend/tests
```

See [README.md](../README.md), [Product Inventory](PRODUCT_INVENTORY.md), [Design System](DESIGN_SYSTEM.md), and [QA Report](QA_REPORT.md).
