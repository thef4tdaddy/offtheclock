import sys
import os
from datetime import datetime, timedelta
from unittest.mock import MagicMock

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
# Also add the current directory just in case it's run from backend root
sys.path.append(os.getcwd())

from app import models
from app.routers import pto

# Mock PTOCategory
class MockCategory:
    def __init__(self, **kwargs):
        self.id = 1
        self.start_date = None
        self.starting_balance = 0.0
        self.accrued_ytd = 0.0
        self.accrual_rate = 0.0
        self.accrual_frequency = models.AccrualFrequency.WEEKLY
        self.max_balance = None
        self.yearly_accrual_cap = None
        self.annual_grant_amount = 0.0
        self.logs = []
        
        for k, v in kwargs.items():
            setattr(self, k, v)

def test_calculate_balance():
    print("Testing calculate_balance robustness...")
    target_date = datetime.utcnow()

    # Case 1: All None where possible
    print("\nCase 1: All None")
    cat1 = MockCategory(
        start_date=None,
        starting_balance=None,
        accrual_rate=None,
        accrual_frequency=None,
        logs=None
    )
    try:
        bal = pto.calculate_balance(cat1, target_date)
        print(f"Case 1 Result: {bal}")
    except Exception as e:
        print(f"Case 1 CRASHED: {e}")
        import traceback
        traceback.print_exc()

    # Case 2: Start Date exists, but other fields None
    print("\nCase 2: Start Date exists, others None")
    cat2 = MockCategory(
        start_date=datetime(2023, 1, 1),
        starting_balance=None,
        accrued_ytd=None,
        accrual_rate=None, # Should just not accrue
        accrual_frequency=None,
        logs=[MagicMock(date=None, amount=5.0), MagicMock(date=datetime(2023, 2, 1), amount=None)]
    )
    try:
        bal = pto.calculate_balance(cat2, target_date)
        print(f"Case 2 Result: {bal}")
    except Exception as e:
        print(f"Case 2 CRASHED: {e}")
        import traceback
        traceback.print_exc()

    # Case 3: Dates in weird order
    print("\nCase 3: Start Date in Future")
    cat3 = MockCategory(
        start_date=datetime(2026, 1, 1),
        accrual_rate=1.0
    )
    try:
        bal = pto.calculate_balance(cat3, target_date)
        print(f"Case 3 Result: {bal}")
    except Exception as e:
        print(f"Case 3 CRASHED: {e}")
        import traceback
        traceback.print_exc()

    # Case 4: Enum is invalid (simulated by random string if possible, but python typing might prevent. In DB it could happen)
    # models.AccrualFrequency is an Enum class.
    
    # Case 5: Logs having None dates
    print("\nCase 5: Logs with None dates")
    cat5 = MockCategory(
        start_date=datetime(2024, 1, 1),
        accrual_rate=1.0,
        logs=[MagicMock(date=None, amount=10)]
    )
    try:
        bal = pto.calculate_balance(cat5, target_date)
        print(f"Case 5 Result: {bal}")
    except Exception as e:
        print(f"Case 5 CRASHED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_calculate_balance()
