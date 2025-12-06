"""
Integration tests for PTO endpoints.
Tests category retrieval, balance calculation, and logging.
"""

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import AccrualFrequency, PTOCategory, PTOLog, User
from app.routers.pto import calculate_balance


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


@pytest.mark.unit
class TestCalculateBalance:
    """Unit tests for calculate_balance function covering accrual logic and limits."""

    def test_weekly_accrual(self, db: Session, test_user: User):
        """Test weekly accrual on Sundays."""
        start_date = datetime(2024, 1, 1)  # Monday
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=0.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Calculate balance after 1 week (should accrue on first Sunday - Jan 7)
        target_date = datetime(2024, 1, 7)  # Sunday
        balance = calculate_balance(category, target_date)
        assert balance == 2.0, "Should accrue 2.0 hours on first Sunday"

        # Calculate balance after 2 weeks
        target_date = datetime(2024, 1, 14)  # Second Sunday
        balance = calculate_balance(category, target_date)
        assert balance == 4.0, "Should accrue 4.0 hours after two Sundays"

    def test_biweekly_accrual(self, db: Session, test_user: User):
        """Test biweekly accrual every 14 days."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=3.0,
            accrual_frequency=AccrualFrequency.BIWEEKLY,
            start_date=start_date,
            starting_balance=0.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # After 14 days
        target_date = datetime(2024, 1, 15)
        balance = calculate_balance(category, target_date)
        assert balance == 3.0, "Should accrue 3.0 hours after 14 days"

        # After 28 days
        target_date = datetime(2024, 1, 29)
        balance = calculate_balance(category, target_date)
        assert balance == 6.0, "Should accrue 6.0 hours after 28 days"

    def test_monthly_accrual(self, db: Session, test_user: User):
        """Test monthly accrual on the 1st of each month."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=5.0,
            accrual_frequency=AccrualFrequency.MONTHLY,
            start_date=start_date,
            starting_balance=0.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Should not accrue on start date (Jan 1)
        target_date = datetime(2024, 1, 15)
        balance = calculate_balance(category, target_date)
        assert balance == 0.0, "Should not accrue in first month on start date"

        # Should accrue on Feb 1
        target_date = datetime(2024, 2, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 5.0, "Should accrue 5.0 hours on Feb 1"

        # Should have 2 accruals by March 1
        target_date = datetime(2024, 3, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 10.0, "Should accrue 10.0 hours by March 1"

    def test_annual_accrual(self, db: Session, test_user: User):
        """Test annual accrual on January 1st."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=40.0,
            accrual_frequency=AccrualFrequency.ANNUALLY,
            start_date=start_date,
            starting_balance=0.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Should not accrue on start date
        target_date = datetime(2024, 6, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 0.0, "Should not accrue in first year on start date"

        # Should accrue on next Jan 1
        target_date = datetime(2025, 1, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 40.0, "Should accrue 40.0 hours on next Jan 1"

    def test_max_balance_cap(self, db: Session, test_user: User):
        """Test that balance is capped at max_balance."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=10.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=40.0,
            max_balance=50.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # After 2 weeks, would be 60.0 but should cap at 50.0
        target_date = datetime(2024, 1, 14)  # Second Sunday
        balance = calculate_balance(category, target_date)
        assert balance == 50.0, "Balance should be capped at max_balance of 50.0"

    def test_yearly_accrual_cap(self, db: Session, test_user: User):
        """Test that yearly accrual is limited by yearly_accrual_cap."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=0.0,
            yearly_accrual_cap=10.0,  # Only 10 hours per year
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # After 10 weeks (20 hours would normally accrue)
        target_date = datetime(2024, 3, 10)  # ~10 weeks
        balance = calculate_balance(category, target_date)
        assert balance == 10.0, "Should not accrue more than yearly_accrual_cap of 10.0"

        # Next year should reset the cap
        target_date = datetime(2025, 1, 7)  # First Sunday of next year
        balance = calculate_balance(category, target_date)
        assert balance == 12.0, "Should accrue 2.0 more in new year after cap reset"

    def test_annual_grant_amount(self, db: Session, test_user: User):
        """Test that annual_grant_amount is applied on January 1st."""
        start_date = datetime(2023, 12, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=0.0,
            annual_grant_amount=10.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Before Jan 1, 2024 - should have weekly accruals only
        # Dec 2023: Sundays are Dec 3, 10, 17, 24, 31 (5 Sundays after Dec 1 start)
        target_date = datetime(2023, 12, 31)
        balance = calculate_balance(category, target_date)
        # Should have 5 weeks of accrual (5.0 hours)
        assert balance == 5.0, f"Should have 5 weekly accruals, got {balance}"

        # On Jan 1, 2024, should get annual grant
        target_date = datetime(2024, 1, 1)
        balance = calculate_balance(category, target_date)
        # Should have 5 weeks (5.0) + 10.0 annual grant = 15.0
        assert balance == 15.0, f"Should include 10.0 annual grant, got {balance}"

    def test_grant_week_accrual_skip(self, db: Session, test_user: User):
        """Test that weekly accrual is skipped in the week of annual grant."""
        start_date = datetime(2023, 12, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Flex PTO",
            accrual_rate=1.85,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=0.0,
            annual_grant_amount=10.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Jan 7, 2024 is the first Sunday of the year (within 7 days of Jan 1)
        target_date = datetime(2024, 1, 7)
        balance = calculate_balance(category, target_date)
        # Dec 2023: Sundays are Dec 3, 10, 17, 24, 31 (5 Sundays)
        # Dec accruals: 5 * 1.85 = 9.25
        # Jan 1 grant: 10.0
        # Jan 7 accrual: SKIPPED (grant week rule)
        expected = 9.25 + 10.0
        assert balance == pytest.approx(
            expected, abs=0.01
        ), f"Should skip accrual on first Sunday after grant, expected {expected}, got {balance}"

        # Jan 14, 2024 (second Sunday) should accrue normally
        target_date = datetime(2024, 1, 14)
        balance = calculate_balance(category, target_date)
        expected = 9.25 + 10.0 + 1.85
        assert balance == pytest.approx(
            expected, abs=0.01
        ), f"Should resume normal accrual on second Sunday, expected {expected}, got {balance}"

    def test_pto_log_usage(self, db: Session, test_user: User):
        """Test that PTO logs (usage/adjustments) are applied correctly."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=20.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Add a usage log (negative amount)
        log1 = PTOLog(
            category_id=category.id,
            date=datetime(2024, 1, 5),
            amount=-8.0,  # Used 8 hours
            note="Vacation day",
        )
        db.add(log1)
        db.commit()

        # Calculate balance after usage
        target_date = datetime(2024, 1, 10)
        balance = calculate_balance(category, target_date)
        # 20.0 starting + 2.0 (Jan 7 accrual) - 8.0 (usage) = 14.0
        assert balance == 14.0, "Should apply usage log correctly"

    def test_pto_log_adjustment(self, db: Session, test_user: User):
        """Test that positive PTO log adjustments are applied correctly."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=10.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Add a positive adjustment
        log = PTOLog(
            category_id=category.id,
            date=datetime(2024, 1, 5),
            amount=5.0,  # Manual adjustment
            note="Bonus hours",
        )
        db.add(log)
        db.commit()

        # Calculate balance
        target_date = datetime(2024, 1, 10)
        balance = calculate_balance(category, target_date)
        # 10.0 starting + 1.0 (Jan 7 accrual) + 5.0 (adjustment) = 16.0
        assert balance == 16.0, "Should apply positive adjustment correctly"

    def test_missing_start_date(self, db: Session, test_user: User):
        """Test that categories without start_date return starting_balance."""
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=None,  # Missing start date
            starting_balance=15.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        balance = calculate_balance(category, datetime(2024, 1, 1))
        assert balance == 15.0, "Should return starting_balance when start_date is None"

    def test_target_date_before_start_date(self, db: Session, test_user: User):
        """Test that balance calculation handles target_date before start_date."""
        start_date = datetime(2024, 6, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=10.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Target date before start date
        target_date = datetime(2024, 1, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 10.0, "Should return starting_balance when target before start"

    def test_combined_caps(self, db: Session, test_user: User):
        """Test interaction between max_balance and yearly_accrual_cap."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=5.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=30.0,
            max_balance=50.0,
            yearly_accrual_cap=15.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # After 10 weeks, yearly cap should limit to 15.0
        target_date = datetime(2024, 3, 10)
        balance = calculate_balance(category, target_date)
        assert balance == 45.0, "Should respect yearly_accrual_cap: 30 + 15 = 45"

        # If we continue, max_balance should cap
        # But yearly_accrual_cap already prevents further accrual this year
        target_date = datetime(2024, 12, 31)
        balance = calculate_balance(category, target_date)
        assert balance == 45.0, "Should stay at 45 due to yearly_accrual_cap"
