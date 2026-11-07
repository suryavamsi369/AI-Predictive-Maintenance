"""Database engine, session factory, and FastAPI dependency."""

import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base

logger = logging.getLogger(__name__)

# Determine if the target database is SQLite (e.g. for testing) or PostgreSQL
db_url = settings.get_database_url()
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialize database tables defined in SQLAlchemy models if they do not exist."""
    try:
        from app.db import models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.warning(
            "Could not automatically create database tables (database may be offline or unmigrated): %s",
            exc,
        )


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding an isolated database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

