from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import database, models, schemas, security

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")


@router.post("/register", response_model=schemas.User)
def register_user(
    user: schemas.UserCreate, db: Session = Depends(database.get_db)
) -> models.User:
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
    token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.decode_access_token(token)
        if payload is None:
            raise credentials_exception
        username: str = payload.get("sub")  # type: ignore
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == username).first()
    if user is None:
        raise credentials_exception
    return user


@router.put("/users/me", response_model=schemas.User)
def update_user_me(
    user_update: schemas.UserUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.User:
    # Get current user (logic duplicated for now, ideally refactor to dependency)
    try:
        payload = security.decode_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        username: str = payload.get("sub")  # type: ignore
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db_user = db.query(models.User).filter(models.User.email == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

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
