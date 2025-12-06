import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"


class AccrualFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    ANNUALLY = "annually"


class User(Base):  # type: ignore
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)  # type: ignore
    created_at = Column(DateTime, default=datetime.utcnow)
    full_name = Column(String, nullable=True)
    employer = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Shift Preferences
    shift_length = Column(Float, default=10.0)
    shifts_per_week = Column(Integer, default=4)

    pto_categories = relationship(
        "PTOCategory", back_populates="user", cascade="all, delete-orphan"
    )
    shifts = relationship("Shift", back_populates="user", cascade="all, delete-orphan")


class PTOCategory(Base):  # type: ignore
    __tablename__ = "pto_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)  # e.g. "Vacation", "Sick"
    accrual_rate = Column(Float)  # Hours per period
    accrual_frequency = Column(Enum(AccrualFrequency), default=AccrualFrequency.WEEKLY)  # type: ignore
    max_balance = Column(Float, nullable=True)  # Cap
    yearly_accrual_cap = Column(Float, nullable=True)  # e.g. 38 hours/year
    accrued_ytd = Column(Float, default=0.0)  # Track accrual for current year at start
    annual_grant_amount = Column(
        Float, default=0.0
    )  # e.g. 10 hours on Jan 1sted annually (e.g. on Jan 1st)
    start_date = Column(DateTime)  # When accrual starts
    starting_balance = Column(Float, default=0.0)

    user = relationship("User", back_populates="pto_categories")
    logs = relationship("PTOLog", back_populates="category")


class PTOLog(Base):  # type: ignore
    __tablename__ = "pto_logs"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("pto_categories.id"))
    date = Column(DateTime)
    amount = Column(Float)  # Negative for used, Positive for adjustment
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("PTOCategory", back_populates="logs")


class Shift(Base):  # type: ignore
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    upt_log_id = Column(
        Integer, ForeignKey("pto_logs.id"), nullable=True
    )  # Linked accrual log

    user = relationship("User", back_populates="shifts")
    upt_log = relationship("PTOLog")


class AuditLog(Base):  # type: ignore
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String)  # e.g., "grant_admin", "revoke_admin", "create_user", "delete_user"
    target_user_id = Column(Integer, nullable=True)  # User affected by the action
    details = Column(Text, nullable=True)  # Additional context as JSON or text
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin_user = relationship("User", foreign_keys=[admin_user_id])


class SystemSettings(Base):  # type: ignore
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
