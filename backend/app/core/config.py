

"""Configuration module for loading and managing environment variables."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


# Locate the directory containing this backend project
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings backed by environment variables and .env file."""

    APP_NAME: str = "AI-Powered Predictive Maintenance System"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    # Path to the serialized ML model artifact
    MODEL_PATH: str = str(
        BASE_DIR
        / "app"
        / "ml"
        / "models"
        / "predictive_maintenance_rf.joblib"
    )

    # Database configuration
    DATABASE_URL: Optional[str] = None
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "predictive_maintenance"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def resolved_model_path(self) -> Path:
        """Resolve the model path whether absolute or relative."""
        path = Path(self.MODEL_PATH)

        if not path.is_absolute():
            return BASE_DIR / path

        return path

    def get_database_url(self) -> str:
        """Return a SQLAlchemy URL using the psycopg2 PostgreSQL driver."""

        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()

            # Convert psycopg v3 URL to psycopg2
            if url.startswith("postgresql+psycopg://"):
                url = url.replace(
                    "postgresql+psycopg://",
                    "postgresql+psycopg2://",
                    1,
                )

            # Convert legacy PostgreSQL URL
            elif url.startswith("postgres://"):
                url = url.replace(
                    "postgres://",
                    "postgresql+psycopg2://",
                    1,
                )

            # Convert standard PostgreSQL URL
            elif url.startswith("postgresql://"):
                url = url.replace(
                    "postgresql://",
                    "postgresql+psycopg2://",
                    1,
                )

            return url

        # Fallback to individual database environment variables
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


# Application settings instance
settings = Settings()

