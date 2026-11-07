"""Pydantic schemas for Machine registry and Prediction history."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class MachineBase(BaseModel):
    """Base attributes for an industrial machine."""

    name: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Human-readable name or label (e.g., 'Hydraulic Press #4')",
        examples=["Centrifugal Slurry Pump #4"],
    )
    model_type: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Equipment type or model classification",
        examples=["Pump-X200"],
    )
    location: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Physical facility location or workcell",
        examples=["Sector 3, Building A, Bay 2"],
    )
    status: Optional[str] = Field(
        default="active",
        max_length=50,
        description="Operational status ('active', 'maintenance', 'decommissioned')",
        examples=["active"],
    )


class MachineCreate(MachineBase):
    """Schema for registering a new industrial machine."""

    machine_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique identifier for the machine (e.g., 'Machine_04')",
        examples=["Machine_04"],
    )

    @field_validator("machine_id")
    @classmethod
    def validate_machine_id_not_blank(cls, value: str) -> str:
        """Validate machine_id is not empty or blank."""
        stripped = value.strip()
        if not stripped:
            raise ValueError("machine_id must not be empty or blank")
        return stripped


class MachineResponse(MachineBase):
    """Schema representing a registered machine returned by the API."""

    id: int = Field(..., description="Internal database surrogate ID")
    machine_id: str = Field(..., description="Unique machine identifier")
    status: str = Field(..., description="Machine operational status")
    created_at: datetime = Field(..., description="Registration timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class PredictionRecordResponse(BaseModel):
    """Schema representing a stored historical prediction record."""

    id: int = Field(..., description="Unique prediction record ID")
    machine_id: str = Field(..., description="Identifier of the evaluated machine")
    temperature: float = Field(..., description="Operating temperature in °C")
    vibration: float = Field(..., description="Vibration velocity in mm/s")
    pressure: float = Field(..., description="Operating pressure in psi or kPa")
    rpm: float = Field(..., description="Rotational speed in RPM")
    operating_hours: float = Field(..., description="Cumulative operating hours")
    prediction: str = Field(..., description="Condition predicted by the ML model")
    health_status: Optional[str] = Field(default=None, description="Qualitative health condition")
    failure_probability: Optional[float] = Field(default=None, description="Calculated failure risk probability")
    risk_level: Optional[str] = Field(default=None, description="Assigned risk level ('Low', 'Moderate', 'High', 'Critical')")
    timestamp: datetime = Field(..., description="Prediction timestamp")

    model_config = ConfigDict(from_attributes=True)


class MachineDetailResponse(MachineResponse):
    """Detailed machine view including prediction count and latest inference result."""

    total_predictions: int = Field(default=0, description="Total count of logged telemetry evaluations")
    latest_prediction: Optional[PredictionRecordResponse] = Field(
        default=None,
        description="Most recent prediction record for this machine",
    )

    model_config = ConfigDict(from_attributes=True)

