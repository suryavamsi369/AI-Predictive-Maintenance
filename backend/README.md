# AI-Powered Predictive Maintenance System (Backend, ML & Database Integration - Stage 3)

Welcome to **Stage 3** of the **AI-Powered Predictive Maintenance System**. In this stage, a persistent relational database layer using **PostgreSQL** and **SQLAlchemy 2.0** with **Alembic** database migrations is integrated into the FastAPI backend.

This enables:
1. **Machine Registry:** Register, track, and manage industrial machine assets, equipment types, physical locations, and lifecycle statuses.
2. **Persistent Telemetry & Predictions:** Automatic persistence of every validated telemetry payload, model inference result, health status, and failure-risk probability.
3. **Audit History & Analytics:** Query chronological prediction history globally or for individual machines.

---

## 📁 Project Structure

```text
AI-Predictive-Maintenance/
└── backend/
    ├── alembic/
    │   ├── versions/
    │   │   └── 20261107_001_initial_tables.py  # Initial PostgreSQL schema migration
    │   ├── env.py                              # Alembic runtime environment & metadata hook
    │   └── script.py.mako                      # Migration template
    ├── app/
    │   ├── __init__.py                         # Package marker and version info
    │   ├── main.py                             # FastAPI application initialization & lifespan DB hook
    │   ├── api/
    │   │   ├── __init__.py                     # API package marker
    │   │   └── routes.py                       # REST routes (Base, Machines, Predictions, ML)
    │   ├── db/
    │   │   ├── __init__.py                     # Database exports
    │   │   ├── base.py                         # SQLAlchemy 2.0 DeclarativeBase
    │   │   ├── models.py                       # SQLAlchemy ORM models (Machine, PredictionRecord)
    │   │   └── session.py                      # Engine, sessionmaker, and get_db dependency
    │   ├── schemas/
    │   │   ├── __init__.py                     # Schema exports
    │   │   ├── machine_schema.py               # Pydantic v2 schemas for telemetry & ML response
    │   │   └── machine_db_schemas.py           # Pydantic v2 schemas for Machines & History
    │   ├── services/
    │   │   ├── __init__.py                     # Service exports
    │   │   ├── machine_service.py              # Business logic for machine registry & history
    │   │   └── prediction_service.py           # ML inference engine & auto-persistence logic
    │   ├── core/
    │   │   ├── __init__.py                     # Core settings export
    │   │   └── config.py                       # Configuration management (DB, ML, App)
    │   └── ml/
    │       └── models/
    │           └── predictive_maintenance_rf.joblib # Serialized Random Forest model artifact
    ├── ml/
    │   └── train_model.py                      # Offline ML training and evaluation script
    ├── tests/
    │   ├── __init__.py                         # Test package marker
    │   ├── conftest.py                         # TestClient & in-memory SQLite test fixtures
    │   └── test_api.py                         # Complete automated test suite (24 test cases)
    ├── .env                                    # Local environment variables
    ├── .env.example                            # Configuration template without secrets
    ├── alembic.ini                             # Alembic migration configuration
    ├── pytest.ini                              # Pytest configuration file
    ├── requirements.txt                        # Backend, ML, and Database dependencies
    └── README.md                               # Complete documentation
```

---

## 🛠️ Technologies Used

- **Python 3.10+** (Tested on Python 3.14)
- **FastAPI**: Asynchronous web framework for high-performance API endpoints.
- **SQLAlchemy 2.0**: Modern Python ORM for data modeling and transactional database access.
- **PostgreSQL**: Production-grade relational database for persistent telemetry and asset storage.
- **psycopg2-binary**: Robust PostgreSQL adapter for Python.
- **Alembic**: Database schema migrations tool.
- **Scikit-Learn**: Machine learning library powering the Random Forest model.
- **Joblib**: Efficient serialization of trained model bundles.
- **Pydantic v2**: High-speed data validation and serialization.
- **Pytest**: Automated integration testing with isolated in-memory test databases.

---

## 🗄️ Database Architecture & Schema

### 1. `machines` Table
Stores registered industrial machinery metadata.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Internal database surrogate ID |
| `machine_id` | `VARCHAR(100)` | `UNIQUE, NOT NULL, INDEX` | Unique machine identifier (e.g., `Machine_04`) |
| `name` | `VARCHAR(200)` | `NULLABLE` | Human-readable machine label |
| `model_type` | `VARCHAR(100)` | `NULLABLE` | Equipment classification / model |
| `location` | `VARCHAR(200)` | `NULLABLE` | Facility location / workcell |
| `status` | `VARCHAR(50)` | `NOT NULL, DEFAULT 'active'` | Operational status (`active`, `maintenance`, `decommissioned`) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Last update timestamp |

### 2. `predictions` Table
Stores chronological sensor readings and ML failure predictions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique prediction record ID |
| `machine_id` | `VARCHAR(100)` | `FOREIGN KEY (machines.machine_id) ON DELETE CASCADE, INDEX` | Machine foreign key reference |
| `temperature`| `FLOAT` | `NOT NULL` | Operating temperature in °C |
| `vibration`  | `FLOAT` | `NOT NULL` | Vibration velocity amplitude in mm/s |
| `pressure`   | `FLOAT` | `NOT NULL` | Pressure in psi or kPa |
| `rpm`        | `FLOAT` | `NOT NULL` | Rotational speed in RPM |
| `operating_hours` | `FLOAT` | `NOT NULL` | Cumulative operating hours |
| `prediction` | `VARCHAR(100)` | `NOT NULL` | Predicted condition (`Normal Operation`, `Maintenance Required`) |
| `health_status` | `VARCHAR(50)` | `NULLABLE` | Qualitative condition (`Healthy`, `Warning`, `Critical`) |
| `failure_probability` | `FLOAT` | `NULLABLE` | Calculated failure risk score ($0.0 \le p \le 1.0$) |
| `risk_level` | `VARCHAR(50)` | `NULLABLE` | Risk classification (`Low`, `Moderate`, `High`, `Critical`) |
| `timestamp`  | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now(), INDEX` | Evaluation timestamp |

---

## 🚀 PostgreSQL Setup & Migrations Guide

### Step 1: Start PostgreSQL

You can use a local PostgreSQL installation or launch a lightweight PostgreSQL container using Docker:

#### Option A: Run via Docker (Recommended for quick local setup)
```bash
docker run -d \
  --name postgres-pm \
  -p 5432:5432 \
  -e POSTGRES_DB=predictive_maintenance \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine
```

#### Option B: Local PostgreSQL Server
1. Create a database named `predictive_maintenance`:
```sql
CREATE DATABASE predictive_maintenance;
```

---

### Step 2: Configure Environment Variables

Edit `.env` inside the `backend/` directory:

```env
APP_NAME="AI-Powered Predictive Maintenance System"
APP_VERSION="1.0.0"
ENVIRONMENT="development"
HOST="127.0.0.1"
PORT=8000
DEBUG=True

MODEL_PATH="app/ml/models/predictive_maintenance_rf.joblib"

# Database Credentials
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT=5432
DB_NAME="predictive_maintenance"

# Optional direct connection string
# DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/predictive_maintenance"
```

---

### Step 3: Run Database Migrations (Alembic)

To apply database migrations:

```powershell
cd backend
python -m alembic upgrade head
```

To verify current migration status:
```powershell
python -m alembic current
```

To roll back a migration:
```powershell
python -m alembic downgrade -1
```

*(Note: The application also includes an automatic safety check in `app.main:lifespan` that automatically calls `init_db()` to ensure tables exist upon startup).*

---

## ▶️ Running the Application

Start the backend server using **Uvicorn**:

```powershell
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 📡 API Endpoints Reference

### 1. Machine Registration & Management

#### `POST /machines` – Register a Machine
- **Request Body:**
```json
{
  "machine_id": "Machine_04",
  "name": "High Pressure Injection Pump #4",
  "model_type": "Pump-HP500",
  "location": "Sector 4, Building B",
  "status": "active"
}
```
- **Response (HTTP 201 Created):**
```json
{
  "id": 1,
  "machine_id": "Machine_04",
  "name": "High Pressure Injection Pump #4",
  "model_type": "Pump-HP500",
  "location": "Sector 4, Building B",
  "status": "active",
  "created_at": "2026-11-07T08:50:00Z",
  "updated_at": "2026-11-07T08:50:00Z"
}
```

#### `GET /machines` – List Registered Machines
- **Query Params:** `skip` (default 0), `limit` (default 100), `status` (optional filter).
- **Response (HTTP 200 OK):** Array of registered machine objects.

#### `GET /machines/{machine_id}` – Get Machine Details
- **Response (HTTP 200 OK):**
```json
{
  "id": 1,
  "machine_id": "Machine_04",
  "name": "High Pressure Injection Pump #4",
  "model_type": "Pump-HP500",
  "location": "Sector 4, Building B",
  "status": "active",
  "created_at": "2026-11-07T08:50:00Z",
  "updated_at": "2026-11-07T08:50:00Z",
  "total_predictions": 5,
  "latest_prediction": {
    "id": 14,
    "machine_id": "Machine_04",
    "temperature": 87.0,
    "vibration": 8.4,
    "pressure": 121.0,
    "rpm": 2950.0,
    "operating_hours": 8420.0,
    "prediction": "Maintenance Required",
    "health_status": "Critical",
    "failure_probability": 1.0,
    "risk_level": "High",
    "timestamp": "2026-11-07T08:51:00Z"
  }
}
```

---

### 2. Predictive Maintenance with Automatic Database Persistence

#### `POST /predict` – Predict & Persist Telemetry
When valid sensor telemetry is submitted:
1. Runs real-time inference using the Random Forest model.
2. Automatically ensures the machine exists in the `machines` registry (auto-registers if not present).
3. Persists the sensor measurements and prediction result into the `predictions` table.

- **Request Body:**
```json
{
  "machine_id": "Machine_04",
  "temperature": 87,
  "vibration": 8.4,
  "pressure": 121,
  "rpm": 2950,
  "operating_hours": 8420
}
```

- **Response (HTTP 200 OK):**
```json
{
  "status": "success",
  "model_status": "ML model active (RandomForestClassifier v1.0.0)",
  "prediction": "Maintenance Required",
  "health_status": "Critical",
  "failure_probability": 1.0,
  "risk_level": "High",
  "message": "Machine 'Machine_04' condition: Critical (High failure risk, probability: 100.0%). Recommendation: Schedule preventive inspection soon.",
  "received_data": {
    "machine_id": "Machine_04",
    "temperature": 87.0,
    "vibration": 8.4,
    "pressure": 121.0,
    "rpm": 2950.0,
    "operating_hours": 8420.0
  }
}
```

---

### 3. Prediction History Endpoints

#### `GET /predictions` – Retrieve Prediction History
- **Query Params:** `skip` (default 0), `limit` (default 50), `machine_id` (optional filter).
- **Response (HTTP 200 OK):** Chronological list of predictions (newest first).

#### `GET /predictions/{machine_id}` – Retrieve Machine History
- **Response (HTTP 200 OK):** Chronological list of predictions strictly for the specified machine. Returns HTTP 404 if the machine ID does not exist.

---

## 🧪 Automated Testing

Execute the automated test suite covering all base endpoints, machine management, automatic persistence, history retrieval, fallback states, and validation edge cases:

```powershell
python -m pytest backend -v
```

### Test Suite Results (24/24 passing in 0.71s):
```text
backend\tests\test_api.py::test_get_root PASSED                          [  4%]
backend\tests\test_api.py::test_get_health PASSED                        [  8%]
backend\tests\test_api.py::test_model_info_endpoint PASSED               [ 12%]
backend\tests\test_api.py::test_register_machine_success PASSED          [ 16%]
backend\tests\test_api.py::test_register_machine_duplicate_conflict PASSED [ 20%]
backend\tests\test_api.py::test_register_machine_blank_id_error PASSED   [ 25%]
backend\tests\test_api.py::test_list_machines PASSED                     [ 29%]
backend\tests\test_api.py::test_get_machine_details_success PASSED       [ 33%]
backend\tests\test_api.py::test_get_machine_details_not_found PASSED     [ 37%]
backend\tests\test_api.py::test_valid_predict PASSED                     [ 41%]
backend\tests\test_api.py::test_predict_automatically_persists_to_database PASSED [ 45%]
backend\tests\test_api.py::test_predict_healthy_machine PASSED           [ 50%]
backend\tests\test_api.py::test_list_predictions_history PASSED          [ 54%]
backend\tests\test_api.py::test_get_machine_predictions_history PASSED   [ 58%]
backend\tests\test_api.py::test_get_machine_predictions_not_found PASSED [ 62%]
backend\tests\test_api.py::test_predict_model_missing_fallback PASSED    [ 66%]
backend\tests\test_api.py::test_predict_inference_error_handling PASSED  [ 70%]
backend\tests\test_api.py::test_invalid_predict_payloads[temperature]   PASSED [ 75%]
backend\tests\test_api.py::test_invalid_predict_payloads[machine_id]    PASSED [ 79%]
backend\tests\test_api.py::test_invalid_predict_payloads[non_numeric]   PASSED [ 83%]
backend\tests\test_api.py::test_invalid_predict_payloads[negative_vib]  PASSED [ 87%]
backend\tests\test_api.py::test_invalid_predict_payloads[negative_hrs]  PASSED [ 91%]
backend\tests\test_api.py::test_invalid_predict_payloads[blank_id]      PASSED [ 95%]
backend\tests\test_api.py::test_invalid_predict_payloads[empty_body]    PASSED [100%]

============================= 24 passed in 0.71s ==============================
```
