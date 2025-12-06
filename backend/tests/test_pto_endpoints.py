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
        assert (
            balance == 10.0
        ), "Should return starting_balance when target before start"

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

    def test_leap_year_feb_29_accrual(self, db: Session, test_user: User):
        """Test that accrual works correctly on leap year Feb 29."""
        start_date = datetime(2024, 2, 1)  # 2024 is a leap year
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.MONTHLY,
            start_date=start_date,
            starting_balance=10.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Test Feb 29 exists and doesn't break calculation
        target_date = datetime(2024, 2, 29)
        balance = calculate_balance(category, target_date)
        assert balance == 10.0, "Should handle Feb 29 correctly, no accrual yet"

        # Accrual should happen on March 1
        target_date = datetime(2024, 3, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 11.0, "Should accrue on March 1"

    def test_leap_year_weekly_accrual(self, db: Session, test_user: User):
        """Test weekly accrual across leap year boundary."""
        start_date = datetime(2024, 2, 26)  # Monday before leap week
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

        # March 3, 2024 is Sunday (week containing Feb 29)
        target_date = datetime(2024, 3, 3)
        balance = calculate_balance(category, target_date)
        assert balance == 2.0, "Should accrue once by first Sunday after start"

    def test_year_boundary_accrual_reset(self, db: Session, test_user: User):
        """Test yearly accrual cap resets properly at year boundary."""
        start_date = datetime(2024, 12, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=10.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=0.0,
            yearly_accrual_cap=20.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # By end of December, should hit the cap (5 Sundays: Dec 1, 8, 15, 22, 29)
        target_date = datetime(2024, 12, 31)
        balance = calculate_balance(category, target_date)
        assert balance == 20.0, "Should hit yearly cap by end of year"

        # First Sunday of 2025 (Jan 5) should allow more accrual
        target_date = datetime(2025, 1, 5)
        balance = calculate_balance(category, target_date)
        assert balance == 30.0, "Should accrue in new year after cap reset"

    def test_multiple_logs_same_day(self, db: Session, test_user: User):
        """Test handling multiple PTO logs on the same day."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=50.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Add multiple logs on same day
        log1 = PTOLog(
            category_id=category.id,
            date=datetime(2024, 1, 15),
            amount=-8.0,
            note="Morning appointment",
        )
        log2 = PTOLog(
            category_id=category.id,
            date=datetime(2024, 1, 15),
            amount=-4.0,
            note="Afternoon appointment",
        )
        log3 = PTOLog(
            category_id=category.id,
            date=datetime(2024, 1, 15),
            amount=2.0,
            note="Correction",
        )
        db.add_all([log1, log2, log3])
        db.commit()

        target_date = datetime(2024, 1, 20)
        balance = calculate_balance(category, target_date)
        # 50 starting + 2 accruals (Jan 7, 14) - 8 - 4 + 2 = 42
        assert balance == 42.0, "Should handle multiple logs on same day"

    def test_logs_with_none_amounts(self, db: Session, test_user: User):
        """Test that logs with None amounts don't break calculation."""
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

        # Add log with None amount
        log = PTOLog(
            category_id=category.id,
            date=datetime(2024, 1, 5),
            amount=None,
            note="Placeholder",
        )
        db.add(log)
        db.commit()

        target_date = datetime(2024, 1, 10)
        balance = calculate_balance(category, target_date)
        # 10 starting + 1 accrual (Jan 7) + 0 (None treated as 0) = 11
        assert balance == 11.0, "Should treat None amount as 0.0"

    def test_empty_logs_list(self, db: Session, test_user: User):
        """Test category with no logs."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=15.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        target_date = datetime(2024, 1, 21)  # 3 weeks
        balance = calculate_balance(category, target_date)
        assert balance == 21.0, "Should calculate correctly with no logs"

    def test_zero_accrual_rate(self, db: Session, test_user: User):
        """Test category with zero accrual rate."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=0.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=20.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        target_date = datetime(2024, 3, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 20.0, "Should not accrue with zero rate"

    def test_none_accrual_rate(self, db: Session, test_user: User):
        """Test category with None accrual rate."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=None,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=20.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        target_date = datetime(2024, 3, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 20.0, "Should not accrue with None rate"

    def test_none_starting_balance(self, db: Session, test_user: User):
        """Test category with None starting_balance."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=None,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        target_date = datetime(2024, 1, 14)  # 2 weeks
        balance = calculate_balance(category, target_date)
        assert balance == 2.0, "Should treat None starting_balance as 0.0"

    def test_policy_change_rate_adjustment(self, db: Session, test_user: User):
        """Test simulating a policy rate change mid-year using logs."""
        start_date = datetime(2024, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,  # Initial rate
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=0.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # Calculate balance after first quarter with rate 1.0
        target_date = datetime(2024, 3, 31)
        balance_q1 = calculate_balance(category, target_date)

        # Simulate policy change: add adjustment log and change rate
        adjustment_log = PTOLog(
            category_id=category.id,
            date=datetime(2024, 4, 1),
            amount=5.0,  # Bonus for policy change
            note="Policy rate change bonus",
        )
        db.add(adjustment_log)
        category.accrual_rate = 2.0  # New rate
        db.commit()
        db.refresh(category)

        # Calculate with new rate
        target_date = datetime(2024, 4, 14)  # 2 weeks after change
        balance = calculate_balance(category, target_date)
        # Note: calculate_balance uses current rate for ALL accruals
        # This tests that adjustment logs can compensate for rate changes
        expected = balance_q1 + 5.0 + 2.0  # Q1 balance + adjustment + 1 weekly accrual
        assert balance >= expected - 0.5, "Should handle rate change with adjustment"


@pytest.mark.unit
class TestCalculateBalanceEdgeCases:
    """Additional edge case tests for calculate_balance function."""

    def test_very_long_date_range(self, db: Session, test_user: User):
        """Test calculation over very long date range (10 years)."""
        start_date = datetime(2020, 1, 1)
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=0.0,
            max_balance=200.0,
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # 10 years later
        target_date = datetime(2030, 1, 1)
        balance = calculate_balance(category, target_date)
        # Should hit max_balance cap
        assert balance == 200.0, "Should cap at max_balance over long period"

    def test_biweekly_first_period_exact(self, db: Session, test_user: User):
        """Test biweekly accrual occurs exactly on day 14."""
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

        # Day 13 - should not accrue yet
        target_date = datetime(2024, 1, 14)  # Day 13 (0-indexed from start)
        balance = calculate_balance(category, target_date)
        assert balance == 0.0, "Should not accrue before day 14"

        # Day 14 exactly
        target_date = datetime(2024, 1, 15)  # Day 14 from Jan 1
        balance = calculate_balance(category, target_date)
        assert balance == 3.0, "Should accrue on day 14"

    def test_annual_grant_on_start_date_jan1(self, db: Session, test_user: User):
        """Test that annual grant does NOT apply when start_date is Jan 1."""
        start_date = datetime(2024, 1, 1)
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

        # On Jan 1 start date - grant should NOT apply
        target_date = datetime(2024, 1, 1)
        balance = calculate_balance(category, target_date)
        assert balance == 0.0, "Should not grant on start date"

        # Next Jan 1 should get grant
        target_date = datetime(2025, 1, 1)
        balance = calculate_balance(category, target_date)
        # 52 weeks of accrual (52.0) + 10 grant = 62.0
        assert balance >= 62.0, "Should grant on next Jan 1"

    def test_accrued_ytd_carried_forward(self, db: Session, test_user: User):
        """Test that accrued_ytd is properly used when starting mid-year."""
        start_date = datetime(2024, 7, 1)  # Mid-year start
        category = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=start_date,
            starting_balance=10.0,
            yearly_accrual_cap=50.0,
            accrued_ytd=20.0,  # Already accrued 20 hours this year
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        # After 10 weeks (would be 20 more hours, but only 30 allowed due to cap)
        target_date = datetime(2024, 9, 8)  # ~10 weeks later
        balance = calculate_balance(category, target_date)
        # 10 starting + 20 accrued (capped at 50-20=30 remaining)
        assert balance == 30.0, "Should respect accrued_ytd against yearly cap"


@pytest.mark.integration
class TestPTOEndpointsComprehensive:
    """Integration tests for all PTO endpoints."""

    def test_create_category_success(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        """Test creating a new PTO category."""
        category_data = {
            "name": "Sick Leave",
            "accrual_rate": 1.5,
            "accrual_frequency": "weekly",
            "start_date": "2024-01-01T00:00:00",
            "starting_balance": 5.0,
            "max_balance": 80.0,
        }
        response = client.post(
            "/api/pto/categories", json=category_data, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Sick Leave"
        assert data["accrual_rate"] == 1.5
        assert data["current_balance"] == 5.0

    def test_create_category_unauthorized(self, client: TestClient):
        """Test creating category without authentication."""
        category_data = {
            "name": "Test",
            "accrual_rate": 1.0,
            "accrual_frequency": "weekly",
            "start_date": "2024-01-01T00:00:00",
            "starting_balance": 0.0,
        }
        response = client.post("/api/pto/categories", json=category_data)
        assert response.status_code == 401

    def test_log_usage_success(
        self, client: TestClient, auth_headers: dict, pto_category: PTOCategory
    ):
        """Test logging PTO usage."""
        log_data = {
            "category_id": pto_category.id,
            "date": "2024-01-15T00:00:00",
            "amount": -8.0,
            "note": "Sick day",
        }
        response = client.post("/api/pto/log", json=log_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == -8.0
        assert data["note"] == "Sick day"

    def test_log_usage_invalid_category(self, client: TestClient, auth_headers: dict):
        """Test logging usage for non-existent category."""
        log_data = {
            "category_id": 99999,
            "date": "2024-01-15T00:00:00",
            "amount": -8.0,
            "note": "Test",
        }
        response = client.post("/api/pto/log", json=log_data, headers=auth_headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_logs_success(
        self,
        client: TestClient,
        auth_headers: dict,
        pto_category: PTOCategory,
        db: Session,
    ):
        """Test retrieving PTO logs."""
        # Create some logs
        log1 = PTOLog(
            category_id=pto_category.id,
            date=datetime(2024, 1, 15),
            amount=-8.0,
            note="Vacation",
        )
        log2 = PTOLog(
            category_id=pto_category.id,
            date=datetime(2024, 1, 20),
            amount=-4.0,
            note="Personal",
        )
        db.add_all([log1, log2])
        db.commit()

        response = client.get("/api/pto/logs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_delete_log_success(
        self,
        client: TestClient,
        auth_headers: dict,
        pto_category: PTOCategory,
        db: Session,
    ):
        """Test deleting a PTO log."""
        log = PTOLog(
            category_id=pto_category.id,
            date=datetime(2024, 1, 15),
            amount=-8.0,
            note="To be deleted",
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        response = client.delete(f"/api/pto/logs/{log.id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify deletion
        deleted_log = db.query(PTOLog).filter(PTOLog.id == log.id).first()
        assert deleted_log is None

    def test_delete_log_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent log."""
        response = client.delete("/api/pto/logs/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_category_success(
        self,
        client: TestClient,
        auth_headers: dict,
        pto_category: PTOCategory,
        db: Session,
    ):
        """Test deleting a PTO category."""
        category_id = pto_category.id
        response = client.delete(
            f"/api/pto/categories/{category_id}", headers=auth_headers
        )
        assert response.status_code == 204

        # Verify deletion
        deleted_cat = (
            db.query(PTOCategory).filter(PTOCategory.id == category_id).first()
        )
        assert deleted_cat is None

    def test_delete_category_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent category."""
        response = client.delete("/api/pto/categories/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_category_success(
        self,
        client: TestClient,
        auth_headers: dict,
        pto_category: PTOCategory,
    ):
        """Test updating a PTO category."""
        update_data = {
            "name": "Updated Vacation",
            "accrual_rate": 2.5,
            "accrual_frequency": "weekly",
            "start_date": pto_category.start_date.isoformat(),
            "starting_balance": 15.0,
            "max_balance": 100.0,
        }
        response = client.put(
            f"/api/pto/categories/{pto_category.id}",
            json=update_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Vacation"
        assert data["accrual_rate"] == 2.5
        assert "current_balance" in data  # Should recalculate

    def test_update_category_not_found(self, client: TestClient, auth_headers: dict):
        """Test updating non-existent category."""
        update_data = {
            "name": "Test",
            "accrual_rate": 1.0,
            "accrual_frequency": "weekly",
            "start_date": "2024-01-01T00:00:00",
            "starting_balance": 0.0,
        }
        response = client.put(
            "/api/pto/categories/99999", json=update_data, headers=auth_headers
        )
        assert response.status_code == 404

    def test_forecast_balance_success(
        self,
        client: TestClient,
        auth_headers: dict,
        pto_category: PTOCategory,
    ):
        """Test forecasting PTO balance."""
        target_date = "2024-12-31T00:00:00"
        response = client.get(
            f"/api/pto/forecast?target_date={target_date}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert "current_balance" in data[0]
        # Balance should be higher in future due to accruals
        assert data[0]["current_balance"] >= pto_category.starting_balance


@pytest.mark.integration
class TestAmazonPresetsEndpoint:
    """Tests for Amazon PTO presets endpoint."""

    def test_create_amazon_presets_tenure_0(
        self, client: TestClient, auth_headers: dict, db: Session, test_user: User
    ):
        """Test Amazon presets for new employee (tenure 0)."""
        preset_data = {
            "shift_length": 10.0,
            "shifts_per_week": 4,
            "tenure_years": 0,
            "current_upt": 0.0,
            "current_flex": 10.0,
            "current_std": 0.0,
        }
        response = client.post(
            "/api/pto/presets/amazon", json=preset_data, headers=auth_headers
        )
        assert response.status_code == 201
        assert "success" in response.json()["message"].lower()

        # Verify 3 categories created with correct rates
        categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        assert len(categories) == 3

        # Check Standard PTO rate for tenure 0
        std_pto = next(cat for cat in categories if "Standard" in cat.name)
        assert std_pto.accrual_rate == 0.77
        assert std_pto.max_balance == 40.0

    def test_create_amazon_presets_tenure_1(
        self, client: TestClient, auth_headers: dict, db: Session, test_user: User
    ):
        """Test Amazon presets for 1 year tenure."""
        preset_data = {
            "shift_length": 10.0,
            "shifts_per_week": 4,
            "tenure_years": 1,
            "current_upt": 20.0,
            "current_flex": 15.0,
            "current_std": 10.0,
        }
        response = client.post(
            "/api/pto/presets/amazon", json=preset_data, headers=auth_headers
        )
        assert response.status_code == 201

        categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        std_pto = next(cat for cat in categories if "Standard" in cat.name)
        assert std_pto.accrual_rate == 1.54
        assert std_pto.max_balance == 80.0

    def test_create_amazon_presets_tenure_6plus(
        self, client: TestClient, auth_headers: dict, db: Session, test_user: User
    ):
        """Test Amazon presets for 6+ years tenure."""
        preset_data = {
            "shift_length": 10.0,
            "shifts_per_week": 4,
            "tenure_years": 8,
            "current_upt": 40.0,
            "current_flex": 30.0,
            "current_std": 60.0,
        }
        response = client.post(
            "/api/pto/presets/amazon", json=preset_data, headers=auth_headers
        )
        assert response.status_code == 201

        categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        std_pto = next(cat for cat in categories if "Standard" in cat.name)
        assert std_pto.accrual_rate == 2.31
        assert std_pto.max_balance == 120.0

    def test_create_amazon_presets_upt_calculation(
        self, client: TestClient, auth_headers: dict, db: Session, test_user: User
    ):
        """Test UPT calculation based on shift length and frequency."""
        preset_data = {
            "shift_length": 12.0,  # 12 hour shifts
            "shifts_per_week": 3,  # 3 shifts per week
            "tenure_years": 2,
            "current_upt": 0.0,
            "current_flex": 10.0,
            "current_std": 0.0,
        }
        response = client.post(
            "/api/pto/presets/amazon", json=preset_data, headers=auth_headers
        )
        assert response.status_code == 201

        categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        upt = next(cat for cat in categories if "UPT" in cat.name)
        # UPT rate = (12 * 3 * 5) / 60 = 180 / 60 = 3.0
        assert upt.accrual_rate == 3.0
        assert upt.max_balance == 80.0

    def test_create_amazon_presets_flex_properties(
        self, client: TestClient, auth_headers: dict, db: Session, test_user: User
    ):
        """Test Flex PTO has correct properties."""
        preset_data = {
            "shift_length": 10.0,
            "shifts_per_week": 4,
            "tenure_years": 3,
            "current_upt": 0.0,
            "current_flex": 20.0,
            "current_std": 0.0,
        }
        response = client.post(
            "/api/pto/presets/amazon", json=preset_data, headers=auth_headers
        )
        assert response.status_code == 201

        categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        flex = next(cat for cat in categories if "Flex" in cat.name)
        assert flex.accrual_rate == 1.85
        assert flex.max_balance == 48.0
        assert flex.yearly_accrual_cap == 38.0
        assert flex.annual_grant_amount == 10.0
        assert flex.starting_balance == 20.0

    def test_create_amazon_presets_all_tenure_levels(
        self, client: TestClient, auth_headers: dict, db: Session, test_user: User
    ):
        """Parameterized test for all tenure levels."""
        tenure_rates = {
            0: (0.77, 40.0),
            1: (1.54, 80.0),
            2: (1.70, 88.0),
            3: (1.85, 96.0),
            4: (2.00, 104.0),
            5: (2.16, 112.0),
            6: (2.31, 120.0),
        }

        for tenure, (expected_rate, expected_cap) in tenure_rates.items():
            # Clear existing categories
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).delete()
            db.commit()

            preset_data = {
                "shift_length": 10.0,
                "shifts_per_week": 4,
                "tenure_years": tenure,
                "current_upt": 0.0,
                "current_flex": 10.0,
                "current_std": 0.0,
            }
            response = client.post(
                "/api/pto/presets/amazon", json=preset_data, headers=auth_headers
            )
            assert response.status_code == 201, f"Failed for tenure {tenure}"

            categories = (
                db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
            )
            std_pto = next(cat for cat in categories if "Standard" in cat.name)
            assert (
                std_pto.accrual_rate == expected_rate
            ), f"Wrong rate for tenure {tenure}"
            assert std_pto.max_balance == expected_cap, f"Wrong cap for tenure {tenure}"

    def test_create_amazon_presets_saves_user_preferences(
        self, client: TestClient, auth_headers: dict, db: Session, test_user: User
    ):
        """Test that user preferences are saved."""
        preset_data = {
            "shift_length": 8.5,
            "shifts_per_week": 5,
            "tenure_years": 2,
        }
        response = client.post(
            "/api/pto/presets/amazon", json=preset_data, headers=auth_headers
        )
        assert response.status_code == 201

        # Verify user preferences updated
        db.refresh(test_user)
        assert test_user.shift_length == 8.5
        assert test_user.shifts_per_week == 5
