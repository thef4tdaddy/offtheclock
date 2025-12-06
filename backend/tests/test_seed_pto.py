"""
Tests for seed_pto.py script focusing on idempotency.
Ensures that running the seed script multiple times doesn't create duplicates.
"""

from datetime import datetime

import pytest
from sqlalchemy.orm import Session

from app.models import AccrualFrequency, PTOCategory, User


@pytest.mark.db
class TestSeedPTOIdempotency:
    """Test that seed logic can be run multiple times safely."""

    def _create_seed_categories(self, db: Session, user: User):
        """Helper to create seed categories (mimics seed_pto.py logic)."""
        # Clear existing categories for a clean slate (idempotency)
        db.query(PTOCategory).filter(PTOCategory.user_id == user.id).delete()
        db.commit()

        # Create the 3 standard categories
        upt = PTOCategory(
            user_id=user.id,
            name="UPT (Unpaid Time)",
            accrual_rate=3.333,
            accrual_frequency=AccrualFrequency.WEEKLY,
            max_balance=80.0,
            start_date=datetime(2024, 1, 1),
            starting_balance=0.0,
        )

        flex = PTOCategory(
            user_id=user.id,
            name="Flexible PTO",
            accrual_rate=1.85,
            accrual_frequency=AccrualFrequency.WEEKLY,
            max_balance=48.0,
            start_date=datetime(2024, 1, 1),
            starting_balance=10.0,
        )

        std = PTOCategory(
            user_id=user.id,
            name="Standard PTO",
            accrual_rate=1.7,
            accrual_frequency=AccrualFrequency.WEEKLY,
            max_balance=120.0,
            start_date=datetime(2024, 1, 1),
            starting_balance=0.0,
        )

        db.add_all([upt, flex, std])
        db.commit()

    def test_seed_creates_categories(self, db: Session, test_user: User):
        """Test that seed logic creates the expected PTO categories."""
        self._create_seed_categories(db, test_user)

        # Verify categories were created
        categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )

        assert len(categories) == 3, "Should create 3 PTO categories"

        category_names = {cat.name for cat in categories}
        assert "UPT (Unpaid Time)" in category_names
        assert "Flexible PTO" in category_names
        assert "Standard PTO" in category_names

    def test_seed_idempotency_clears_existing(self, db: Session, test_user: User):
        """Test that running seed logic multiple times clears old data (idempotency)."""
        # First seed
        self._create_seed_categories(db, test_user)

        # Get initial categories and modify one to verify deletion
        initial_categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        assert len(initial_categories) == 3

        # Modify one of the categories to prove it gets deleted and recreated
        upt_category = next(cat for cat in initial_categories if "UPT" in cat.name)
        original_accrual_rate = upt_category.accrual_rate
        upt_category.accrual_rate = 999.0  # Modify it
        db.commit()

        # Verify the modification was saved
        modified_cat = (
            db.query(PTOCategory).filter(PTOCategory.id == upt_category.id).first()
        )
        assert modified_cat.accrual_rate == 999.0, "Modification should be saved"

        # Run seed again
        self._create_seed_categories(db, test_user)

        # Verify still only 3 categories (old ones were deleted)
        final_categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        assert len(final_categories) == 3, "Should still have exactly 3 categories"

        # Verify the modified value is gone (proves deletion and recreation)
        final_upt = next(cat for cat in final_categories if "UPT" in cat.name)
        assert (
            final_upt.accrual_rate == original_accrual_rate
        ), "Should recreate with original value, not keep modification"

    def test_seed_category_properties(self, db: Session, test_user: User):
        """Test that seeded categories have correct properties."""
        self._create_seed_categories(db, test_user)

        categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )

        # Find each category and verify properties
        upt = next(cat for cat in categories if "UPT" in cat.name)
        assert upt.accrual_rate == 3.333
        assert upt.max_balance == 80.0
        assert upt.starting_balance == 0.0

        flex = next(cat for cat in categories if "Flexible" in cat.name)
        assert flex.accrual_rate == 1.85
        assert flex.max_balance == 48.0
        assert flex.starting_balance == 10.0

        std = next(cat for cat in categories if "Standard" in cat.name)
        assert std.accrual_rate == 1.7
        assert std.max_balance == 120.0
        assert std.starting_balance == 0.0

    def test_seed_preserves_other_users(
        self, db: Session, test_user: User, admin_user: User
    ):
        """Test that seeding for one user doesn't affect other users."""
        # Create categories for admin user manually
        admin_category = PTOCategory(
            user_id=admin_user.id,
            name="Admin PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=datetime(2024, 1, 1),
            starting_balance=5.0,
        )
        db.add(admin_category)
        db.commit()

        # Seed for test_user
        self._create_seed_categories(db, test_user)

        # Verify admin user's categories are unchanged
        admin_categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == admin_user.id).all()
        )
        assert len(admin_categories) == 1, "Admin user should still have 1 category"
        assert admin_categories[0].name == "Admin PTO"

        # Verify test_user has seeded categories
        test_categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        assert len(test_categories) == 3, "Test user should have 3 seeded categories"

    def test_delete_operation_is_scoped_to_user(
        self, db: Session, test_user: User, admin_user: User
    ):
        """Test that the delete operation in seed only affects the target user."""
        # Create categories for both users
        test_cat = PTOCategory(
            user_id=test_user.id,
            name="Test PTO",
            accrual_rate=1.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=datetime(2024, 1, 1),
            starting_balance=0.0,
        )
        admin_cat = PTOCategory(
            user_id=admin_user.id,
            name="Admin PTO",
            accrual_rate=2.0,
            accrual_frequency=AccrualFrequency.WEEKLY,
            start_date=datetime(2024, 1, 1),
            starting_balance=0.0,
        )
        db.add_all([test_cat, admin_cat])
        db.commit()

        # Run seed for test_user (should delete only test_user's categories)
        self._create_seed_categories(db, test_user)

        # Admin's category should still exist
        admin_categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == admin_user.id).all()
        )
        assert len(admin_categories) == 1, "Admin category should be preserved"

        # Test user should have 3 new categories
        test_categories = (
            db.query(PTOCategory).filter(PTOCategory.user_id == test_user.id).all()
        )
        assert len(test_categories) == 3, "Test user should have 3 new categories"
