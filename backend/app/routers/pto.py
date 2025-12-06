from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, dependencies, models, schemas

router = APIRouter(
    prefix="/api/pto",
    tags=["pto"],
)


def calculate_balance(category: models.PTOCategory, target_date: datetime) -> float:
    # Safety Check: If start_date is missing, we cannot calculate accrual. Return 0 or starting balance.
    if not category.start_date:
        return float(category.starting_balance if category.starting_balance else 0.0)

    current_date: datetime = category.start_date
    balance: float = float(
        category.starting_balance if category.starting_balance else 0.0
    )

    # Safety Check: Ensure logs is iterable (though SQLAlchemy relationships usually are)
    logs = category.logs if category.logs else []

    # Sort logs by date for processing
    sorted_logs = sorted(logs, key=lambda x: x.date if x.date else datetime.min)
    log_idx = 0

    # Track yearly accrual for the cap
    current_year = current_date.year
    # Initialize yearly_accrued from YTD if we are starting in the same year
    yearly_accrued = (
        float(category.accrued_ytd)
        if category.accrued_ytd and category.start_date.year == current_year
        else 0.0
    )

    # Track last grant year to prevent double accrual in grant week
    last_grant_year = 0

    # Safety clamp: Prevent infinite loops if target_date is absurdly far in future or logic fails
    # Also prevent issues if current_date > target_date
    if current_date > target_date:
        return balance

    while current_date <= target_date:
        # 1. Apply Usage/Adjustments for this day
        # We process logs that happened ON this day (or up to this day if we skipped)
        while (
            log_idx < len(sorted_logs)
            and sorted_logs[log_idx].date
            and sorted_logs[log_idx].date.date() <= current_date.date()
        ):
            # Apply log
            balance += (
                sorted_logs[log_idx].amount if sorted_logs[log_idx].amount else 0.0
            )
            log_idx += 1

        # 2. Apply Accrual
        accrual_amount = 0.0
        should_accrue = False

        # Check for Annual Grant (Jan 1st)
        if category.annual_grant_amount and category.annual_grant_amount > 0:
            if current_date.month == 1 and current_date.day == 1:
                # Only grant if it's not the start date
                if current_date > category.start_date:
                    balance += float(category.annual_grant_amount)
                    last_grant_year = current_date.year

        # Check for Period Accrual
        if category.accrual_frequency == models.AccrualFrequency.WEEKLY:
            if current_date.weekday() == 6:  # Sunday
                # Special Rule: If we had a grant this year (Jan 1), and this is the first week of the year, skip accrual.
                is_grant_week = False
                if (
                    category.annual_grant_amount
                    and category.annual_grant_amount > 0
                    and current_date.year == last_grant_year
                ):
                    days_since_jan1 = (
                        current_date - datetime(current_date.year, 1, 1)
                    ).days
                    if days_since_jan1 < 7:
                        is_grant_week = True

                if not is_grant_week and category.accrual_rate:
                    should_accrue = True
                    accrual_amount = float(category.accrual_rate)

        elif category.accrual_frequency == models.AccrualFrequency.BIWEEKLY:
            # Simple logic: every 14 days from start
            delta = (current_date - category.start_date).days
            if delta > 0 and delta % 14 == 0 and category.accrual_rate:
                should_accrue = True
                accrual_amount = float(category.accrual_rate)

        elif category.accrual_frequency == models.AccrualFrequency.MONTHLY:
            if (
                current_date.day == 1
                and current_date > category.start_date
                and category.accrual_rate
            ):
                should_accrue = True
                accrual_amount = float(category.accrual_rate)

        elif category.accrual_frequency == models.AccrualFrequency.ANNUALLY:
            if (
                current_date.month == 1
                and current_date.day == 1
                and current_date > category.start_date
                and category.accrual_rate
            ):
                should_accrue = True
                accrual_amount = float(category.accrual_rate)

        # Apply Yearly Cap Logic
        if should_accrue:
            # Reset yearly counter if new year
            if current_date.year != current_year:
                current_year = current_date.year
                yearly_accrued = 0.0

            # Check if we can accrue more this year
            if category.yearly_accrual_cap:
                remaining_cap = float(category.yearly_accrual_cap) - yearly_accrued
                if remaining_cap > 0:
                    amount_to_add = min(accrual_amount, remaining_cap)
                    balance += amount_to_add
                    yearly_accrued += amount_to_add
            else:
                balance += accrual_amount

        # 3. Apply Max Balance Cap
        if category.max_balance and balance > category.max_balance:
            balance = float(category.max_balance)

        # Advance time
        current_date += timedelta(days=1)

    return float(balance)


@router.get("/categories", response_model=List[schemas.PTOCategory])
def get_categories(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> List[models.PTOCategory]:
    print(f"PTO: Getting categories for user {current_user.id}")
    try:
        categories = (
            db.query(models.PTOCategory)
            .filter(models.PTOCategory.user_id == current_user.id)
            .all()
        )
        print(f"PTO: Found {len(categories)} categories")
    except Exception as e:
        print(f"PTO: DB Query Failed: {e}")
        import traceback

        traceback.print_exc()
        raise e

    # Compute dynamic balance
    now = datetime.utcnow()
    for cat in categories:
        try:
            print(f"PTO: Calculating balance for cat {cat.id} ({cat.name})")
            cat.current_balance = calculate_balance(cat, now)
            print(f"PTO: Balance for {cat.id}: {cat.current_balance}")
        except Exception as e:
            print(f"PTO: Error calculating balance for category {cat.id}: {e}")
            import traceback

            traceback.print_exc()
            cat.current_balance = 0.0  # Fallback
    return categories


@router.post("/categories", response_model=schemas.PTOCategory)
def create_category(
    category: schemas.PTOCategoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> models.PTOCategory:
    db_category = models.PTOCategory(**category.dict(), user_id=current_user.id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    db_category.current_balance = db_category.starting_balance  # Initial
    return db_category


@router.post("/log", response_model=schemas.PTOLog)
def log_usage(
    log: schemas.PTOLogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> models.PTOLog:
    # Verify category belongs to user
    category = (
        db.query(models.PTOCategory)
        .filter(
            models.PTOCategory.id == log.category_id,
            models.PTOCategory.user_id == current_user.id,
        )
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db_log = models.PTOLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/logs", response_model=List[schemas.PTOLog])
def get_logs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> List[models.PTOLog]:
    # Join with Category to ensure we only get logs for categories belonging to the user
    logs = (
        db.query(models.PTOLog)
        .join(models.PTOCategory)
        .filter(models.PTOCategory.user_id == current_user.id)
        .all()
    )
    return logs


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> None:
    # Ensure log belongs to a category owned by the user
    log = (
        db.query(models.PTOLog)
        .join(models.PTOCategory)
        .filter(
            models.PTOLog.id == log_id, models.PTOCategory.user_id == current_user.id
        )
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    db.delete(log)
    db.commit()
    return None


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> None:
    category = (
        db.query(models.PTOCategory)
        .filter(
            models.PTOCategory.id == category_id,
            models.PTOCategory.user_id == current_user.id,
        )
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Note: Cascading delete should handle logs if configured in models, otherwise manual cleanup might be needed.
    # Assuming SQLAlchemy cascade is set or we want to delete logs too.
    # Let's check models.py to be sure, but usually it's safer to explicitly delete or rely on DB cascade.
    # For now, simple delete.
    db.delete(category)
    db.commit()
    return None


@router.put("/categories/{category_id}", response_model=schemas.PTOCategory)
def update_category(
    category_id: int,
    category_update: schemas.PTOCategoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> models.PTOCategory:
    db_category = (
        db.query(models.PTOCategory)
        .filter(
            models.PTOCategory.id == category_id,
            models.PTOCategory.user_id == current_user.id,
        )
        .first()
    )
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Update fields
    for key, value in category_update.dict().items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)

    # Recalculate balance for response
    db_category.current_balance = calculate_balance(db_category, datetime.utcnow())
    return db_category


@router.get("/forecast", response_model=List[schemas.PTOCategory])
def forecast_balance(
    target_date: datetime,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> List[models.PTOCategory]:
    categories = (
        db.query(models.PTOCategory)
        .filter(models.PTOCategory.user_id == current_user.id)
        .all()
    )
    for cat in categories:
        # We reuse the same schema but populate current_balance with the projected value
        # Ideally we'd use a separate schema or field, but for simplicity:
        cat.current_balance = calculate_balance(cat, target_date)
    return categories


@router.post("/presets/amazon", status_code=status.HTTP_201_CREATED)
def create_amazon_presets(
    request: schemas.AmazonPresetRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> dict[str, str]:
    # 1. UPT (Unpaid Time Off)
    # Rate: 5 mins per hour worked.
    # Weekly Accrual = (Shift Length * Shifts/Week * 5) / 60
    upt_weekly_hours = (request.shift_length * request.shifts_per_week * 5) / 60

    # Save User Preferences
    current_user.shift_length = request.shift_length  # type: ignore
    current_user.shifts_per_week = request.shifts_per_week  # type: ignore
    db.add(current_user)

    upt = models.PTOCategory(
        user_id=current_user.id,
        name="UPT",
        accrual_rate=round(upt_weekly_hours, 3),
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=80.0,
        start_date=datetime.utcnow(),
        starting_balance=(
            request.current_upt if request.current_upt is not None else 0.0
        ),
    )

    # 2. Flexible PTO
    # Rule: 1.85 hours per week. Cap 48 hours.
    # Policy: 10 hours granted every Jan 1st. New employees get this 10h grant immediately upon start.
    # Implementation: We set starting_balance to current_flex (if provided) or 10.0 (default grant).
    # TODO: Automate the recurring Jan 1st grant (currently requires manual adjustment or new logic).
    # Calculate accrued_ytd based on date
    # Logic: Weeks passed in current year * 1.85, capped at 38.0
    now = datetime.utcnow()
    year_start = datetime(now.year, 1, 1)
    weeks_passed = max(0, (now - year_start).days // 7)
    estimated_accrued = min(weeks_passed * 1.85, 38.0)

    flex = models.PTOCategory(
        user_id=current_user.id,
        name="Flex PTO",
        accrual_rate=1.85,
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=48.0,
        yearly_accrual_cap=38.0,
        accrued_ytd=estimated_accrued,
        annual_grant_amount=10.0,
        start_date=datetime.utcnow(),
        starting_balance=(
            request.current_flex if request.current_flex is not None else 10.0
        ),
    )

    # 3. Standard PTO
    # Rate & Cap based on tenure
    tenure = request.tenure_years
    std_rate = 0.0
    std_cap = 0.0

    if tenure < 1:
        std_rate = 0.77
        std_cap = 40.0
    elif tenure == 1:
        std_rate = 1.54
        std_cap = 80.0
    elif tenure == 2:
        std_rate = 1.70
        std_cap = 88.0
    elif tenure == 3:
        std_rate = 1.85
        std_cap = 96.0
    elif tenure == 4:
        std_rate = 2.00
        std_cap = 104.0
    elif tenure == 5:
        std_rate = 2.16
        std_cap = 112.0
    else:  # 6+ years
        std_rate = 2.31
        std_cap = 120.0

    std = models.PTOCategory(
        user_id=current_user.id,
        name="Standard PTO",
        accrual_rate=std_rate,
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=std_cap,
        start_date=datetime.utcnow(),
        starting_balance=(
            request.current_std if request.current_std is not None else 0.0
        ),
    )

    db.add_all([upt, flex, std])
    db.commit()

    return {"message": "Amazon PTO presets created successfully"}
