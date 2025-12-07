"""
Integration tests for admin endpoints.
Tests user management, system settings, metrics, and audit logs.
"""

import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import AuditLog, SystemSettings, User, UserRole


@pytest.mark.integration
class TestAdminUserList:
    """Tests for listing all users endpoint."""

    def test_list_all_users_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        test_user: User,
        admin_user: User,
        db: Session,
    ) -> None:
        """Test admin can list all users."""
        response = client.get("/api/admin/users", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least test_user and admin_user

        # Verify user data structure
        user_emails = [u["email"] for u in data]
        assert test_user.email in user_emails
        assert admin_user.email in user_emails

        # Verify no sensitive data is exposed
        for user in data:
            assert "hashed_password" not in user
            assert "email" in user
            assert "role" in user
            assert "id" in user

    def test_list_all_users_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test that non-admin users cannot list all users."""
        response = client.get("/api/admin/users", headers=auth_headers)

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()

    def test_list_all_users_unauthorized(self, client: TestClient) -> None:
        """Test that unauthenticated requests are rejected."""
        response = client.get("/api/admin/users")

        assert response.status_code == 401


@pytest.mark.integration
class TestAdminUserRoleUpdate:
    """Tests for updating user roles endpoint."""

    def test_grant_admin_role_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        test_user: User,
        db: Session,
    ) -> None:
        """Test admin can grant admin role to user."""
        role_update = {"role": "admin"}

        response = client.put(
            f"/api/admin/users/{test_user.id}/role",
            json=role_update,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        assert data["id"] == test_user.id

        # Verify audit log was created
        audit_log = db.query(AuditLog).filter(AuditLog.action == "grant_admin").first()
        assert audit_log is not None
        assert audit_log.target_user_id == test_user.id
        details = json.loads(audit_log.details)
        assert details["old_role"] == "employee"
        assert details["new_role"] == "admin"

    def test_revoke_admin_role_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        test_user: User,
        admin_user: User,
        db: Session,
    ) -> None:
        """Test admin can revoke admin role from user."""
        # First grant admin role
        test_user.role = UserRole.ADMIN
        db.commit()

        role_update = {"role": "employee"}

        response = client.put(
            f"/api/admin/users/{test_user.id}/role",
            json=role_update,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "employee"

        # Verify audit log was created
        audit_log = db.query(AuditLog).filter(AuditLog.action == "revoke_admin").first()
        assert audit_log is not None
        assert audit_log.target_user_id == test_user.id

    def test_prevent_self_demotion(
        self, client: TestClient, admin_headers: dict[str, str], admin_user: User
    ) -> None:
        """Test that admin cannot remove their own admin privileges."""
        role_update = {"role": "employee"}

        response = client.put(
            f"/api/admin/users/{admin_user.id}/role",
            json=role_update,
            headers=admin_headers,
        )

        assert response.status_code == 400
        assert (
            "cannot remove your own admin privileges"
            in response.json()["detail"].lower()
        )

    def test_update_role_user_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test updating role for non-existent user."""
        role_update = {"role": "admin"}

        response = client.put(
            "/api/admin/users/99999/role",
            json=role_update,
            headers=admin_headers,
        )

        assert response.status_code == 404
        assert "user not found" in response.json()["detail"].lower()

    def test_update_role_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str], test_user: User
    ) -> None:
        """Test that non-admin users cannot update roles."""
        role_update = {"role": "admin"}

        response = client.put(
            f"/api/admin/users/{test_user.id}/role",
            json=role_update,
            headers=auth_headers,
        )

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()


@pytest.mark.integration
class TestAdminUserCreation:
    """Tests for creating users by admin endpoint."""

    def test_create_user_success(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test admin can create a new user."""
        user_data = {
            "email": "newadminuser@example.com",
            "password": "securePassword123!",
            "full_name": "New User",
            "role": "employee",
        }

        response = client.post(
            "/api/admin/users",
            json=user_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert data["role"] == "employee"
        assert "hashed_password" not in data

        # Verify audit log was created
        audit_log = db.query(AuditLog).filter(AuditLog.action == "create_user").first()
        assert audit_log is not None
        details = json.loads(audit_log.details)
        assert details["email"] == user_data["email"]
        assert details["role"] == "employee"

    def test_create_admin_user_success(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test admin can create a new admin user."""
        user_data = {
            "email": "newadmin@example.com",
            "password": "securePassword123!",
            "full_name": "New Admin",
            "role": "admin",
        }

        response = client.post(
            "/api/admin/users",
            json=user_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["role"] == "admin"

    def test_create_user_duplicate_email(
        self, client: TestClient, admin_headers: dict[str, str], test_user: User
    ) -> None:
        """Test that creating user with duplicate email fails."""
        user_data = {
            "email": test_user.email,
            "password": "securePassword123!",
            "role": "employee",
        }

        response = client.post(
            "/api/admin/users",
            json=user_data,
            headers=admin_headers,
        )

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_create_user_invalid_email(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test that creating user with invalid email fails."""
        user_data = {
            "email": "not-an-email",
            "password": "securePassword123!",
            "role": "employee",
        }

        response = client.post(
            "/api/admin/users",
            json=user_data,
            headers=admin_headers,
        )

        assert response.status_code == 422  # Validation error

    def test_create_user_weak_password(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test that creating user with weak password fails."""
        user_data = {
            "email": "test@example.com",
            "password": "123",  # Too short
            "role": "employee",
        }

        response = client.post(
            "/api/admin/users",
            json=user_data,
            headers=admin_headers,
        )

        assert response.status_code == 422  # Validation error

    def test_create_user_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test that non-admin users cannot create users."""
        user_data = {
            "email": "test@example.com",
            "password": "securePassword123!",
            "role": "employee",
        }

        response = client.post(
            "/api/admin/users",
            json=user_data,
            headers=auth_headers,
        )

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()


@pytest.mark.integration
class TestAdminUserDeletion:
    """Tests for deleting users endpoint."""

    def test_delete_user_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        test_user: User,
        db: Session,
    ) -> None:
        """Test admin can delete a user."""
        user_id = test_user.id
        user_email = test_user.email

        response = client.delete(
            f"/api/admin/users/{user_id}",
            headers=admin_headers,
        )

        assert response.status_code == 204

        # Verify user was deleted
        deleted_user = db.query(User).filter(User.id == user_id).first()
        assert deleted_user is None

        # Verify audit log was created
        audit_log = db.query(AuditLog).filter(AuditLog.action == "delete_user").first()
        assert audit_log is not None
        assert audit_log.target_user_id == user_id
        details = json.loads(audit_log.details)
        assert details["email"] == user_email

    def test_prevent_self_deletion(
        self, client: TestClient, admin_headers: dict[str, str], admin_user: User
    ) -> None:
        """Test that admin cannot delete their own account."""
        response = client.delete(
            f"/api/admin/users/{admin_user.id}",
            headers=admin_headers,
        )

        assert response.status_code == 400
        assert "cannot delete your own account" in response.json()["detail"].lower()

    def test_delete_user_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test deleting non-existent user."""
        response = client.delete(
            "/api/admin/users/99999",
            headers=admin_headers,
        )

        assert response.status_code == 404
        assert "user not found" in response.json()["detail"].lower()

    def test_delete_user_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str], test_user: User
    ) -> None:
        """Test that non-admin users cannot delete users."""
        response = client.delete(
            f"/api/admin/users/{test_user.id}",
            headers=auth_headers,
        )

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()


@pytest.mark.integration
class TestAdminSystemSettings:
    """Tests for system settings endpoints."""

    def test_get_system_settings_success(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test admin can get system settings."""
        # Create a test setting
        setting = SystemSettings(key="test_setting", value="test_value")
        db.add(setting)
        db.commit()

        response = client.get("/api/admin/settings", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Find our test setting
        test_setting = next((s for s in data if s["key"] == "test_setting"), None)
        assert test_setting is not None
        assert test_setting["value"] == "test_value"

    def test_update_system_setting_existing(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test admin can update existing system setting."""
        # Create a test setting
        setting = SystemSettings(key="registration_enabled", value="true")
        db.add(setting)
        db.commit()

        update_data = {"value": "false"}

        response = client.put(
            "/api/admin/settings/registration_enabled",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["key"] == "registration_enabled"
        assert data["value"] == "false"

        # Verify audit log was created
        audit_log = (
            db.query(AuditLog).filter(AuditLog.action == "update_setting").first()
        )
        assert audit_log is not None
        details = json.loads(audit_log.details)
        assert details["key"] == "registration_enabled"
        assert details["old_value"] == "true"
        assert details["new_value"] == "false"

    def test_update_system_setting_new(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test admin can create new system setting."""
        update_data = {"value": "new_value"}

        response = client.put(
            "/api/admin/settings/new_setting",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["key"] == "new_setting"
        assert data["value"] == "new_value"

        # Verify audit log was created
        audit_log = (
            db.query(AuditLog).filter(AuditLog.action == "update_setting").first()
        )
        assert audit_log is not None
        details = json.loads(audit_log.details)
        assert details["key"] == "new_setting"
        assert details["old_value"] is None
        assert details["new_value"] == "new_value"

    def test_get_settings_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test that non-admin users cannot get system settings."""
        response = client.get("/api/admin/settings", headers=auth_headers)

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()

    def test_update_settings_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test that non-admin users cannot update system settings."""
        update_data = {"value": "false"}

        response = client.put(
            "/api/admin/settings/test_key",
            json=update_data,
            headers=auth_headers,
        )

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()


@pytest.mark.integration
class TestAdminDatabaseMetrics:
    """Tests for database metrics endpoint."""

    def test_get_database_metrics_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        test_user: User,
        admin_user: User,
    ) -> None:
        """Test admin can get database metrics."""
        response = client.get("/api/admin/metrics", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify all required fields are present
        assert "total_users" in data
        assert "total_pto_categories" in data
        assert "total_shifts" in data
        assert "total_pto_logs" in data

        # Verify counts are non-negative
        assert data["total_users"] >= 2  # At least test_user and admin_user
        assert data["total_pto_categories"] >= 0
        assert data["total_shifts"] >= 0
        assert data["total_pto_logs"] >= 0

    def test_get_metrics_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test that non-admin users cannot get database metrics."""
        response = client.get("/api/admin/metrics", headers=auth_headers)

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()

    def test_get_metrics_unauthorized(self, client: TestClient) -> None:
        """Test that unauthenticated requests are rejected."""
        response = client.get("/api/admin/metrics")

        assert response.status_code == 401


@pytest.mark.integration
class TestAdminAuditLogs:
    """Tests for audit logs endpoint."""

    def test_get_audit_logs_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        admin_user: User,
        db: Session,
    ) -> None:
        """Test admin can get audit logs."""
        # Create some test audit logs
        log1 = AuditLog(
            admin_user_id=admin_user.id,
            action="grant_admin",
            target_user_id=1,
            details='{"test": "data"}',
        )
        log2 = AuditLog(
            admin_user_id=admin_user.id,
            action="create_user",
            target_user_id=2,
            details='{"email": "test@example.com"}',
        )
        db.add_all([log1, log2])
        db.commit()

        response = client.get("/api/admin/audit-logs", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

        # Verify log structure
        for log in data:
            assert "id" in log
            assert "admin_user_id" in log
            assert "action" in log
            assert "created_at" in log

    def test_get_audit_logs_pagination(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        admin_user: User,
        db: Session,
    ) -> None:
        """Test audit logs pagination."""
        # Create multiple audit logs
        for i in range(5):
            log = AuditLog(
                admin_user_id=admin_user.id,
                action=f"test_action_{i}",
                target_user_id=i,
            )
            db.add(log)
        db.commit()

        # Test skip and limit
        response = client.get(
            "/api/admin/audit-logs?skip=2&limit=2",
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 2

    def test_get_audit_logs_ordered_by_date(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        admin_user: User,
        db: Session,
    ) -> None:
        """Test that audit logs are ordered by created_at descending."""
        # Create audit logs
        for i in range(3):
            log = AuditLog(
                admin_user_id=admin_user.id,
                action=f"action_{i}",
            )
            db.add(log)
        db.commit()

        response = client.get("/api/admin/audit-logs", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify logs are in descending order by created_at
        if len(data) >= 2:
            for i in range(len(data) - 1):
                assert data[i]["created_at"] >= data[i + 1]["created_at"]

    def test_get_audit_logs_forbidden_for_employee(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        """Test that non-admin users cannot get audit logs."""
        response = client.get("/api/admin/audit-logs", headers=auth_headers)

        assert response.status_code == 403
        assert "admin privileges required" in response.json()["detail"].lower()

    def test_get_audit_logs_unauthorized(self, client: TestClient) -> None:
        """Test that unauthenticated requests are rejected."""
        response = client.get("/api/admin/audit-logs")

        assert response.status_code == 401
