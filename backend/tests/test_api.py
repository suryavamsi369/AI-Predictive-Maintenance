"""Automated test suite for FastAPI backend endpoints, ML model, and database integration."""

from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Machine, PredictionRecord
from app.services.prediction_service import prediction_service


# =============================================================================
# Root & Health Tests
# =============================================================================
def test_get_root(client: TestClient):
    """Test GET / returns application name and welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app_name" in data
    assert "message" in data
    assert "AI-Powered Predictive Maintenance System" in data["app_name"]
    assert "Welcome" in data["message"]


def test_get_health(client: TestClient):
    """Test GET /health returns status: healthy."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_model_info_endpoint(client: TestClient):
    """Test GET /model-info returns active model details and metrics."""
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "model_loaded" in data
    assert data["model_loaded"] is True
    assert "feature_names" in data
    assert "temperature" in data["feature_names"]
    assert "vibration" in data["feature_names"]
    assert "metadata" in data
    assert data["metadata"].get("algorithm") == "RandomForestClassifier"


# =============================================================================
# Machine Management Endpoints (Stage 3)
# =============================================================================
def test_register_machine_success(client: TestClient):
    """Test POST /machines successfully registers a new industrial machine."""
    payload = {
        "machine_id": "Machine_101",
        "name": "High Pressure Injection Pump #1",
        "model_type": "Pump-HP500",
        "location": "Sector 4, Building B",
        "status": "active",
    }
    response = client.post("/machines", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["machine_id"] == "Machine_101"
    assert data["name"] == "High Pressure Injection Pump #1"
    assert data["model_type"] == "Pump-HP500"
    assert data["location"] == "Sector 4, Building B"
    assert data["status"] == "active"
    assert "created_at" in data
    assert "updated_at" in data


def test_register_machine_duplicate_conflict(client: TestClient):
    """Test POST /machines with existing machine_id returns 409 Conflict."""
    payload = {
        "machine_id": "Machine_102",
        "name": "Centrifugal Compressor",
    }
    first_res = client.post("/machines", json=payload)
    assert first_res.status_code == 201

    duplicate_res = client.post("/machines", json=payload)
    assert duplicate_res.status_code == 409
    assert "already registered" in duplicate_res.json()["detail"]


def test_register_machine_blank_id_error(client: TestClient):
    """Test POST /machines with blank machine_id triggers 422 Unprocessable Entity."""
    payload = {
        "machine_id": "   ",
        "name": "Invalid Machine",
    }
    response = client.post("/machines", json=payload)
    assert response.status_code == 422


def test_list_machines(client: TestClient):
    """Test GET /machines lists registered machines with status filtering."""
    client.post("/machines", json={"machine_id": "M_A", "status": "active"})
    client.post("/machines", json={"machine_id": "M_B", "status": "maintenance"})
    client.post("/machines", json={"machine_id": "M_C", "status": "active"})

    # All machines
    all_res = client.get("/machines")
    assert all_res.status_code == 200
    all_data = all_res.json()
    assert len(all_data) == 3

    # Filtered by status
    filtered_res = client.get("/machines?status=active")
    assert filtered_res.status_code == 200
    filtered_data = filtered_res.json()
    assert len(filtered_data) == 2
    assert all(m["status"] == "active" for m in filtered_data)


def test_get_machine_details_success(client: TestClient):
    """Test GET /machines/{machine_id} returns machine metadata, total predictions, and latest prediction."""
    client.post(
        "/machines",
        json={"machine_id": "Machine_200", "name": "Conveyor Drive", "location": "Line 1"},
    )

    # Submit a prediction for Machine_200
    predict_payload = {
        "machine_id": "Machine_200",
        "temperature": 55.0,
        "vibration": 1.7,
        "pressure": 99.0,
        "rpm": 2900.0,
        "operating_hours": 1500.0,
    }
    client.post("/predict", json=predict_payload)

    response = client.get("/machines/Machine_200")
    assert response.status_code == 200
    data = response.json()
    assert data["machine_id"] == "Machine_200"
    assert data["total_predictions"] == 1
    assert data["latest_prediction"] is not None
    assert data["latest_prediction"]["prediction"] == "Normal Operation"


def test_get_machine_details_not_found(client: TestClient):
    """Test GET /machines/{machine_id} with non-existent ID returns 404."""
    response = client.get("/machines/NonExistent_999")
    assert response.status_code == 404
    assert "was not found" in response.json()["detail"]


# =============================================================================
# Predictive Maintenance & Auto-Persistence Tests (Stage 2 + Stage 3)
# =============================================================================
def test_valid_predict(client: TestClient):
    """Test valid POST /predict with required sensor payload executes ML inference."""
    payload = {
        "machine_id": "Machine_04",
        "temperature": 87,
        "vibration": 8.4,
        "pressure": 121,
        "rpm": 2950,
        "operating_hours": 8420,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify Stage 2 ML inference contract
    assert data["status"] == "success"
    assert "ML model active" in data["model_status"]
    assert data["prediction"] == "Maintenance Required"
    assert data["health_status"] in ["Critical", "Warning"]
    assert isinstance(data["failure_probability"], float)
    assert 0.0 <= data["failure_probability"] <= 1.0
    assert data["failure_probability"] >= 0.70  # High vibration and temperature
    assert data["risk_level"] in ["High", "Critical"]
    assert "Machine_04" in data["message"]

    # Verify echoed received_data
    received = data["received_data"]
    assert received["machine_id"] == "Machine_04"
    assert received["temperature"] == 87.0
    assert received["vibration"] == 8.4
    assert received["pressure"] == 121.0
    assert received["rpm"] == 2950.0
    assert received["operating_hours"] == 8420.0


def test_predict_automatically_persists_to_database(client: TestClient, db_session: Session):
    """Test POST /predict automatically saves the prediction and registers machine if not present."""
    payload = {
        "machine_id": "Machine_AutoSave",
        "temperature": 86.5,
        "vibration": 7.9,
        "pressure": 122.0,
        "rpm": 2950.0,
        "operating_hours": 8100.0,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200

    # Verify machine is auto-registered
    machine = db_session.query(Machine).filter(Machine.machine_id == "Machine_AutoSave").first()
    assert machine is not None
    assert machine.machine_id == "Machine_AutoSave"

    # Verify prediction record is saved in DB
    record = (
        db_session.query(PredictionRecord)
        .filter(PredictionRecord.machine_id == "Machine_AutoSave")
        .first()
    )
    assert record is not None
    assert record.temperature == 86.5
    assert record.vibration == 7.9
    assert record.prediction == "Maintenance Required"
    assert record.failure_probability is not None
    assert record.timestamp is not None


def test_predict_healthy_machine(client: TestClient):
    """Test POST /predict with healthy industrial telemetry returns Normal Operation."""
    healthy_payload = {
        "machine_id": "Machine_01",
        "temperature": 54.0,
        "vibration": 1.6,
        "pressure": 98.0,
        "rpm": 2900.0,
        "operating_hours": 1200.0,
    }
    response = client.post("/predict", json=healthy_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["prediction"] == "Normal Operation"
    assert data["health_status"] == "Healthy"
    assert data["failure_probability"] < 0.25
    assert data["risk_level"] == "Low"
    assert "Continue regular operation" in data["message"]


def test_list_predictions_history(client: TestClient):
    """Test GET /predictions returns prediction history ordered by timestamp desc."""
    client.post(
        "/predict",
        json={
            "machine_id": "M_Hist_1",
            "temperature": 50,
            "vibration": 1.2,
            "pressure": 95,
            "rpm": 2850,
            "operating_hours": 800,
        },
    )
    client.post(
        "/predict",
        json={
            "machine_id": "M_Hist_2",
            "temperature": 88,
            "vibration": 8.0,
            "pressure": 125,
            "rpm": 2980,
            "operating_hours": 9000,
        },
    )

    # Fetch all predictions
    res = client.get("/predictions")
    assert res.status_code == 200
    records = res.json()
    assert len(records) == 2
    assert records[0]["machine_id"] == "M_Hist_2"
    assert records[1]["machine_id"] == "M_Hist_1"

    # Filter by machine_id query parameter
    res_filtered = client.get("/predictions?machine_id=M_Hist_1")
    assert res_filtered.status_code == 200
    records_filtered = res_filtered.json()
    assert len(records_filtered) == 1
    assert records_filtered[0]["machine_id"] == "M_Hist_1"


def test_get_machine_predictions_history(client: TestClient):
    """Test GET /predictions/{machine_id} retrieves history specifically for that machine."""
    # Register machine
    client.post("/machines", json={"machine_id": "M_Specific"})

    # Submit 2 predictions
    for temp in [52.0, 54.0]:
        client.post(
            "/predict",
            json={
                "machine_id": "M_Specific",
                "temperature": temp,
                "vibration": 1.5,
                "pressure": 98.0,
                "rpm": 2900.0,
                "operating_hours": 1000.0,
            },
        )

    res = client.get("/predictions/M_Specific")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert all(r["machine_id"] == "M_Specific" for r in data)


def test_get_machine_predictions_not_found(client: TestClient):
    """Test GET /predictions/{machine_id} returns 404 for unknown machine."""
    res = client.get("/predictions/NonExistent_Machine_000")
    assert res.status_code == 404
    assert "was not found" in res.json()["detail"]


# =============================================================================
# Fallback & Error Handling Tests
# =============================================================================
def test_predict_model_missing_fallback(client: TestClient):
    """Test POST /predict gracefully handles scenario where ML model is unavailable."""
    original_model = prediction_service.model
    try:
        # Simulate uninitialized/missing model
        prediction_service.model = None

        payload = {
            "machine_id": "Machine_05",
            "temperature": 60,
            "vibration": 2.1,
            "pressure": 101,
            "rpm": 2910,
            "operating_hours": 3200,
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "model_unavailable"
        assert "ML model is not available yet" in data["model_status"]
        assert data["prediction"] is None
        assert data["health_status"] is None
        assert data["failure_probability"] is None
        assert data["risk_level"] is None
        assert "validated" in data["message"]

    finally:
        # Restore active model
        prediction_service.model = original_model


def test_predict_inference_error_handling(client: TestClient):
    """Test POST /predict returns structured error if model inference raises an exception."""
    original_model = prediction_service.model
    try:
        # Mock model to raise runtime exception
        faulty_model = MagicMock()
        faulty_model.predict.side_effect = RuntimeError("Inference tensor computation failure")
        prediction_service.model = faulty_model

        payload = {
            "machine_id": "Machine_06",
            "temperature": 65,
            "vibration": 2.5,
            "pressure": 105,
            "rpm": 2920,
            "operating_hours": 4000,
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "error"
        assert data["model_status"] == "ML inference error"
        assert data["prediction"] is None
        assert "Inference tensor computation failure" in data["message"]

    finally:
        # Restore active model
        prediction_service.model = original_model


@pytest.mark.parametrize(
    "invalid_payload,missing_or_invalid_field",
    [
        (
            {
                # Missing temperature
                "machine_id": "Machine_04",
                "vibration": 8.4,
                "pressure": 121,
                "rpm": 2950,
                "operating_hours": 8420,
            },
            "temperature",
        ),
        (
            {
                # Missing machine_id
                "temperature": 87,
                "vibration": 8.4,
                "pressure": 121,
                "rpm": 2950,
                "operating_hours": 8420,
            },
            "machine_id",
        ),
        (
            {
                # Invalid type for temperature (string instead of numeric)
                "machine_id": "Machine_04",
                "temperature": "extremely_hot",
                "vibration": 8.4,
                "pressure": 121,
                "rpm": 2950,
                "operating_hours": 8420,
            },
            "temperature",
        ),
        (
            {
                # Negative vibration
                "machine_id": "Machine_04",
                "temperature": 87,
                "vibration": -5.0,
                "pressure": 121,
                "rpm": 2950,
                "operating_hours": 8420,
            },
            "vibration",
        ),
        (
            {
                # Negative operating_hours
                "machine_id": "Machine_04",
                "temperature": 87,
                "vibration": 8.4,
                "pressure": 121,
                "rpm": 2950,
                "operating_hours": -10,
            },
            "operating_hours",
        ),
        (
            {
                # Blank machine_id
                "machine_id": "   ",
                "temperature": 87,
                "vibration": 8.4,
                "pressure": 121,
                "rpm": 2950,
                "operating_hours": 8420,
            },
            "machine_id",
        ),
        (
            {},
            "all_fields",
        ),
    ],
)
def test_invalid_predict_payloads(client: TestClient, invalid_payload: dict, missing_or_invalid_field: str):
    """Test POST /predict with various invalid payloads triggers 422 Unprocessable Entity."""
    response = client.post("/predict", json=invalid_payload)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
def test_get_dashboard(client: TestClient):
    """Test GET /dashboard serves the compiled frontend single-page application."""
    response = client.get("/dashboard")
    assert response.status_code == 200
    assert "AI Predictive Maintenance" in response.text
    assert "<div id=\"root\"></div>" in response.text
