"""Configuration module for loading and managing environment variables."""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


# Locate the directory containing this backend project
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings schema backed by environment variables and .env file."""

    APP_NAME: str = "AI-Powered Predictive Maintenance System"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    # Path to the serialized ML model artifact
    MODEL_PATH: str = str(BASE_DIR / "app" / "ml" / "models" / "predictive_maintenance_rf.joblib")

    # Database Configuration
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
        """Resolve model path whether defined as absolute or relative to project root."""
        p = Path(self.MODEL_PATH)
        if not p.is_absolute():
            return BASE_DIR / p
        return p

    def get_database_url(self) -> str:
        """Construct or return the SQLAlchemy database URL.

        Normalizes 'postgres://' to 'postgresql://' for SQLAlchemy 2.0 compatibility.
        """
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url

        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
