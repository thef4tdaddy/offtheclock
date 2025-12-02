from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine
from backend.app import models
from datetime import datetime

def seed_data():
    db = SessionLocal()
    
    # Get the first user (assuming single user for now)
    user = db.query(models.User).first()
    if not user:
        print("No user found! Please register a user first.")
        return

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
    db.close()

if __name__ == "__main__":
    seed_data()
