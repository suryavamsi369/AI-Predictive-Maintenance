"""SQLAlchemy ORM models for machines and prediction history."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class Machine(Base):
    """Registered industrial machine model."""

    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=True)
    model_type = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    status = Column(String(50), nullable=False, default="active")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # 1-to-many relationship with prediction records
    predictions = relationship(
        "PredictionRecord",
        back_populates="machine",
        cascade="all, delete-orphan",
        order_by="desc(PredictionRecord.timestamp)",
    )

    def __repr__(self) -> str:
        return f"<Machine(machine_id='{self.machine_id}', name='{self.name}', status='{self.status}')>"


class PredictionRecord(Base):
    """Historical machine sensor telemetry and ML prediction record."""

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(
        String(100),
        ForeignKey("machines.machine_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    temperature = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    rpm = Column(Float, nullable=False)
    operating_hours = Column(Float, nullable=False)

    # Model inference results
    prediction = Column(String(100), nullable=False)
    health_status = Column(String(50), nullable=True)
    failure_probability = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)

    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        index=True,
    )

    # Relationship back to machine
    machine = relationship("Machine", back_populates="predictions")

    def __repr__(self) -> str:
        return (
            f"<PredictionRecord(id={self.id}, machine_id='{self.machine_id}', "
            f"prediction='{self.prediction}', failure_prob={self.failure_probability}, "
            f"timestamp='{self.timestamp}')>"
        )

