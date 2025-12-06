"""
Pytest configuration and fixtures for testing.
Provides database setup with transaction rollback for test isolation.
"""

from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, UserRole
from app.security import get_password_hash

# Use in-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    Create a fresh database for each test using transaction rollback.
    This ensures test isolation and fast execution.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create a new session for the test
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    # Rollback transaction to clean up
    session.close()
    transaction.rollback()
    connection.close()

    # Drop all tables
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with the test database.
    All database access during the test will use the same db session.
    """

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass  # Don't close here, let the db fixture handle it

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db: Session) -> User:
    """
    Create a test user in the database.
    """
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        role=UserRole.EMPLOYEE,
        full_name="Test User",
        employer="Test Company",
        shift_length=10.0,
        shifts_per_week=4,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_user(db: Session) -> User:
    """
    Create an admin user in the database.
    """
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword123"),
        role=UserRole.ADMIN,
        full_name="Admin User",
        employer="Test Company",
        shift_length=8.0,
        shifts_per_week=5,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(client: TestClient, test_user: User) -> dict[str, str]:
    """
    Get authentication headers for the test user.
    """
    response = client.post(
        "/api/auth/token",
        data={"username": test_user.email, "password": "testpassword123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
