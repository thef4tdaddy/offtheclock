"""
Integration tests for authentication endpoints.
Tests user registration, login, and profile management.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User


@pytest.mark.integration
class TestAuthRegistration:
    """Tests for user registration endpoint."""
    
    def test_register_user_success(self, client: TestClient, db: Session) -> None:
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "securePassword123!",
            "shift_length": 10.0,
            "shifts_per_week": 4,
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert "id" in data
        assert "hashed_password" not in data
        assert data["role"] == "employee"
    
    def test_register_user_duplicate_email(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test that registering with duplicate email fails."""
        user_data = {
            "email": test_user.email,
            "password": "anotherPassword123!",
            "shift_length": 8.0,
            "shifts_per_week": 5,
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_user_invalid_email(self, client: TestClient) -> None:
        """Test that registering with invalid email fails."""
        user_data = {
            "email": "not-an-email",
            "password": "securePassword123!",
            "shift_length": 10.0,
            "shifts_per_week": 4,
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_register_user_with_optional_fields(
        self, client: TestClient, db: Session
    ) -> None:
        """Test user registration with optional fields."""
        user_data = {
            "email": "detailed@example.com",
            "password": "securePassword123!",
            "full_name": "John Doe",
            "employer": "Acme Corp",
            "shift_length": 12.0,
            "shifts_per_week": 3,
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]


@pytest.mark.integration
class TestAuthLogin:
    """Tests for login endpoint."""
    
    def test_login_success(self, client: TestClient, test_user: User) -> None:
        """Test successful login."""
        response = client.post(
            "/api/auth/token",
            data={"username": test_user.email, "password": "testpassword123"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
    
    def test_login_wrong_password(self, client: TestClient, test_user: User) -> None:
        """Test login with wrong password fails."""
        response = client.post(
            "/api/auth/token",
            data={"username": test_user.email, "password": "wrongpassword"},
        )
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client: TestClient) -> None:
        """Test login with nonexistent user fails."""
        response = client.post(
            "/api/auth/token",
            data={"username": "nobody@example.com", "password": "anypassword"},
        )
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_missing_fields(self, client: TestClient) -> None:
        """Test login with missing fields fails."""
        response = client.post("/api/auth/token", data={"username": "test@example.com"})
        
        assert response.status_code == 422  # Validation error


@pytest.mark.integration
class TestUserProfile:
    """Tests for user profile endpoints."""
    
    def test_get_current_user(
        self, client: TestClient, test_user: User, auth_headers: dict[str, str]
    ) -> None:
        """Test getting current user profile."""
        response = client.get("/api/auth/users/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id
        assert "hashed_password" not in data
    
    def test_get_current_user_unauthorized(self, client: TestClient) -> None:
        """Test getting current user without auth fails."""
        response = client.get("/api/auth/users/me")
        
        assert response.status_code == 401
    
    def test_get_current_user_invalid_token(self, client: TestClient) -> None:
        """Test getting current user with invalid token fails."""
        response = client.get(
            "/api/auth/users/me", headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
    
    def test_update_user_profile(
        self, client: TestClient, test_user: User, auth_headers: dict[str, str]
    ) -> None:
        """Test updating user profile."""
        update_data = {
            "full_name": "Updated Name",
            "employer": "New Company",
            "avatar_url": "https://example.com/avatar.jpg",
        }
        
        response = client.put(
            "/api/auth/users/me", json=update_data, headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == update_data["full_name"]
        assert data["employer"] == update_data["employer"]
        assert data["avatar_url"] == update_data["avatar_url"]
    
    def test_update_user_profile_partial(
        self, client: TestClient, test_user: User, auth_headers: dict[str, str]
    ) -> None:
        """Test partial update of user profile."""
        update_data = {"full_name": "Only Name Updated"}
        
        response = client.put(
            "/api/auth/users/me", json=update_data, headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == update_data["full_name"]
        assert data["email"] == test_user.email
    
    def test_update_user_profile_unauthorized(self, client: TestClient) -> None:
        """Test updating profile without auth fails."""
        update_data = {"full_name": "Should Fail"}
        
        response = client.put("/api/auth/users/me", json=update_data)
        
        assert response.status_code == 401
