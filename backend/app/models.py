from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base
from datetime import datetime

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class AccrualFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    ANNUALLY = "annually"

class User(Base): # type: ignore
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE) # type: ignore
    created_at = Column(DateTime, default=datetime.utcnow)
    full_name = Column(String, nullable=True)
    employer = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    pto_categories = relationship("PTOCategory", back_populates="user", cascade="all, delete-orphan")

class PTOCategory(Base): # type: ignore
    __tablename__ = "pto_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True) # e.g. "Vacation", "Sick"
    accrual_rate = Column(Float) # Hours per period
    accrual_frequency = Column(Enum(AccrualFrequency), default=AccrualFrequency.WEEKLY) # type: ignore
    max_balance = Column(Float, nullable=True) # Cap
    yearly_accrual_cap = Column(Float, nullable=True) # e.g. 38 hours/year
    accrued_ytd = Column(Float, default=0.0) # Track accrual for current year at start
    annual_grant_amount = Column(Float, default=0.0) # e.g. 10 hours on Jan 1sted annually (e.g. on Jan 1st)
    start_date = Column(DateTime) # When accrual starts
    starting_balance = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="pto_categories")
    logs = relationship("PTOLog", back_populates="category")

class PTOLog(Base): # type: ignore
    __tablename__ = "pto_logs"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("pto_categories.id"))
    date = Column(DateTime)
    amount = Column(Float) # Negative for used, Positive for adjustment
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("PTOCategory", back_populates="logs")
