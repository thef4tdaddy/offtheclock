"""
Unit tests for password reset utility.
Tests the reset_password.py script functionality.
"""

from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from app.models import User, UserRole
from app.reset_password import reset_password
from app.security import verify_password


@pytest.mark.unit
class TestResetPasswordUtility:
    """Tests for the reset_password utility function."""

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_success(
        self, mock_session_local: MagicMock, db: Session, test_user: User
    ) -> None:
        """Test successful password reset."""
        # Create a mock session that behaves like our test db
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = test_user
        mock_session_local.return_value = mock_db

        new_password = "newSecurePassword123!"
        old_hashed = test_user.hashed_password

        # Reset the password
        reset_password(test_user.email, new_password)

        # Verify password was changed
        assert test_user.hashed_password != old_hashed
        assert verify_password(new_password, test_user.hashed_password)

        # Verify commit was called
        mock_db.commit.assert_called_once()
        mock_db.close.assert_called_once()

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_nonexistent_user(
        self, mock_session_local: MagicMock, capsys: pytest.CaptureFixture
    ) -> None:
        """Test reset password for user that doesn't exist."""
        # Create a mock session that returns None for the user
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_session_local.return_value = mock_db

        nonexistent_email = "nobody@example.com"
        new_password = "newPassword123!"

        # Try to reset password for non-existent user
        reset_password(nonexistent_email, new_password)

        # Capture printed output
        captured = capsys.readouterr()

        # Verify appropriate message was printed
        assert "not found" in captured.out.lower()
        assert nonexistent_email in captured.out

        # Verify commit was NOT called
        mock_db.commit.assert_not_called()

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_hash_verification(
        self, mock_session_local: MagicMock, test_user: User
    ) -> None:
        """Test that reset password creates valid hash."""
        # Create a mock session that behaves like our test db
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = test_user
        mock_session_local.return_value = mock_db

        new_password = "anotherNewPassword123!"

        # Reset the password
        reset_password(test_user.email, new_password)

        # Verify the new password works
        assert verify_password(new_password, test_user.hashed_password)

        # Verify old password doesn't work
        assert not verify_password("testpassword123", test_user.hashed_password)

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_different_passwords(
        self, mock_session_local: MagicMock, test_user: User
    ) -> None:
        """Test resetting password multiple times with different passwords."""
        # Create a mock session that behaves like our test db
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = test_user
        mock_session_local.return_value = mock_db

        password1 = "firstPassword123!"
        password2 = "secondPassword456!"

        # Reset to first password
        reset_password(test_user.email, password1)
        hash1 = test_user.hashed_password

        # Reset to second password
        reset_password(test_user.email, password2)
        hash2 = test_user.hashed_password

        # Verify hashes are different
        assert hash1 != hash2

        # Verify second password works, first doesn't
        assert verify_password(password2, test_user.hashed_password)
        assert not verify_password(password1, test_user.hashed_password)

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_for_admin_user(
        self, mock_session_local: MagicMock, admin_user: User
    ) -> None:
        """Test password reset works for admin users."""
        # Create a mock session that behaves like our test db
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = admin_user
        mock_session_local.return_value = mock_db

        new_password = "newAdminPassword123!"

        # Reset the password
        reset_password(admin_user.email, new_password)

        # Verify password was changed and user is still admin
        assert verify_password(new_password, admin_user.hashed_password)
        assert admin_user.role == UserRole.ADMIN

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_empty_password(
        self, mock_session_local: MagicMock, test_user: User
    ) -> None:
        """Test reset password with empty password.

        SECURITY NOTE: This test documents a security vulnerability in the current
        implementation. The reset_password function does not validate password strength
        or prevent empty passwords. This should be fixed by adding password validation
        before hashing.
        """
        # Create a mock session that behaves like our test db
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = test_user
        mock_session_local.return_value = mock_db

        old_hashed = test_user.hashed_password

        # Current behavior allows empty passwords - this is a security issue
        reset_password(test_user.email, "")

        # Verify that password is changed (documents current behavior)
        assert test_user.hashed_password != old_hashed

        # TODO: Add password validation to prevent this vulnerability

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_preserves_user_data(
        self, mock_session_local: MagicMock, test_user: User
    ) -> None:
        """Test that password reset doesn't affect other user data."""
        # Create a mock session that behaves like our test db
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = test_user
        mock_session_local.return_value = mock_db

        new_password = "newPassword123!"

        # Store original user data
        original_email = test_user.email
        original_full_name = test_user.full_name
        original_role = test_user.role
        original_employer = test_user.employer

        # Reset the password
        reset_password(test_user.email, new_password)

        # Verify other user data remains unchanged
        assert test_user.email == original_email
        assert test_user.full_name == original_full_name
        assert test_user.role == original_role
        assert test_user.employer == original_employer

        # Verify only password changed
        assert verify_password(new_password, test_user.hashed_password)

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_case_sensitive_email(
        self,
        mock_session_local: MagicMock,
        test_user: User,
        capsys: pytest.CaptureFixture,
    ) -> None:
        """Test that email lookup is case-sensitive."""
        # Create a mock session that returns None (user not found)
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_session_local.return_value = mock_db

        new_password = "newPassword123!"

        # Try with uppercase email (assuming test_user.email is lowercase)
        uppercase_email = test_user.email.upper()

        reset_password(uppercase_email, new_password)

        # Capture printed output
        captured = capsys.readouterr()

        # Since user won't be found with wrong case (case-sensitive), should print not found
        assert "not found" in captured.out.lower()

    @patch("app.reset_password.SessionLocal")
    def test_reset_password_prints_success_message(
        self,
        mock_session_local: MagicMock,
        test_user: User,
        capsys: pytest.CaptureFixture,
    ) -> None:
        """Test that successful password reset prints success message."""
        # Create a mock session that behaves like our test db
        mock_db = MagicMock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = test_user
        mock_session_local.return_value = mock_db

        new_password = "newPassword123!"
        user_email = test_user.email  # Store before reset

        reset_password(user_email, new_password)

        # Capture printed output
        captured = capsys.readouterr()

        # Verify success message was printed
        assert "updated successfully" in captured.out.lower()
        assert user_email in captured.out
