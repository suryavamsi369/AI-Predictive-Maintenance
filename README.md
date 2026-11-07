# AI-Powered Predictive Maintenance System

An end-to-end industrial predictive maintenance platform designed to ingest high-frequency sensor telemetry (temperature, vibration, pressure, rotational speed, cumulative operating hours) and forecast machine failures before catastrophic downtime occurs.

---

## 📁 Full-Stack Architecture

```text
AI-Predictive-Maintenance/
├── backend/
│   ├── alembic/          # Database migrations configuration & scripts
│   ├── app/
│   │   ├── api/          # Route controllers (Base, Machines, Predictions, ML)
│   │   ├── core/         # Settings & environment configuration
│   │   ├── db/           # SQLAlchemy 2.0 models, base, and sessionmaker
│   │   ├── schemas/      # Pydantic v2 schemas for telemetry, machines & history
│   │   ├── services/     # Business logic & ML prediction service
│   │   ├── ml/models/    # Serialized Random Forest model artifact (.joblib)
│   │   └── main.py       # FastAPI application entry point with static UI mount
│   ├── ml/
│   │   └── train_model.py # ML training & evaluation pipeline
│   ├── tests/            # Automated test suite (25 test cases)
│   ├── .env.example
│   ├── alembic.ini
│   ├── pytest.ini
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/   # Industrial UI components (Overview, Fleet, Diagnostics, History, Model)
│   │   ├── services/     # Typed API client for FastAPI
│   │   ├── types/        # TypeScript interfaces
│   │   ├── App.tsx       # Main workstation layout
│   │   └── main.tsx      # Entry point
│   ├── dist/             # Production build served by FastAPI at /dashboard
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── README.md
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Startup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run ML model training (generates .joblib bundle)
python ml/train_model.py

# Apply database migrations
python -m alembic upgrade head

# Run automated tests
python -m pytest backend -v

# Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **Embedded Production UI:** `http://127.0.0.1:8000/dashboard`

---

### 2. Frontend Development Workstation
```powershell
cd frontend
npm install
npm run dev
```

- **Vite Dev Workstation:** `http://localhost:5173` (with proxy to backend `http://127.0.0.1:8000`)
- **Production Build:** `npm run build`
