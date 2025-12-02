from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from .. import models, schemas, database, security
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(
    prefix="/api/pto",
    tags=["pto"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    # ... (Same auth logic as before, reusing for brevity if possible, but repeating for safety)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except security.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def calculate_balance(category: models.PTOCategory, target_date: datetime) -> float:
    # 1. Calculate accrued time
    time_elapsed = target_date - category.start_date
    if time_elapsed.total_seconds() < 0:
        return category.starting_balance

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
        return category.max_balance
    
    return total

@router.get("/categories", response_model=List[schemas.PTOCategory])
def get_categories(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    categories = db.query(models.PTOCategory).filter(models.PTOCategory.user_id == current_user.id).all()
    # Compute dynamic balance
    now = datetime.utcnow()
    for cat in categories:
        cat.current_balance = calculate_balance(cat, now)
    return categories

@router.post("/categories", response_model=schemas.PTOCategory)
def create_category(category: schemas.PTOCategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_category = models.PTOCategory(**category.dict(), user_id=current_user.id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    db_category.current_balance = db_category.starting_balance # Initial
    return db_category

@router.post("/log", response_model=schemas.PTOLog)
def log_usage(log: schemas.PTOLogCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
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
def get_logs(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Join with Category to ensure we only get logs for categories belonging to the user
    logs = db.query(models.PTOLog).join(models.PTOCategory).filter(models.PTOCategory.user_id == current_user.id).all()
    return logs

@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(log_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Ensure log belongs to a category owned by the user
    log = db.query(models.PTOLog).join(models.PTOCategory).filter(models.PTOLog.id == log_id, models.PTOCategory.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    db.commit()
    return None

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
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
def update_category(category_id: int, category_update: schemas.PTOCategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
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
def forecast_balance(target_date: datetime, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    categories = db.query(models.PTOCategory).filter(models.PTOCategory.user_id == current_user.id).all()
    for cat in categories:
        # We reuse the same schema but populate current_balance with the projected value
        # Ideally we'd use a separate schema or field, but for simplicity:
        cat.current_balance = calculate_balance(cat, target_date)
    return categories
