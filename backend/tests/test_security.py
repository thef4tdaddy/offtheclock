"""
Unit tests for security utility functions.
Tests password hashing and JWT token operations.
"""
import pytest
from datetime import timedelta

from app.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)


@pytest.mark.unit
class TestPasswordHashing:
    """Tests for password hashing functions."""
    
    def test_get_password_hash_returns_string(self) -> None:
        """Test that password hashing returns a string."""
        password = "mySecurePassword123"
        hashed = get_password_hash(password)
        
        assert isinstance(hashed, str)
        assert len(hashed) > 0
        assert hashed != password
    
    def test_verify_password_correct(self) -> None:
        """Test that correct password verification succeeds."""
        password = "mySecurePassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self) -> None:
        """Test that incorrect password verification fails."""
        password = "mySecurePassword123"
        wrong_password = "wrongPassword456"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_different_passwords_produce_different_hashes(self) -> None:
        """Test that different passwords produce different hashes."""
        password1 = "password1"
        password2 = "password2"
        
        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)
        
        assert hash1 != hash2
    
    def test_same_password_produces_different_hashes(self) -> None:
        """Test that hashing the same password twice produces different hashes (salt)."""
        password = "mySecurePassword123"
        
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Different hashes due to random salt
        assert hash1 != hash2
        # But both verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


@pytest.mark.unit
class TestJWTTokens:
    """Tests for JWT token creation and decoding."""
    
    def test_create_access_token_returns_string(self) -> None:
        """Test that token creation returns a string."""
        data = {"sub": "user@example.com"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_access_token_valid(self) -> None:
        """Test that valid token can be decoded."""
        email = "user@example.com"
        data = {"sub": email}
        token = create_access_token(data)
        
        decoded = decode_access_token(token)
        
        assert decoded is not None
        assert decoded["sub"] == email
        assert "exp" in decoded
    
    def test_create_token_with_custom_expiration(self) -> None:
        """Test token creation with custom expiration time."""
        data = {"sub": "user@example.com"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta)
        
        decoded = decode_access_token(token)
        
        assert decoded is not None
        assert decoded["sub"] == "user@example.com"
    
    def test_decode_invalid_token_raises_error(self) -> None:
        """Test that decoding invalid token raises an error."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(Exception):
            decode_access_token(invalid_token)
    
    def test_token_contains_expiration(self) -> None:
        """Test that created token contains expiration claim."""
        data = {"sub": "user@example.com"}
        token = create_access_token(data)
        decoded = decode_access_token(token)
        
        assert "exp" in decoded
        assert isinstance(decoded["exp"], int)
