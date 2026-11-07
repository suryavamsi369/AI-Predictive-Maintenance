"""Machine sensor input schemas and response models."""

from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class MachineSensorData(BaseModel):
    """Schema validating incoming industrial machine sensor telemetry."""

    machine_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique identifier for the industrial machine (e.g., 'Machine_04')",
        examples=["Machine_04"],
    )
    temperature: float = Field(
        ...,
        ge=-50.0,
        le=500.0,
        description="Operating temperature in degrees Celsius (°C)",
        examples=[87.0],
    )
    vibration: float = Field(
        ...,
        ge=0.0,
        le=200.0,
        description="Vibration velocity in mm/s",
        examples=[8.4],
    )
    pressure: float = Field(
        ...,
        ge=0.0,
        le=2000.0,
        description="Operating pressure in psi or kPa",
        examples=[121.0],
    )
    rpm: float = Field(
        ...,
        ge=0.0,
        le=50000.0,
        description="Rotational speed in revolutions per minute (RPM)",
        examples=[2950.0],
    )
    operating_hours: float = Field(
        ...,
        ge=0.0,
        le=300000.0,
        description="Total cumulative operating hours of the machine",
        examples=[8420.0],
    )

    @field_validator("machine_id")
    @classmethod
    def validate_machine_id_not_blank(cls, value: str) -> str:
        """Ensure machine_id is not empty or composed solely of whitespace."""
        stripped = value.strip()
        if not stripped:
            raise ValueError("machine_id must not be empty or blank")
        return stripped

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "machine_id": "Machine_04",
                "temperature": 87,
                "vibration": 8.4,
                "pressure": 121,
                "rpm": 2950,
                "operating_hours": 8420,
            }
        }
    )


class PredictionResponse(BaseModel):
    """Response schema for the machine predictive maintenance endpoint."""

    status: str = Field(
        ...,
        description="Operational status of the inference service ('success', 'model_unavailable', or 'error')",
        examples=["success"],
    )
    model_status: str = Field(
        ...,
        description="Current state and version details of the ML model integration",
        examples=["ML model active (RandomForestClassifier v1.0.0)"],
    )
    prediction: Optional[str] = Field(
        default=None,
        description="Predicted health state ('Normal Operation', 'Maintenance Required', or None if unavailable)",
        examples=["Maintenance Required"],
    )
    health_status: Optional[str] = Field(
        default=None,
        description="Overall condition of the industrial machine ('Healthy', 'Warning', or 'Critical')",
        examples=["Critical"],
    )
    failure_probability: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Calculated failure-risk probability score between 0.0 and 1.0",
        examples=[0.9250],
    )
    risk_level: Optional[str] = Field(
        default=None,
        description="Risk level classification ('Low', 'Moderate', 'High', 'Critical')",
        examples=["High"],
    )
    message: str = Field(
        ...,
        description="Human-readable assessment and maintenance recommendation",
        examples=["Machine 'Machine_04' evaluated: Critical (High risk, failure probability: 92.5%)."],
    )
    received_data: MachineSensorData = Field(
        ...,
        description="Echo of the validated sensor telemetry payload",
    )


class HealthResponse(BaseModel):
    """Health check endpoint response schema."""

    status: str = Field(default="healthy", examples=["healthy"])


class RootResponse(BaseModel):
    """Root endpoint welcome response schema."""

    app_name: str = Field(..., examples=["AI-Powered Predictive Maintenance System"])
    message: str = Field(
        ...,
        examples=["Welcome to the AI-Powered Predictive Maintenance API. Visit /docs for documentation."],
    )
