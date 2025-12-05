"""
Tests for PTO seeding scripts.
Ensures onboarding stability.
"""

import pytest
from sqlalchemy.orm import Session

from app.models import AccrualFrequency, PTOCategory, User, UserRole
from app.seed_pto import seed_data
from app.security import get_password_hash


@pytest.mark.unit
class TestSeedPTOScript:
    """Test PTO seeding functionality."""

    def test_seed_data_with_valid_user(self, db: Session) -> None:
        """Test seeding with a valid user."""
        # Create a user
        user = User(
            email="seed@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.EMPLOYEE,
            full_name="Seed User",
        )
        db.add(user)
        db.commit()

        # Seed data for this user
        seed_data(email="seed@example.com", db=db)

        # Verify categories were created
        categories = (
            db.query(PTOCategory)
            .filter(PTOCategory.user_id == user.id)
            .all()
        )

        assert len(categories) == 3

        # Verify UPT category
        upt = next((c for c in categories if "UPT" in c.name), None)
        assert upt is not None
        assert upt.accrual_rate == 3.333
        assert upt.accrual_frequency == AccrualFrequency.WEEKLY
        assert upt.max_balance == 80.0
        assert upt.starting_balance == 0.0

        # Verify Flexible PTO category
        flex = next((c for c in categories if "Flexible" in c.name), None)
        assert flex is not None
        assert flex.accrual_rate == 1.85
        assert flex.accrual_frequency == AccrualFrequency.WEEKLY
        assert flex.max_balance == 48.0
        assert flex.starting_balance == 10.0  # Jan 1 grant

        # Verify Standard PTO category
        std = next((c for c in categories if "Standard" in c.name), None)
        assert std is not None
        assert std.accrual_rate == 1.7  # 2-year tenure default
        assert std.accrual_frequency == AccrualFrequency.WEEKLY
        assert std.max_balance == 120.0
        assert std.starting_balance == 0.0

    def test_seed_data_with_no_email_uses_first_user(
        self, db: Session
    ) -> None:
        """Test seeding without email uses first user."""
        # Create two users
        user1 = User(
            email="first@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.EMPLOYEE,
        )
        user2 = User(
            email="second@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.EMPLOYEE,
        )
        db.add_all([user1, user2])
        db.commit()

        # Seed without specifying email
        seed_data(db=db)

        # Verify categories were created for first user
        categories = (
            db.query(PTOCategory)
            .filter(PTOCategory.user_id == user1.id)
            .all()
        )

        assert len(categories) == 3

        # Verify second user has no categories
        categories2 = (
            db.query(PTOCategory)
            .filter(PTOCategory.user_id == user2.id)
            .all()
        )
        assert len(categories2) == 0

    def test_seed_data_clears_existing_categories(
        self, db: Session
    ) -> None:
        """Test that seeding clears existing categories for clean slate."""
        # Create user with existing categories
        user = User(
            email="seed@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.EMPLOYEE,
        )
        db.add(user)
        db.commit()

        # Add existing category
        old_category = PTOCategory(
            user_id=user.id,
            name="Old Category",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
        )
        db.add(old_category)
        db.commit()

        # Seed data
        seed_data(email="seed@example.com", db=db)

        # Verify old category is gone
        categories = (
            db.query(PTOCategory)
            .filter(PTOCategory.user_id == user.id)
            .all()
        )

        assert len(categories) == 3
        assert not any(c.name == "Old Category" for c in categories)

    def test_seed_data_with_nonexistent_email(
        self, db: Session, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """Test seeding with nonexistent email prints error."""
        # Attempt to seed for non-existent user
        seed_data(email="nonexistent@example.com", db=db)

        # Check error message was printed
        captured = capsys.readouterr()
        assert "No user found" in captured.out

        # Verify no categories were created
        categories = db.query(PTOCategory).all()
        assert len(categories) == 0

    def test_seed_data_with_no_users_in_db(
        self, db: Session, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """Test seeding when database has no users."""
        # Database is empty (no users)
        seed_data(db=db)

        # Check error message was printed
        captured = capsys.readouterr()
        assert "No user found" in captured.out

        # Verify no categories were created
        categories = db.query(PTOCategory).all()
        assert len(categories) == 0
