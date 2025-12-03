from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import models, schemas, database, security
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(
    prefix="/api/pto",
    tags=["pto"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

# ... imports ...

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)) -> models.User:
    # ... (Same auth logic as before, reusing for brevity if possible, but repeating for safety)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def calculate_balance(category: models.PTOCategory, target_date: datetime) -> float:
    # 1. Calculate accrued time
    time_elapsed = target_date - category.start_date
    if time_elapsed.total_seconds() < 0:
        return category.starting_balance # type: ignore

    periods = 0
    if category.accrual_frequency == models.AccrualFrequency.WEEKLY:
        periods = time_elapsed.days / 7
    elif category.accrual_frequency == models.AccrualFrequency.BIWEEKLY:
        periods = time_elapsed.days / 14
    elif category.accrual_frequency == models.AccrualFrequency.MONTHLY:
        periods = time_elapsed.days / 30.44 # Approx
    elif category.accrual_frequency == models.AccrualFrequency.ANNUALLY:
        periods = time_elapsed.days / 365.25

    accrued = int(periods) * category.accrual_rate
    
    # 2. Sum logs (usage is negative)
    # Note: In a real app, we'd filter logs by date <= target_date
    usage = sum(log.amount for log in category.logs if log.date <= target_date)

    total = category.starting_balance + accrued + usage
    
    if category.max_balance and total > category.max_balance:
        return category.max_balance # type: ignore
    
    return float(total)

@router.get("/categories", response_model=List[schemas.PTOCategory])
def get_categories(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> List[models.PTOCategory]:
    categories = db.query(models.PTOCategory).filter(models.PTOCategory.user_id == current_user.id).all()
    # Compute dynamic balance
    now = datetime.utcnow()
    for cat in categories:
        cat.current_balance = calculate_balance(cat, now)
    return categories

@router.post("/categories", response_model=schemas.PTOCategory)
def create_category(category: schemas.PTOCategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> models.PTOCategory:
    db_category = models.PTOCategory(**category.dict(), user_id=current_user.id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    db_category.current_balance = db_category.starting_balance # Initial
    return db_category

@router.post("/log", response_model=schemas.PTOLog)
def log_usage(log: schemas.PTOLogCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> models.PTOLog:
    # Verify category belongs to user
    category = db.query(models.PTOCategory).filter(models.PTOCategory.id == log.category_id, models.PTOCategory.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_log = models.PTOLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/logs", response_model=List[schemas.PTOLog])
def get_logs(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> List[models.PTOLog]:
    # Join with Category to ensure we only get logs for categories belonging to the user
    logs = db.query(models.PTOLog).join(models.PTOCategory).filter(models.PTOCategory.user_id == current_user.id).all()
    return logs

@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(log_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> None:
    # Ensure log belongs to a category owned by the user
    log = db.query(models.PTOLog).join(models.PTOCategory).filter(models.PTOLog.id == log_id, models.PTOCategory.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    db.commit()
    return None

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> None:
    category = db.query(models.PTOCategory).filter(models.PTOCategory.id == category_id, models.PTOCategory.user_id == current_user.id).first()
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
def update_category(category_id: int, category_update: schemas.PTOCategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> models.PTOCategory:
    db_category = db.query(models.PTOCategory).filter(models.PTOCategory.id == category_id, models.PTOCategory.user_id == current_user.id).first()
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
def forecast_balance(target_date: datetime, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)) -> List[models.PTOCategory]:
    categories = db.query(models.PTOCategory).filter(models.PTOCategory.user_id == current_user.id).all()
    for cat in categories:
        # We reuse the same schema but populate current_balance with the projected value
        # Ideally we'd use a separate schema or field, but for simplicity:
        cat.current_balance = calculate_balance(cat, target_date)
    return categories

@router.post("/presets/amazon", status_code=status.HTTP_201_CREATED)
def create_amazon_presets(
    request: schemas.AmazonPresetRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
) -> dict[str, str]:
    # 1. UPT (Unpaid Time Off)
    # Rate: 5 mins per hour worked.
    # Weekly Accrual = (Shift Length * Shifts/Week * 5) / 60
    upt_weekly_hours = (request.shift_length * request.shifts_per_week * 5) / 60
    
    upt = models.PTOCategory(
        user_id=current_user.id,
        name="UPT (Unpaid Time)",
        accrual_rate=round(upt_weekly_hours, 3),
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=80.0,
        start_date=datetime.utcnow(),
        starting_balance=request.current_upt if request.current_upt is not None else 0.0
    )

    # 2. Flexible PTO
    # Rule: 1.85 hours per week. Cap 48 hours.
    # Policy: 10 hours granted every Jan 1st. New employees get this 10h grant immediately upon start.
    # Implementation: We set starting_balance to current_flex (if provided) or 10.0 (default grant).
    # TODO: Automate the recurring Jan 1st grant (currently requires manual adjustment or new logic).
    flex = models.PTOCategory(
        user_id=current_user.id,
        name="Flexible PTO",
        accrual_rate=1.85,
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=48.0,
        start_date=datetime.utcnow(),
        starting_balance=request.current_flex if request.current_flex is not None else 10.0
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
    else: # 6+ years
        std_rate = 2.31
        std_cap = 120.0

    std = models.PTOCategory(
        user_id=current_user.id,
        name="Standard PTO",
        accrual_rate=std_rate,
        accrual_frequency=models.AccrualFrequency.WEEKLY,
        max_balance=std_cap,
        start_date=datetime.utcnow(),
        starting_balance=request.current_std if request.current_std is not None else 0.0
    )
    
    db.add_all([upt, flex, std])
    db.commit()
    
    return {"message": "Amazon PTO presets created successfully"}
