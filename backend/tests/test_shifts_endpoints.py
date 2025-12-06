"""
Integration tests for shifts endpoints.
Tests shift creation, retrieval, and deletion with UPT accrual.
"""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import AccrualFrequency, PTOCategory, User


@pytest.fixture
def upt_category(db: Session, test_user: User) -> PTOCategory:
    """Create a UPT category for testing."""
    category = PTOCategory(
        user_id=test_user.id,
        name="Unpaid Time",
        accrual_rate=0.0,
        accrual_frequency=AccrualFrequency.WEEKLY,
        start_date=datetime.utcnow(),
        starting_balance=20.0,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.mark.integration
class TestShiftCreation:
    """Tests for shift creation endpoints."""

    def test_create_shift_success(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db: Session,
        test_user: User,
    ) -> None:
        """Test successful shift creation."""
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=10)

        shift_data = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }

        response = client.post("/shifts/", json=shift_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["user_id"] == test_user.id
        assert "start_time" in data
        assert "end_time" in data

    def test_create_shift_with_upt_accrual(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        upt_category: PTOCategory,
    ) -> None:
        """Test shift creation with automatic UPT accrual."""
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=10)

        shift_data = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }

        response = client.post("/shifts/", json=shift_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["upt_log_id"] is not None

    def test_create_shift_invalid_times(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test shift creation with end time before start time fails."""
        start_time = datetime.utcnow()
        end_time = start_time - timedelta(hours=1)

        shift_data = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }

        response = client.post("/shifts/", json=shift_data, headers=auth_headers)

        assert response.status_code == 400
        assert "after start time" in response.json()["detail"].lower()

    def test_create_shift_unauthorized(self, client: TestClient) -> None:
        """Test shift creation without auth fails."""
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=10)

        shift_data = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }

        response = client.post("/shifts/", json=shift_data)

        assert response.status_code == 401


@pytest.mark.integration
class TestBatchShiftCreation:
    """Tests for batch shift creation endpoint."""

    def test_create_batch_shifts_success(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        test_user: User,
    ) -> None:
        """Test successful batch shift creation."""
        base_time = datetime.utcnow()
        shifts_data = []

        for i in range(3):
            start_time = base_time + timedelta(days=i)
            end_time = start_time + timedelta(hours=8)
            shifts_data.append(
                {
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                }
            )

        response = client.post("/shifts/batch", json=shifts_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        series_id = data[0]["series_id"]
        assert series_id is not None
        for shift in data:
            assert shift["user_id"] == test_user.id
            assert shift["series_id"] == series_id

    def test_create_batch_shifts_with_upt(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        upt_category: PTOCategory,
    ) -> None:
        """Test batch shift creation with UPT accrual."""
        base_time = datetime.utcnow()
        shifts_data = []

        for i in range(2):
            start_time = base_time + timedelta(days=i)
            end_time = start_time + timedelta(hours=10)
            shifts_data.append(
                {
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                }
            )

        response = client.post("/shifts/batch", json=shifts_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        for shift in data:
            # Batch shifts should NOT accrue UPT automatically anymore
            assert shift["upt_log_id"] is None

    def test_create_batch_shifts_skips_invalid(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test that batch creation skips invalid shifts."""
        base_time = datetime.utcnow()
        shifts_data = [
            # Valid shift
            {
                "start_time": base_time.isoformat(),
                "end_time": (base_time + timedelta(hours=8)).isoformat(),
            },
            # Invalid shift (end before start)
            {
                "start_time": base_time.isoformat(),
                "end_time": (base_time - timedelta(hours=1)).isoformat(),
            },
            # Valid shift
            {
                "start_time": (base_time + timedelta(days=1)).isoformat(),
                "end_time": (base_time + timedelta(days=1, hours=8)).isoformat(),
            },
        ]

        response = client.post("/shifts/batch", json=shifts_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        # Should only create 2 valid shifts
        assert len(data) == 2


@pytest.mark.integration
class TestShiftRetrieval:
    """Tests for shift retrieval endpoints."""

    def test_get_shifts_empty(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test getting shifts when none exist."""
        response = client.get("/shifts/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_shifts_with_data(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        test_user: User,
    ) -> None:
        """Test getting shifts after creating some."""
        # Create a shift first
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=10)
        shift_data = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }
        client.post("/shifts/", json=shift_data, headers=auth_headers)

        # Now retrieve shifts
        response = client.get("/shifts/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["user_id"] == test_user.id

    def test_get_shifts_pagination(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test shift retrieval with pagination."""
        # Create multiple shifts
        base_time = datetime.utcnow()
        for i in range(5):
            shift_data = {
                "start_time": (base_time + timedelta(days=i)).isoformat(),
                "end_time": (base_time + timedelta(days=i, hours=8)).isoformat(),
            }
            client.post("/shifts/", json=shift_data, headers=auth_headers)

        # Get first page
        response = client.get("/shifts/?skip=0&limit=3", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 3

        # Get second page
        response = client.get("/shifts/?skip=3&limit=3", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 2


@pytest.mark.integration
class TestShiftDeletion:
    """Tests for shift deletion endpoint."""

    def test_delete_shift_success(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test successful shift deletion."""
        # Create a shift
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=10)
        shift_data = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }
        create_response = client.post("/shifts/", json=shift_data, headers=auth_headers)
        shift_id = create_response.json()["id"]

        # Delete the shift
        response = client.delete(f"/shifts/{shift_id}", headers=auth_headers)

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

        # Verify shift is gone
        get_response = client.get("/shifts/", headers=auth_headers)
        assert len(get_response.json()) == 0

    def test_delete_nonexistent_shift(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test deleting nonexistent shift fails."""
        response = client.delete("/shifts/99999", headers=auth_headers)

        assert response.status_code == 404


@pytest.mark.integration
class TestShiftSeriesDeletion:
    """Tests for shift series deletion endpoint."""

    def test_delete_shift_series_success(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        test_user: User,
    ) -> None:
        """Test successful shift series deletion."""
        # Create a batch of shifts
        base_time = datetime.utcnow()
        shifts_data = []
        for i in range(3):
            shifts_data.append(
                {
                    "start_time": (base_time + timedelta(days=i)).isoformat(),
                    "end_time": (base_time + timedelta(days=i, hours=8)).isoformat(),
                }
            )

        batch_response = client.post(
            "/shifts/batch", json=shifts_data, headers=auth_headers
        )
        batch_data = batch_response.json()
        series_id = batch_data[0]["series_id"]

        assert series_id is not None
        # Verify all share the same series_id
        assert all(s["series_id"] == series_id for s in batch_data)

        # Delete the series
        response = client.delete(f"/shifts/series/{series_id}", headers=auth_headers)
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

        # Verify shifts are gone
        get_response = client.get("/shifts/", headers=auth_headers)
        assert len(get_response.json()) == 0

    def test_delete_nonexistent_series(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test deleting nonexistent series works conceptually (idempotent or 404 depending on implementation)."""
        # Our implementation creates a 404 if no shifts found? Or 200 with 0 deleted?
        # Let's check the router logic.
        # Actually our router does: .filter(and_(Shift.series_id == series_id, Shift.user_id == user.id))
        # result = db.execute(...) -> if result.rowcount == 0: raise 404

        response = client.delete(
            "/shifts/series/nonexistent-uuid", headers=auth_headers
        )
        assert response.status_code == 404

    def test_delete_series_unauthorized(self, client: TestClient) -> None:
        """Test deleting series without auth fails."""
        response = client.delete("/shifts/series/some-uuid")
        assert response.status_code == 401
