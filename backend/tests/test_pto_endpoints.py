"""
Integration tests for PTO endpoints.
Tests category retrieval, balance calculation, and logging.
"""

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import AccrualFrequency, PTOCategory, User


@pytest.fixture
def pto_category(db: Session, test_user: User) -> PTOCategory:
    category = PTOCategory(
        user_id=test_user.id,
        name="Vacation",
        accrual_rate=1.0,
        accrual_frequency=AccrualFrequency.WEEKLY,
        start_date=datetime.utcnow(),
        starting_balance=10.0,
        accrued_ytd=0.0,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.mark.integration
class TestPTOEndpoints:

    def test_get_categories_success(
        self, client: TestClient, auth_headers: dict, pto_category: PTOCategory
    ):
        response = client.get("/api/pto/categories", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == "Vacation"
        assert "current_balance" in data[0]
        assert data[0]["current_balance"] >= 10.0

    def test_get_categories_unauthorized(self, client: TestClient):
        response = client.get("/api/pto/categories")
        assert response.status_code == 401
