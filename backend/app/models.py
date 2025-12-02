from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class AccrualFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    ANNUALLY = "annually"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pto_categories = relationship("PTOCategory", back_populates="user")

class PTOCategory(Base):
    __tablename__ = "pto_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String) # e.g. "Vacation", "Sick"
    accrual_rate = Column(Float) # Hours earned per period
    accrual_frequency = Column(Enum(AccrualFrequency))
    max_balance = Column(Float, nullable=True) # Cap
    start_date = Column(DateTime) # When accrual starts
    starting_balance = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="pto_categories")
    logs = relationship("PTOLog", back_populates="category")

class PTOLog(Base):
    __tablename__ = "pto_logs"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("pto_categories.id"))
    date = Column(DateTime)
    amount = Column(Float) # Negative for used, Positive for adjustment
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("PTOCategory", back_populates="logs")
