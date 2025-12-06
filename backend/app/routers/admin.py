from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, dependencies, models, schemas, security

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
)


def create_audit_log(
    db: Session,
    admin_user_id: int,
    action: str,
    target_user_id: int | None = None,
    details: str | None = None,
) -> None:
    """Helper function to create audit log entries"""
    audit_log = models.AuditLog(
        admin_user_id=admin_user_id,
        action=action,
        target_user_id=target_user_id,
        details=details,
    )
    db.add(audit_log)
    db.commit()


@router.get("/users", response_model=List[schemas.UserListItem])
def list_all_users(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> List[models.User]:
    """List all users in the system (admin only)"""
    users = db.query(models.User).all()
    return users


@router.put("/users/{user_id}/role", response_model=schemas.UserListItem)
def update_user_role(
    user_id: int,
    role_update: schemas.UpdateUserRole,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> models.User:
    """Grant or revoke admin privileges (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-demotion
    if user.id == current_admin.id and role_update.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove your own admin privileges"
        )
    
    old_role = user.role
    user.role = role_update.role  # type: ignore
    db.commit()
    db.refresh(user)
    
    # Create audit log
    action = "grant_admin" if role_update.role == models.UserRole.ADMIN else "revoke_admin"
    details = json.dumps({"old_role": old_role.value, "new_role": role_update.role.value})
    create_audit_log(db, current_admin.id, action, user.id, details)
    
    return user


@router.post("/users", response_model=schemas.UserListItem, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    user_data: schemas.AdminUserCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> models.User:
    """Create a new user account (admin only)"""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = security.get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create audit log
    details = json.dumps({"email": user_data.email, "role": user_data.role.value})
    create_audit_log(db, current_admin.id, "create_user", new_user.id, details)
    
    return new_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> None:
    """Delete a user account (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )
    
    # Store user details for audit log before deletion
    user_details = json.dumps({"email": user.email, "role": user.role.value})
    
    # Delete user (cascade will handle related records)
    db.delete(user)
    db.commit()
    
    # Create audit log
    create_audit_log(db, current_admin.id, "delete_user", user_id, user_details)


@router.get("/settings", response_model=List[schemas.SystemSettingsItem])
def get_system_settings(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> List[models.SystemSettings]:
    """Get system settings (admin only)"""
    settings = db.query(models.SystemSettings).all()
    return settings


@router.put("/settings/{key}", response_model=schemas.SystemSettingsItem)
def update_system_setting(
    key: str,
    update_data: schemas.UpdateSystemSetting,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> models.SystemSettings:
    """Update a system setting (admin only)"""
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
    
    if setting:
        old_value = setting.value
        setting.value = update_data.value  # type: ignore
    else:
        setting = models.SystemSettings(key=key, value=update_data.value)
        db.add(setting)
        old_value = None
    
    db.commit()
    db.refresh(setting)
    
    # Create audit log
    details = json.dumps({"key": key, "old_value": old_value, "new_value": update_data.value})
    create_audit_log(db, current_admin.id, "update_setting", None, details)
    
    return setting


@router.get("/metrics", response_model=schemas.DatabaseMetrics)
def get_database_metrics(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> schemas.DatabaseMetrics:
    """Get database usage metrics (admin only)"""
    total_users = db.query(models.User).count()
    total_pto_categories = db.query(models.PTOCategory).count()
    total_shifts = db.query(models.Shift).count()
    total_pto_logs = db.query(models.PTOLog).count()
    
    return schemas.DatabaseMetrics(
        total_users=total_users,
        total_pto_categories=total_pto_categories,
        total_shifts=total_shifts,
        total_pto_logs=total_pto_logs,
    )


@router.get("/audit-logs", response_model=List[schemas.AuditLogEntry])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_admin_user),
) -> List[models.AuditLog]:
    """Get audit logs (admin only)"""
    logs = (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs
