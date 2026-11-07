"""Pytest configuration and fixtures with isolated in-memory test database."""

import os
import sys
from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is in sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

# Point database setting to fast in-memory SQLite for tests to prevent connection timeouts
TEST_DATABASE_URL = "sqlite:///:memory:"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from app.core.config import settings
settings.DATABASE_URL = TEST_DATABASE_URL

from app.db.base import Base
from app.db.session import get_db, init_db
from app.main import app

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db() -> Generator[Session, None, None]:
    """Dependency override injecting the in-memory test database."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all database tables once for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def clean_db_tables():
    """Clean table records before each test for test isolation."""
    with TestingSessionLocal() as session:
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()
    yield


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Fixture providing a database session for direct inspection during tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """Fixture providing a module-scoped FastAPI TestClient."""
    with TestClient(app) as test_client:
        yield test_client
