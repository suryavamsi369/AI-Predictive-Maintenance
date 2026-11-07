"""Prediction Service with Machine Learning Model Integration and Database Persistence.

This module encapsulates the business logic for predictive maintenance:
- Loads the trained Random Forest model artifact efficiently from disk once (singleton pattern).
- Ingests validated sensor telemetry (temperature, vibration, pressure, rpm, operating hours).
- Preserves machine_id strictly as an identifier for traceability.
- Executes inference and calculates failure-risk probabilities using the trained model.
- Determines machine health status ('Healthy', 'Warning', 'Critical') and risk level.
- Automatically persists successful predictions to the database.
- Implements robust error handling and fallback when model artifacts or database connections fail.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import joblib
import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.machine_schema import MachineSensorData, PredictionResponse

logger = logging.getLogger(__name__)


class PredictionService:
    """Service handling machine sensor evaluation and predictive maintenance ML inference."""

    def __init__(self, model_path: Optional[Path] = None):
        """Initialize the prediction service and attempt to load the ML model."""
        self.model_path = model_path or settings.resolved_model_path
        self.model: Optional[Any] = None
        self.feature_names = [
            "temperature",
            "vibration",
            "pressure",
            "rpm",
            "operating_hours",
        ]
        self.target_names = ["Normal Operation", "Maintenance Required"]
        self.model_metadata: Dict[str, Any] = {}
        self._load_model()

    def _load_model(self) -> bool:
        """Load the serialized model bundle from disk into memory.

        Returns:
            bool: True if model loaded successfully, False otherwise.
        """
        path = Path(self.model_path)
        if not path.exists():
            logger.warning(
                "Model artifact not found at '%s'. Prediction service will operate in fallback mode.",
                path.resolve(),
            )
            self.model = None
            return False

        try:
            logger.info("Loading predictive maintenance ML model from '%s'...", path.resolve())
            bundle = joblib.load(path)

            if isinstance(bundle, dict) and "model" in bundle:
                self.model = bundle["model"]
                self.feature_names = bundle.get("feature_names", self.feature_names)
                self.target_names = bundle.get("target_names", self.target_names)
                self.model_metadata = {
                    "version": bundle.get("model_version", "1.0.0"),
                    "algorithm": bundle.get("algorithm", "RandomForestClassifier"),
                    "trained_at": bundle.get("trained_at", "unknown"),
                    "metrics": bundle.get("metrics", {}),
                }
            else:
                # Direct model instance fallback
                self.model = bundle
                self.model_metadata = {"algorithm": type(bundle).__name__}

            logger.info(
                "Successfully loaded ML model (%s) with %d features.",
                self.model_metadata.get("algorithm", "Unknown"),
                len(self.feature_names),
            )
            return True

        except Exception as exc:
            logger.error("Failed to load ML model from '%s': %s", path.resolve(), exc, exc_info=True)
            self.model = None
            return False

    def is_model_loaded(self) -> bool:
        """Check whether the ML model is currently active and ready for inference."""
        return self.model is not None

    def reload_model(self, custom_path: Optional[Path] = None) -> bool:
        """Hot-reload the model artifact from disk or a new path without restarting the application."""
        if custom_path:
            self.model_path = custom_path
        return self._load_model()

    def _determine_health_status(self, failure_prob: float) -> Tuple[str, str, str]:
        """Map failure risk probability to qualitative health status and operational recommendation.

        Args:
            failure_prob: Probability of machine failure (0.0 to 1.0).

        Returns:
            Tuple of (health_status, risk_level, prediction_label).
        """
        if failure_prob < 0.30:
            return ("Healthy", "Low", "Normal Operation")
        elif failure_prob < 0.65:
            return ("Warning", "Moderate", "Maintenance Required")
        else:
            return ("Critical", "High", "Maintenance Required")

    def process_prediction(
        self,
        sensor_data: MachineSensorData,
        db: Optional[Session] = None,
    ) -> PredictionResponse:
        """Process incoming machine telemetry and generate predictive maintenance assessment.

        Args:
            sensor_data: Validated sensor telemetry for an industrial machine.
            db: Optional active database session to persist the prediction record.

        Returns:
            PredictionResponse containing machine health status, failure risk, and recommendations.
        """
        # Handle scenario where ML model artifact is missing or not yet loaded
        if self.model is None:
            logger.warning(
                "Predict request received for machine '%s', but ML model is not loaded.",
                sensor_data.machine_id,
            )
            return PredictionResponse(
                status="model_unavailable",
                model_status="ML model is not available yet. Model artifact missing or not loaded.",
                prediction=None,
                health_status=None,
                failure_probability=None,
                risk_level=None,
                message=(
                    f"Sensor telemetry for machine '{sensor_data.machine_id}' was successfully validated, "
                    "but predictive inference could not be executed because the ML model artifact is not loaded."
                ),
                received_data=sensor_data,
            )

        try:
            # Assemble feature vector matching trained model schema
            # machine_id is explicitly preserved as an identifier and NOT fed into numeric inference
            features = np.array(
                [
                    [
                        float(sensor_data.temperature),
                        float(sensor_data.vibration),
                        float(sensor_data.pressure),
                        float(sensor_data.rpm),
                        float(sensor_data.operating_hours),
                    ]
                ],
                dtype=float,
            )

            # Compute prediction and failure-risk probability
            pred_class = int(self.model.predict(features)[0])

            if hasattr(self.model, "predict_proba"):
                probabilities = self.model.predict_proba(features)[0]
                failure_prob = float(probabilities[1]) if len(probabilities) > 1 else float(pred_class)
            else:
                failure_prob = float(pred_class)

            health_status, risk_level, prediction_label = self._determine_health_status(failure_prob)

            model_version = self.model_metadata.get("version", "1.0.0")
            algorithm = self.model_metadata.get("algorithm", "RandomForestClassifier")

            message = (
                f"Machine '{sensor_data.machine_id}' condition: {health_status} "
                f"({risk_level} failure risk, probability: {failure_prob * 100:.1f}%). "
                f"Recommendation: {'Schedule preventive inspection soon.' if failure_prob >= 0.30 else 'Continue regular operation.'}"
            )

            # Requirement 7: Save every successful prediction automatically
            if db is not None:
                try:
                    from app.services.machine_service import MachineService

                    MachineService.save_prediction(
                        db=db,
                        machine_id=sensor_data.machine_id,
                        temperature=float(sensor_data.temperature),
                        vibration=float(sensor_data.vibration),
                        pressure=float(sensor_data.pressure),
                        rpm=float(sensor_data.rpm),
                        operating_hours=float(sensor_data.operating_hours),
                        prediction=prediction_label,
                        health_status=health_status,
                        failure_probability=round(failure_prob, 4),
                        risk_level=risk_level,
                    )
                except Exception as db_exc:
                    logger.error(
                        "Failed to persist prediction record to database for '%s': %s",
                        sensor_data.machine_id,
                        db_exc,
                        exc_info=True,
                    )

            logger.info(
                "Inference complete for '%s': status=%s, risk=%s, failure_prob=%.4f",
                sensor_data.machine_id,
                health_status,
                risk_level,
                failure_prob,
            )

            return PredictionResponse(
                status="success",
                model_status=f"ML model active ({algorithm} v{model_version})",
                prediction=prediction_label,
                health_status=health_status,
                failure_probability=round(failure_prob, 4),
                risk_level=risk_level,
                message=message,
                received_data=sensor_data,
            )

        except Exception as exc:
            logger.error(
                "Prediction inference error for machine '%s': %s",
                sensor_data.machine_id,
                exc,
                exc_info=True,
            )
            return PredictionResponse(
                status="error",
                model_status="ML inference error",
                prediction=None,
                health_status=None,
                failure_probability=None,
                risk_level=None,
                message=f"An internal error occurred during ML model inference: {str(exc)}",
                received_data=sensor_data,
            )


# Singleton instance for route injection
prediction_service = PredictionService()
