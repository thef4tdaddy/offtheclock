from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import database, dependencies, models, schemas, security

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)


@router.post("/register", response_model=schemas.User)
def register_user(
    user: schemas.UserCreate, db: Session = Depends(database.get_db)
) -> models.User:
    # Check if registration is enabled
    registration_setting = (
        db.query(models.SystemSettings)
        .filter(models.SystemSettings.key == "registration_enabled")
        .first()
    )
    
    if registration_setting and registration_setting.value == "false":
        raise HTTPException(
            status_code=403,
            detail="Registration is currently disabled"
        )
    
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        shift_length=user.shift_length,
        shifts_per_week=user.shifts_per_week,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/token")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
) -> dict[str, str]:
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=schemas.User)
def read_users_me(
    current_user: models.User = Depends(dependencies.get_current_user),
) -> models.User:
    return current_user


@router.put("/users/me", response_model=schemas.User)
def update_user_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
) -> models.User:
    db_user = current_user

    # Update fields
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name  # type: ignore
    if user_update.employer is not None:
        db_user.employer = user_update.employer  # type: ignore
    if user_update.avatar_url is not None:
        db_user.avatar_url = user_update.avatar_url  # type: ignore
    if user_update.shift_length is not None:
        db_user.shift_length = user_update.shift_length  # type: ignore
    if user_update.shifts_per_week is not None:
        db_user.shifts_per_week = user_update.shifts_per_week  # type: ignore

    db.commit()
    db.refresh(db_user)
    return db_user
