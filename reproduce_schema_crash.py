import sys
import os
from datetime import datetime
from pydantic import ValidationError

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
sys.path.append(os.getcwd())

from app import schemas, models

def test_schema_validation():
    print("Testing Pydantic Schema Validation...")

    # Case 1: All Nulls (Simulating bad DB row)
    print("\nCase 1: Validating object with Null start_date")
    
    # Simulate an object from DB (using simple dict for from_attributes or class)
    class MockDBObj:
        id = 1
        user_id = 1
        name = "Test"
        accrual_rate = None  # INVALID per current schema
        accrual_frequency = None # INVALID
        max_balance = None
        yearly_accrual_cap = None
        accrued_ytd = 0.0
        annual_grant_amount = 0.0
        start_date = None # INVALID per current schema
        starting_balance = 0.0
        current_balance = 0.0
        projected_balance = 0.0
        logs = []

    db_obj = MockDBObj()

    try:
        # Pydantic v2 use model_validate, v1 used from_orm. checks what version is installed
        # pydantic in reqs is 2.12
        result = schemas.PTOCategory.model_validate(db_obj)
        print("Case 1 Success:", result)
    except ValidationError as e:
        print("Case 1 FAILED (Expected):")
        print(e)
    except Exception as e:
        print(f"Case 1 CRASHED: {e}")

if __name__ == "__main__":
    test_schema_validation()
