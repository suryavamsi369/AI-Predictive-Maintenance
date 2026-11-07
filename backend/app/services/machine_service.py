"""Service layer for machine registration, retrieval, and prediction history."""

import logging
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Machine, PredictionRecord
from app.schemas.machine_db_schemas import (
    MachineCreate,
    MachineDetailResponse,
    MachineResponse,
    PredictionRecordResponse,
)

logger = logging.getLogger(__name__)


class MachineService:
    """Service handling machine CRUD operations and prediction history."""

    @staticmethod
    def get_or_create_machine(db: Session, machine_id: str) -> Machine:
        """Retrieve existing machine or create a default active machine record."""
        machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
        if not machine:
            logger.info("Machine '%s' not registered yet. Auto-creating baseline record.", machine_id)
            machine = Machine(
                machine_id=machine_id,
                name=f"Machine {machine_id}",
                status="active",
            )
            db.add(machine)
            db.flush()
        return machine

    @staticmethod
    def register_machine(db: Session, machine_in: MachineCreate) -> Machine:
        """Register a new industrial machine in the database.

        Raises:
            HTTPException (409 Conflict): If machine_id already exists.
        """
        existing = db.query(Machine).filter(Machine.machine_id == machine_in.machine_id).first()
        if existing:
            logger.warning("Attempted to register existing machine_id '%s'", machine_in.machine_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Machine with ID '{machine_in.machine_id}' is already registered.",
            )

        machine = Machine(
            machine_id=machine_in.machine_id,
            name=machine_in.name,
            model_type=machine_in.model_type,
            location=machine_in.location,
            status=machine_in.status or "active",
        )
        db.add(machine)
        db.commit()
        db.refresh(machine)
        logger.info("Successfully registered new machine: %s", machine.machine_id)
        return machine

    @staticmethod
    def list_machines(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status_filter: Optional[str] = None,
    ) -> List[Machine]:
        """List registered machines with optional pagination and status filtering."""
        query = db.query(Machine)
        if status_filter:
            query = query.filter(Machine.status == status_filter)
        return query.order_by(Machine.machine_id.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_machine(db: Session, machine_id: str) -> Machine:
        """Retrieve machine record by ID.

        Raises:
            HTTPException (404 Not Found): If machine does not exist.
        """
        machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
        if not machine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Machine with ID '{machine_id}' was not found.",
            )
        return machine

    @staticmethod
    def get_machine_details(db: Session, machine_id: str) -> MachineDetailResponse:
        """Retrieve machine details along with total prediction count and latest inference result."""
        machine = MachineService.get_machine(db, machine_id)

        # Count total logged predictions
        total_predictions = (
            db.query(func.count(PredictionRecord.id))
            .filter(PredictionRecord.machine_id == machine_id)
            .scalar()
            or 0
        )

        # Retrieve the latest prediction
        latest_record = (
            db.query(PredictionRecord)
            .filter(PredictionRecord.machine_id == machine_id)
            .order_by(PredictionRecord.timestamp.desc())
            .first()
        )

        latest_prediction_dto = (
            PredictionRecordResponse.model_validate(latest_record) if latest_record else None
        )

        return MachineDetailResponse(
            id=machine.id,
            machine_id=machine.machine_id,
            name=machine.name,
            model_type=machine.model_type,
            location=machine.location,
            status=machine.status,
            created_at=machine.created_at,
            updated_at=machine.updated_at,
            total_predictions=total_predictions,
            latest_prediction=latest_prediction_dto,
        )

    @staticmethod
    def save_prediction(
        db: Session,
        machine_id: str,
        temperature: float,
        vibration: float,
        pressure: float,
        rpm: float,
        operating_hours: float,
        prediction: str,
        health_status: Optional[str] = None,
        failure_probability: Optional[float] = None,
        risk_level: Optional[str] = None,
    ) -> PredictionRecord:
        """Persist a machine prediction record to the database."""
        # Ensure machine exists in registry
        MachineService.get_or_create_machine(db, machine_id)

        record = PredictionRecord(
            machine_id=machine_id,
            temperature=temperature,
            vibration=vibration,
            pressure=pressure,
            rpm=rpm,
            operating_hours=operating_hours,
            prediction=prediction,
            health_status=health_status,
            failure_probability=failure_probability,
            risk_level=risk_level,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info("Saved prediction record ID %d for machine '%s'", record.id, machine_id)
        return record

    @staticmethod
    def get_prediction_history(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        machine_id: Optional[str] = None,
    ) -> List[PredictionRecord]:
        """Retrieve historical predictions, optionally filtered by machine_id."""
        query = db.query(PredictionRecord)
        if machine_id:
            query = query.filter(PredictionRecord.machine_id == machine_id)
        return query.order_by(PredictionRecord.timestamp.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_machine_predictions(
        db: Session,
        machine_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[PredictionRecord]:
        """Retrieve historical predictions for a specific machine.

        Raises:
            HTTPException (404 Not Found): If machine does not exist in the database.
        """
        # Ensure machine exists
        MachineService.get_machine(db, machine_id)

        return (
            db.query(PredictionRecord)
            .filter(PredictionRecord.machine_id == machine_id)
            .order_by(PredictionRecord.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )


machine_service = MachineService()

