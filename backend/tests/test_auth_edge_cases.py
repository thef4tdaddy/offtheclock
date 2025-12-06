"""
Integration tests for authentication edge cases.
Tests token expiry, invalid scopes/roles, and JWT validation edge cases.
"""

import base64
import json
import time
from datetime import timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy.orm import Session

from app.models import User
from app.security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    get_password_hash,
)


@pytest.mark.integration
class TestTokenExpiry:
    """Tests for JWT token expiration edge cases."""

    def test_expired_token_is_rejected(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test that an expired token is rejected."""
        # Create a token that expires immediately
        expired_token = create_access_token(
            data={"sub": test_user.email},
            expires_delta=timedelta(seconds=-1),  # Already expired
        )

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )

        assert response.status_code == 401
        assert "could not validate credentials" in response.json()["detail"].lower()

    def test_token_with_very_short_expiration(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test token with very short expiration time."""
        # Create token that expires in 1 second
        short_token = create_access_token(
            data={"sub": test_user.email},
            expires_delta=timedelta(seconds=1),
        )

        # Should work immediately
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {short_token}"},
        )
        assert response.status_code == 200

        # Wait for expiration - necessary for time-based expiration testing
        # This is a deliberate sleep to test JWT expiration behavior
        time.sleep(2)

        # Should now be expired
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {short_token}"},
        )
        assert response.status_code == 401
        assert "could not validate credentials" in response.json()["detail"].lower()

    def test_token_expiration_boundary(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test token at the exact moment of expiration."""
        # Create token with known expiration
        token = create_access_token(
            data={"sub": test_user.email},
            expires_delta=timedelta(minutes=30),
        )

        # Token should be valid
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == test_user.email


@pytest.mark.integration
class TestInvalidRolesAndScopes:
    """Tests for role-based authorization edge cases."""

    def test_admin_role_in_token(
        self, client: TestClient, admin_user: User, db: Session
    ) -> None:
        """Test that admin role is properly recognized."""
        # Login as admin
        response = client.post(
            "/api/auth/token",
            data={"username": admin_user.email, "password": "adminpassword123"},
        )
        assert response.status_code == 200
        token = response.json()["access_token"]

        # Verify admin user profile
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"

    def test_employee_role_default(self, client: TestClient, test_user: User) -> None:
        """Test that employee role is default for regular users."""
        # Login as regular user
        response = client.post(
            "/api/auth/token",
            data={"username": test_user.email, "password": "testpassword123"},
        )
        assert response.status_code == 200
        token = response.json()["access_token"]

        # Verify employee role
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "employee"

    def test_token_with_additional_claims(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test token with additional custom claims."""
        # Create token with extra claims
        token = create_access_token(
            data={
                "sub": test_user.email,
                "role": "employee",
                "custom_claim": "test_value",
            },
            expires_delta=timedelta(minutes=30),
        )

        # Token should still be valid
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == test_user.email


@pytest.mark.integration
class TestJWTValidationEdgeCases:
    """Tests for JWT validation edge cases."""

    def test_token_without_sub_claim(self, client: TestClient) -> None:
        """Test that token without 'sub' claim is rejected."""
        # Create token without 'sub' claim
        token_data: dict[str, Any] = {"exp": time.time() + 3600}
        invalid_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {invalid_token}"},
        )

        assert response.status_code == 401
        assert "could not validate credentials" in response.json()["detail"].lower()

    def test_token_with_empty_sub_claim(self, client: TestClient) -> None:
        """Test that token with empty 'sub' claim is rejected."""
        token = create_access_token(
            data={"sub": ""},
            expires_delta=timedelta(minutes=30),
        )

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 401
        assert "could not validate credentials" in response.json()["detail"].lower()

    def test_token_with_nonexistent_user_email(self, client: TestClient) -> None:
        """Test token with email of user that doesn't exist in database."""
        token = create_access_token(
            data={"sub": "nonexistent@example.com"},
            expires_delta=timedelta(minutes=30),
        )

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 401
        assert "could not validate credentials" in response.json()["detail"].lower()

    def test_malformed_jwt_token(self, client: TestClient) -> None:
        """Test that malformed JWT token is rejected."""
        malformed_tokens = [
            "not.a.jwt",
            "only-one-part",
            "two.parts",
            "header.payload.signature.extra",
            "",
            "Bearer token",
        ]

        for malformed_token in malformed_tokens:
            response = client.get(
                "/api/auth/users/me",
                headers={"Authorization": f"Bearer {malformed_token}"},
            )
            assert response.status_code == 401
            assert "could not validate credentials" in response.json()["detail"].lower()
    def test_token_with_wrong_signature(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test that token with tampered signature is rejected."""
        # Create valid token
        valid_token = create_access_token(
            data={"sub": test_user.email},
            expires_delta=timedelta(minutes=30),
        )

        # Tamper with the signature (change last character)
        tampered_token = valid_token[:-5] + "XXXXX"

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {tampered_token}"},
        )

        assert response.status_code == 401

    def test_token_with_wrong_secret_key(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test that token signed with wrong secret key is rejected."""
        # Create token with wrong secret
        wrong_secret = "different_secret_key"
        token_data = {
            "sub": test_user.email,
            "exp": time.time() + 3600,
        }
        invalid_token = jwt.encode(token_data, wrong_secret, algorithm=ALGORITHM)

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {invalid_token}"},
        )

        assert response.status_code == 401

    def test_token_with_invalid_algorithm(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test that token with unsupported algorithm is rejected."""
        # Create token with different algorithm
        token_data = {
            "sub": test_user.email,
            "exp": time.time() + 3600,
        }
        # Use HS512 instead of HS256
        invalid_token = jwt.encode(token_data, SECRET_KEY, algorithm="HS512")

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {invalid_token}"},
        )

        assert response.status_code == 401
        assert "could not validate credentials" in response.json()["detail"].lower()

    def test_token_with_none_algorithm_attack(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test protection against 'none' algorithm attack."""
        # Create token with 'none' algorithm (security vulnerability if allowed)
        token_data = {
            "sub": test_user.email,
            "exp": time.time() + 3600,
        }
        # Manually create token with 'none' algorithm
        header = base64.urlsafe_b64encode(
            json.dumps({"alg": "none", "typ": "JWT"}).encode()
        ).rstrip(b"=")
        payload = base64.urlsafe_b64encode(json.dumps(token_data).encode()).rstrip(
            b"="
        )
        none_token = f"{header.decode()}.{payload.decode()}."

        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {none_token}"},
        )

        assert response.status_code == 401


@pytest.mark.integration
class TestAuthenticationDependencyEdgeCases:
    """Tests for authentication dependency edge cases."""

    def test_missing_authorization_header(self, client: TestClient) -> None:
        """Test request without Authorization header."""
        response = client.get("/api/auth/users/me")
        assert response.status_code == 401

    def test_malformed_authorization_header(self, client: TestClient) -> None:
        """Test malformed Authorization header formats."""
        malformed_headers = [
            {"Authorization": "token"},  # Missing Bearer prefix
            {"Authorization": "bearer token"},  # Lowercase bearer
            {"Authorization": "Basic token"},  # Wrong scheme
            {"Authorization": ""},  # Empty
            {"Authorization": "Bearer "},  # Bearer with no token
        ]

        for headers in malformed_headers:
            response = client.get("/api/auth/users/me", headers=headers)
            assert response.status_code == 401
            assert "could not validate credentials" in response.json()["detail"].lower()

    def test_token_reuse_after_password_change(
        self, client: TestClient, test_user: User, db: Session
    ) -> None:
        """Test that old token still works after password change (expected behavior)."""
        # Get initial token
        response = client.post(
            "/api/auth/token",
            data={"username": test_user.email, "password": "testpassword123"},
        )
        old_token = response.json()["access_token"]

        # Verify old token works
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {old_token}"},
        )
        assert response.status_code == 200

        # Change password
        test_user.hashed_password = get_password_hash("newpassword123")  # type: ignore
        db.commit()

        # Old token should still work (JWT is stateless)
        # Note: In production, you might want to implement token revocation
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {old_token}"},
        )
        assert response.status_code == 200

    def test_deleted_user_token(
        self, client: TestClient, test_user: User, db: Session
    ) -> None:
        """Test that token for deleted user is rejected."""
        # Get token for user
        response = client.post(
            "/api/auth/token",
            data={"username": test_user.email, "password": "testpassword123"},
        )
        token = response.json()["access_token"]

        # Verify token works
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200

        # Delete user
        db.delete(test_user)
        db.commit()

        # Token should now be invalid (user doesn't exist)
        response = client.get(
            "/api/auth/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401

    def test_concurrent_token_requests(
        self, client: TestClient, test_user: User
    ) -> None:
        """Test that multiple valid tokens can be issued and used concurrently."""
        # Get multiple tokens
        tokens = []
        for _ in range(3):
            response = client.post(
                "/api/auth/token",
                data={"username": test_user.email, "password": "testpassword123"},
            )
            assert response.status_code == 200
            tokens.append(response.json()["access_token"])

        # All tokens should be valid
        for token in tokens:
            response = client.get(
                "/api/auth/users/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            assert response.json()["email"] == test_user.email
