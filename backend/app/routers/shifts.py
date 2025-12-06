from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import database, dependencies, models, schemas

router = APIRouter(
    prefix="/shifts",
    tags=["shifts"],
    responses={404: {"description": "Not found"}},
)


def get_db():
    try:
        db = database.SessionLocal()
        yield db
    finally:
        db.close()


def calculate_upt_accrual(hours_worked: float) -> float:
    # Amazon Policy: 5 minutes UPT earned per hour worked
    # 5/60 = 0.08333... hours per hour
    minutes_earned = hours_worked * 5
    return minutes_earned / 60.0


@router.post("/", response_model=schemas.Shift)
def create_shift(
    shift: schemas.ShiftCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    # Calculate duration
    duration = (shift.end_time - shift.start_time).total_seconds() / 3600.0
    if duration <= 0:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # Create Shift
    db_shift = models.Shift(**shift.model_dump(), user_id=current_user.id)

    # Auto-Accrue UPT logic
    # Find category named "Unpaid Time" or "UPT"
    upt_category = (
        db.query(models.PTOCategory)
        .filter(
            models.PTOCategory.user_id == current_user.id,
            func.lower(models.PTOCategory.name).in_(
                ["unpaid time", "upt", "unpaid time off"]
            ),
        )
        .first()
    )

    if upt_category:
        earned_upt = calculate_upt_accrual(duration)
        if earned_upt > 0:
            # Create Log
            new_log = models.PTOLog(
                category_id=upt_category.id,
                date=shift.start_time,  # Log date matches shift start
                amount=earned_upt,
                note=f"Auto-accrual from shift ({duration:.1f}h)",
            )
            db.add(new_log)
            db.flush()  # Get ID
            db_shift.upt_log_id = new_log.id

    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift


@router.post("/batch", response_model=List[schemas.Shift])
def create_batch_shifts(
    shifts: List[schemas.ShiftCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    created_shifts = []

    # Find UPT Category once
    upt_category = (
        db.query(models.PTOCategory)
        .filter(
            models.PTOCategory.user_id == current_user.id,
            func.lower(models.PTOCategory.name).in_(
                ["unpaid time", "upt", "unpaid time off"]
            ),
        )
        .first()
    )

    for shift_data in shifts:
        duration = (
            shift_data.end_time - shift_data.start_time
        ).total_seconds() / 3600.0
        if duration <= 0:
            continue  # Skip invalid intervals

        db_shift = models.Shift(**shift_data.model_dump(), user_id=current_user.id)

        if upt_category:
            earned_upt = calculate_upt_accrual(duration)
            if earned_upt > 0:
                new_log = models.PTOLog(
                    category_id=upt_category.id,
                    date=shift_data.start_time,
                    amount=earned_upt,
                    note=f"Auto-accrual from shift ({duration:.1f}h)",
                )
                db.add(new_log)
                db.flush()
                db_shift.upt_log_id = new_log.id

        db.add(db_shift)
        created_shifts.append(db_shift)

    db.commit()
    for s in created_shifts:
        db.refresh(s)

    return created_shifts


@router.get("/", response_model=List[schemas.Shift])
def read_shifts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    shifts = (
        db.query(models.Shift)
        .filter(models.Shift.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return shifts


@router.delete("/{shift_id}")
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    shift = (
        db.query(models.Shift)
        .filter(models.Shift.id == shift_id, models.Shift.user_id == current_user.id)
        .first()
    )
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # Delete linked UPT log if exists
    if shift.upt_log_id:
        log = (
            db.query(models.PTOLog).filter(models.PTOLog.id == shift.upt_log_id).first()
        )
        if log:
            db.delete(log)

    db.delete(shift)
    db.commit()
    return {"message": "Shift deleted"}
