from app.database import SessionLocal
from app import models
from datetime import datetime
from typing import Optional

import sys
from sqlalchemy.orm import Session

def seed_data(email: Optional[str] = None, db: Optional[Session] = None) -> None:
    """
    Seed PTO categories for a user.
    
    Args:
        email: Email of the user to seed data for. If None, uses first user.
        db: Database session. If None, creates a new session.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    
    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
    else:
        # Get the first user (fallback)
        user = db.query(models.User).first()
        
    if not user:
        print(f"No user found{' with email ' + email if email else ''}! Please register a user first.")
        return

    print(f"Seeding data for user: {user.email}")

    # Clear existing categories for a clean slate
    db.query(models.PTOCategory).filter(models.PTOCategory.user_id == user.id).delete()
    db.commit()

    # 1. UPT (Unpaid Time Off)
    # Rule: 5 mins per hour worked. Assuming 40h week: 200 mins = 3.333 hours/week.
    # Cap: 80 hours.
    upt = models.PTOCategory(
        user_id=user.id,
        name="UPT (Unpaid Time)",
        accrual_rate=3.333,
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=80.0,
        start_date=datetime(2024, 1, 1), # Assuming start of year
        starting_balance=0.0
    )

    # 2. Flexible PTO
    # Rule: 1.85 hours per week. Cap 48 hours.
    # Note: "Jan 1 get 10 hours" -> Added to starting balance.
    flex = models.PTOCategory(
        user_id=user.id,
        name="Flexible PTO",
        accrual_rate=1.85,
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=48.0,
        start_date=datetime(2024, 1, 1),
        starting_balance=10.0 # The Jan 1 grant
    )

    # 3. Standard PTO
    # Rule: 2 Year Tenure -> 1.7 hours per week.
    # Cap: 120 hours (Global cap).
    std = models.PTOCategory(
        user_id=user.id,
        name="Standard PTO",
        accrual_rate=1.7,
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=120.0,
        start_date=datetime(2024, 1, 1),
        starting_balance=0.0 # Assuming 0 carry-over for now, user can adjust
    )

    db.add_all([upt, flex, std])
    db.commit()
    print("Successfully seeded PTO categories!")
    
    if close_db:
        db.close()

if __name__ == "__main__":
    email_arg = sys.argv[1] if len(sys.argv) > 1 else None
    seed_data(email_arg)
