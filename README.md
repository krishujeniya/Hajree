# 🎓 Hajree — Next-Generation AI Attendance Platform

<div align="center">

[![GitHub repo](https://img.shields.io/badge/GitHub-krishujeniya%2FHajree-indigo.svg)](https://github.com/krishujeniya/Hajree)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![DeepFace](https://img.shields.io/badge/DeepFace-SFace-blueviolet.svg)](https://github.com/serengil/deepface)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**An open-source attendance management platform with faculty-reviewed facial matching, manual roll call, reports, and role-based portals.**

[Features](#-features) • [Site & App](#-site--application) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Guide](#-api-endpoints) • [Docker](#-docker-deployment)

</div>

---

## ✨ Features

### 🔐 Three Role-Based SaaS Portals
- **Admin Portal**: User account lifecycle management, course & subject allocation, student roster enrollment, and AI engine health diagnostics.
- **Faculty Portal**: Real-time classroom attendance tracking via live webcam or group photo, interactive match verification chips, manual attendance sheet matrix, low-attendance defaulter (<75%) identification, and automated email alerts.
- **Student Portal**: Real-time personal attendance percentage with radial visual gauge, examination eligibility badge, course-wise breakdowns, chronological lecture logs, and self-service biometric face profile training.

### 🤖 Assisted Biometric Face Recognition
- **DeepFace SFace CNN**: High-accuracy, fast cosine distance matching against enrolled face vector embeddings.
- **Group Capture**: Take attendance for an entire classroom from a single wide-angle photo or live webcam snapshot.
- **Anti-Spoofing Configuration**: Optional; **disabled by default** (`face_anti_spoofing=False`). Do not assume spoof resistance without explicitly enabling, validating, and testing the feature in your deployment.
- **Vector Indexing**: Embedded vectors stored and loaded into memory for sub-second recognition.

### 📊 Reports & Automated Notifications
- **One-Click Export**: Download official attendance records in print-ready PDF format or tabular CSV spreadsheets.
- **Automated Defaulter Alerts**: Background task email dispatcher alerting students who drop below the required 75% attendance threshold.

---

## 🌐 Site & Application

Hajree now includes a dedicated product-facing home page as the front door to the existing application. It uses original light-themed art direction, a decorative particle canvas, a three-step classroom journey, role selectors, a faculty-review concept preview, open-source setup instructions, and an accessible FAQ. The preview is illustrative, **not a real biometric result**.

| Route | Purpose |
| --- | --- |
| `/` | Public project landing page |
| `/login` | Existing sign-in flow |
| `/register` | Student self-registration |
| `/app` | Existing role-based Admin, Faculty, and Student workspace |
| `/docs` | FastAPI OpenAPI documentation when enabled |

The product site does not modify the existing API or recognition code. Its hero uses no live face images. Facial recognition requires faculty verification, appropriate consent, and a manual alternative for people who cannot or do not wish to enroll a face profile.

Design and quality documents:
- [Design system and effects coverage](docs/DESIGN_SYSTEM.md)
- [Confirmed product inventory](docs/PRODUCT_INVENTORY.md)
- [QA report and unrun checks](docs/QA_REPORT.md)
- [Updated quick start](docs/QUICK_START.md)

---

## 🚀 Quick Start

### 1. One-Command Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/krishujeniya/Hajree.git
cd Hajree

# Install dependencies and start Hajree (FastAPI + React SaaS SPA)
python run.py
```

With compatible dependencies and configuration, the unified application will:
1. Initialize the SQLite database with rich demo data
2. Warm up the SFace facial recognition model
3. Serve both the **SaaS Web UI** at `http://localhost:8000` and **Interactive OpenAPI Docs** at `http://localhost:8000/docs`

### 2. Built-in Demo Credentials

For local development, demo-login shortcuts are available in Vite development mode only. The production login form does not show shared demo credentials. Initial demo users (if seeded) include:
- **Admin**: `admin` / `changeme`
- **Faculty**: `teacher` / `changeme`
- **Student**: `student` / `changeme`

---

## 🛠️ Architecture

```
Hajree/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # REST Endpoints (auth, users, subjects, lectures, attendance, recognition, meta)
│   │   ├── core/             # Configuration, security, rate limiting, logging
│   │   ├── db/               # SQLAlchemy models & database initialization
│   │   ├── ml/               # DeepFace SFace feature extractor & vector search
│   │   ├── schemas/          # Pydantic v2 validation contracts
│   │   └── services/         # Business logic (attendance, report, email, face service)
│   └── tests/                # Automated pytest unit test suite
├── frontend/                 # Modern React SaaS UI
│   ├── src/
│   │   ├── api/              # Typed client with JWT token management & auto-refresh
│   │   ├── components/       # Emil Kowalski design engineering components (concentric radii, tactile buttons)
│   │   ├── context/          # Auth and Toast notification providers
│   │   └── views/            # Dedicated Admin, Faculty, and Student portals
│   ├── dist/                 # Production compiled SPA served directly by FastAPI
│   └── package.json
├── data/                     # Persistent database & face image storage
├── Dockerfile                # Multi-stage production container build
├── docker-compose.yml        # Production container orchestration
└── run.py                    # Unified application launcher
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & issue JWT tokens |
| `POST` | `/api/auth/register` | Student self-registration |
| `GET` | `/api/auth/me` | Fetch active authenticated profile |
| `GET` | `/api/users` | List users with role & search filters (Admin) |
| `POST` | `/api/users/{id}/face` | Upload facial training photo |
| `GET` | `/api/subjects` | List academic subjects & rosters |
| `POST` | `/api/recognition` | Class photo biometric recognition |
| `GET` | `/api/attendance/dashboard` | Subject attendance stats & defaulters |
| `GET` | `/api/attendance/me` | Student personal attendance report |
| `GET` | `/api/lectures/{id}/attendance/export/pdf` | Export printable PDF register |
| `GET` | `/api/lectures/{id}/attendance/export/csv` | Export CSV spreadsheet |
| `GET` | `/api/health` | Service health status |

---

## 🐳 Docker Deployment

Run the complete platform inside an isolated container:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:8000`.

---

## 🧪 Testing & Verification

```bash
# Run backend pytest suite
.venv/bin/python -m pytest

# Run ruff linter
.venv/bin/ruff check backend

# Build frontend production bundle
cd frontend && bun run build
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
