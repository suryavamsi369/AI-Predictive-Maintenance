"""API endpoints for the AI Predictive Maintenance System."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.machine_schema import (
    HealthResponse,
    MachineSensorData,
    PredictionResponse,
    RootResponse,
)
from app.schemas.machine_db_schemas import (
    MachineCreate,
    MachineDetailResponse,
    MachineResponse,
    PredictionRecordResponse,
)
from app.services.machine_service import machine_service
from app.services.prediction_service import prediction_service

router = APIRouter()


# -----------------------------------------------------------------------------
# Base & Health Endpoints
# -----------------------------------------------------------------------------
@router.get(
    "/",
    response_model=RootResponse,
    status_code=status.HTTP_200_OK,
    summary="Root Endpoint",
    description="Returns the application name and a welcome message.",
)
def read_root() -> RootResponse:
    """Return application name and welcome message."""
    return RootResponse(
        app_name=settings.APP_NAME,
        message=f"Welcome to the {settings.APP_NAME} API. Visit /docs for interactive API documentation.",
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Returns the operational health status of the backend service.",
)
def health_check() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(status="healthy")


@router.get(
    "/model-info",
    status_code=status.HTTP_200_OK,
    summary="Model Metadata & Status",
    description="Returns information regarding the active ML model, including algorithm, version, and training metrics.",
)
def get_model_info() -> Dict[str, Any]:
    """Return ML model metadata and active status."""
    return {
        "model_loaded": prediction_service.is_model_loaded(),
        "model_path": str(prediction_service.model_path),
        "feature_names": prediction_service.feature_names,
        "target_names": prediction_service.target_names,
        "metadata": prediction_service.model_metadata,
    }


# -----------------------------------------------------------------------------
# Machine Registration & Management Endpoints (Stage 3)
# -----------------------------------------------------------------------------
@router.post(
    "/machines",
    response_model=MachineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a Machine",
    description="Register an industrial machine in the database with unique machine ID, label, model type, and location.",
)
def register_machine(
    machine_in: MachineCreate,
    db: Session = Depends(get_db),
) -> MachineResponse:
    """Register a new industrial machine."""
    return machine_service.register_machine(db=db, machine_in=machine_in)


@router.get(
    "/machines",
    response_model=List[MachineResponse],
    status_code=status.HTTP_200_OK,
    summary="List Registered Machines",
    description="Retrieve a paginated list of all machines currently registered in the database.",
)
def list_machines(
    skip: int = Query(0, ge=0, description="Records to skip for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    status: Optional[str] = Query(None, description="Filter by status (e.g. 'active', 'maintenance')"),
    db: Session = Depends(get_db),
) -> List[MachineResponse]:
    """Retrieve list of registered machines."""
    return machine_service.list_machines(db=db, skip=skip, limit=limit, status_filter=status)


@router.get(
    "/machines/{machine_id}",
    response_model=MachineDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Machine Details",
    description="Retrieve specific machine metadata, total prediction count, and the most recent evaluation result.",
)
def get_machine(
    machine_id: str,
    db: Session = Depends(get_db),
) -> MachineDetailResponse:
    """Retrieve details and summary for a single machine."""
    return machine_service.get_machine_details(db=db, machine_id=machine_id)


# -----------------------------------------------------------------------------
# ML Inference & Historical Prediction Records (Stage 3)
# -----------------------------------------------------------------------------
@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Machine Maintenance Condition",
    description=(
        "Receives industrial sensor measurements, executes predictive maintenance inference via the "
        "trained Random Forest model, and automatically records successful predictions in PostgreSQL."
    ),
)
def predict_machine_health(
    sensor_data: MachineSensorData,
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Accept and validate machine sensor data, execute inference, and persist prediction."""
    return prediction_service.process_prediction(sensor_data=sensor_data, db=db)


@router.get(
    "/predictions",
    response_model=List[PredictionRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve Prediction History",
    description="Retrieve paginated historical machine telemetry and prediction records, ordered newest first.",
)
def list_predictions(
    skip: int = Query(0, ge=0, description="Records to skip for pagination"),
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    machine_id: Optional[str] = Query(None, description="Filter history by machine ID"),
    db: Session = Depends(get_db),
) -> List[PredictionRecordResponse]:
    """Retrieve historical prediction records."""
    return machine_service.get_prediction_history(
        db=db, skip=skip, limit=limit, machine_id=machine_id
    )


@router.get(
    "/predictions/{machine_id}",
    response_model=List[PredictionRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve Predictions for Machine",
    description="Retrieve chronological prediction history for a specific machine ID.",
)
def get_machine_predictions(
    machine_id: str,
    skip: int = Query(0, ge=0, description="Records to skip for pagination"),
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    db: Session = Depends(get_db),
) -> List[PredictionRecordResponse]:
    """Retrieve prediction history for a specific machine."""
    return machine_service.get_machine_predictions(
        db=db, machine_id=machine_id, skip=skip, limit=limit
    )
