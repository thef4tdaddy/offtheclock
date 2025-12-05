from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import AccrualFrequency, UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    employer: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str
    shift_length: Optional[float] = 10.0
    shifts_per_week: Optional[int] = 4


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
    accrual_rate: Optional[float] = 0.0
    accrual_frequency: Optional[AccrualFrequency] = None
    max_balance: Optional[float] = None
    yearly_accrual_cap: Optional[float] = None
    accrued_ytd: Optional[float] = 0.0
    annual_grant_amount: Optional[float] = 0.0
    start_date: Optional[datetime] = None
    starting_balance: Optional[float] = 0.0


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


class ShiftBase(BaseModel):
    start_time: datetime
    end_time: datetime


class ShiftCreate(ShiftBase):
    pass


class Shift(ShiftBase):
    id: int
    user_id: int
    series_id: Optional[str] = None
    upt_log_id: Optional[int] = None

    class Config:
        from_attributes = True


class AmazonPresetRequest(BaseModel):
    tenure_years: int = 0
    shift_length: float = 10.0
    shifts_per_week: int = 4
    current_upt: Optional[float] = None
    current_flex: Optional[float] = None
    current_flex_ytd: Optional[float] = None
    current_std: Optional[float] = None
