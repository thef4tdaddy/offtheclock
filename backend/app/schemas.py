from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import UserRole, AccrualFrequency

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    employer: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    employer: Optional[str] = None
    avatar_url: Optional[str] = None

class User(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class PTOLogBase(BaseModel):
    date: datetime
    amount: float
    note: Optional[str] = None

class PTOLogCreate(PTOLogBase):
    category_id: int

class PTOLog(PTOLogBase):
    id: int
    category_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PTOCategoryBase(BaseModel):
    name: str
    accrual_rate: float
    accrual_frequency: AccrualFrequency
    max_balance: Optional[float] = None
    start_date: datetime
    starting_balance: float = 0.0

class PTOCategoryCreate(PTOCategoryBase):
    pass

class PTOCategory(PTOCategoryBase):
    id: int
    user_id: int
    # We will compute these fields dynamically in the response
    current_balance: float 
    projected_balance: Optional[float] = None

    class Config:
        from_attributes = True

class BalanceProjection(BaseModel):
    date: datetime
    projected_balance: float

class AmazonPresetRequest(BaseModel):
    tenure_years: int = 0
    shift_length: float = 10.0
    shifts_per_week: int = 4
    current_upt: Optional[float] = None
    current_flex: Optional[float] = None
    current_std: Optional[float] = None
