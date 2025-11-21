"""Comprehensive tests for User model."""
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import date

from apps.authentication.models import User, Profile
from axis_backend.enums import UserStatus, Language, Gender


class UserManagerTestCase(TestCase):
    """Test UserManager custom methods."""

    def test_create_user_success(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.status, UserStatus.PENDING_VERIFICATION)

    def test_create_user_with_extra_fields(self):
        """Test creating user with additional fields."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser',
            preferred_language=Language.ENGLISH
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.preferred_language, Language.ENGLISH)

    def test_create_user_without_email_raises_error(self):
        """Test that creating user without email raises ValueError."""
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(email='', password='testpass123')
        self.assertIn('Email address is required', str(context.exception))

    def test_create_user_normalizes_email(self):
        """Test that email is normalized (lowercase domain)."""
        user = User.objects.create_user(
            email='Test@EXAMPLE.COM',
            password='testpass123'
        )
        self.assertEqual(user.email, 'Test@example.com')

    def test_create_superuser_success(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertEqual(user.email, 'admin@example.com')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.status, UserStatus.ACTIVE)

    def test_create_superuser_with_is_staff_false_raises_error(self):
        """Test that superuser must have is_staff=True."""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                is_staff=False
            )
        self.assertIn('Superuser must have is_staff=True', str(context.exception))

    def test_create_superuser_with_is_superuser_false_raises_error(self):
        """Test that superuser must have is_superuser=True."""
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                is_superuser=False
            )
        self.assertIn('Superuser must have is_superuser=True', str(context.exception))


class UserModelTestCase(TestCase):
    """Test User model fields, properties, and methods."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            username='testuser'
        )

    def test_user_creation_generates_cuid(self):
        """Test that user ID is auto-generated as CUID."""
        self.assertIsNotNone(self.user.id)
        self.assertTrue(len(self.user.id) > 0)
        self.assertTrue(isinstance(self.user.id, str))

    def test_user_string_representation(self):
        """Test User __str__ method returns email."""
        self.assertEqual(str(self.user), 'test@example.com')

    def test_user_repr(self):
        """Test User __repr__ includes email and status."""
        repr_str = repr(self.user)
        self.assertIn('test@example.com', repr_str)
        self.assertIn(UserStatus.PENDING_VERIFICATION, repr_str)

    def test_email_is_unique(self):
        """Test that duplicate emails are not allowed."""
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='test@example.com',
                password='anotherpass'
            )

    def test_username_is_optional(self):
        """Test that username can be null."""
        user = User.objects.create_user(
            email='nouser@example.com',
            password='testpass123'
        )
        self.assertIsNone(user.username)

    def test_password_can_be_null_for_oauth(self):
        """Test that password can be null for OAuth-only accounts."""
        user = User.objects.create(
            email='oauth@example.com',
            password=None
        )
        self.assertIsNone(user.password)

    def test_metadata_defaults_to_dict(self):
        """Test that metadata field defaults to empty dict."""
        self.assertEqual(self.user.metadata, {})

    def test_default_status_is_pending_verification(self):
        """Test that new users have PENDING_VERIFICATION status."""
        self.assertEqual(self.user.status, UserStatus.PENDING_VERIFICATION)

    def test_timestamps_are_auto_generated(self):
        """Test that created_at and updated_at are auto-set."""
        self.assertIsNotNone(self.user.created_at)
        self.assertIsNotNone(self.user.updated_at)

    def test_two_factor_defaults_to_false(self):
        """Test that 2FA is disabled by default."""
        self.assertFalse(self.user.is_two_factor_enabled)


class UserPropertiesTestCase(TestCase):
    """Test User model properties."""

    def setUp(self):
        """Set up test users."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_is_email_verified_false_by_default(self):
        """Test that email is not verified by default."""
        self.assertFalse(self.user.is_email_verified)

    def test_is_email_verified_true_after_verification(self):
        """Test that is_email_verified returns True after verification."""
        self.user.email_verified = timezone.now()
        self.user.save()
        self.assertTrue(self.user.is_email_verified)

    def test_is_account_active_false_for_pending_user(self):
        """Test that pending users are not considered active."""
        self.assertFalse(self.user.is_account_active)

    def test_is_account_active_true_for_active_user(self):
        """Test that ACTIVE users are considered active."""
        self.user.status = UserStatus.ACTIVE
        self.user.save()
        self.assertTrue(self.user.is_account_active)

    def test_is_account_active_false_for_deleted_user(self):
        """Test that soft-deleted users are not active."""
        self.user.status = UserStatus.ACTIVE
        self.user.deleted_at = timezone.now()
        self.user.save()
        self.assertFalse(self.user.is_account_active)

    def test_requires_verification_true_for_pending(self):
        """Test requires_verification for pending users."""
        self.assertTrue(self.user.requires_verification)

    def test_requires_verification_false_for_active(self):
        """Test requires_verification for active users."""
        self.user.status = UserStatus.ACTIVE
        self.user.save()
        self.assertFalse(self.user.requires_verification)


class UserStatusMethodsTestCase(TestCase):
    """Test User status change methods."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_verify_email_sets_timestamp(self):
        """Test that verify_email sets email_verified timestamp."""
        self.user.verify_email()
        self.assertIsNotNone(self.user.email_verified)

    def test_verify_email_activates_pending_user(self):
        """Test that verify_email activates pending users."""
        self.assertEqual(self.user.status, UserStatus.PENDING_VERIFICATION)
        self.user.verify_email()
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.ACTIVE)

    def test_verify_email_doesnt_change_active_status(self):
        """Test that verify_email doesn't affect already active users."""
        self.user.status = UserStatus.ACTIVE
        self.user.save()
        self.user.verify_email()
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.ACTIVE)

    def test_activate_changes_status_to_active(self):
        """Test activate method changes status to ACTIVE."""
        self.user.activate()
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.ACTIVE)
        self.assertIsNotNone(self.user.status_changed_at)

    def test_activate_clears_inactive_reason(self):
        """Test activate clears inactive_reason."""
        self.user.inactive_reason = 'Test reason'
        self.user.save()
        self.user.activate()
        self.user.refresh_from_db()
        self.assertIsNone(self.user.inactive_reason)

    def test_activate_tracks_status_change_in_metadata(self):
        """Test that activate records status change in metadata."""
        self.user.activate()
        self.user.refresh_from_db()
        self.assertIn('status_history', self.user.metadata)
        self.assertEqual(len(self.user.metadata['status_history']), 1)
        history = self.user.metadata['status_history'][0]
        self.assertEqual(history['from'], UserStatus.PENDING_VERIFICATION)
        self.assertEqual(history['to'], UserStatus.ACTIVE)

    def test_suspend_changes_status(self):
        """Test suspend method changes status to SUSPENDED."""
        self.user.suspend('Violation of terms')
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.SUSPENDED)
        self.assertEqual(self.user.suspension_reason, 'Violation of terms')
        self.assertIsNotNone(self.user.status_changed_at)

    def test_suspend_tracks_status_change_with_reason(self):
        """Test that suspend records reason in status history."""
        self.user.suspend('Policy violation')
        self.user.refresh_from_db()
        history = self.user.metadata['status_history'][-1]
        self.assertEqual(history['to'], UserStatus.SUSPENDED)
        self.assertEqual(history['reason'], 'Policy violation')

    def test_ban_changes_status(self):
        """Test ban method changes status to BANNED."""
        self.user.ban('Fraudulent activity')
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.BANNED)
        self.assertEqual(self.user.ban_reason, 'Fraudulent activity')
        self.assertIsNotNone(self.user.status_changed_at)

    def test_deactivate_changes_status(self):
        """Test deactivate method changes status to INACTIVE."""
        self.user.deactivate('User request')
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.INACTIVE)
        self.assertEqual(self.user.inactive_reason, 'User request')

    def test_deactivate_without_reason(self):
        """Test deactivate works without providing reason."""
        self.user.deactivate()
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.INACTIVE)
        self.assertIsNone(self.user.inactive_reason)


class UserSecurityMethodsTestCase(TestCase):
    """Test User security-related methods."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_enable_two_factor(self):
        """Test enable_two_factor sets flag to True."""
        self.assertFalse(self.user.is_two_factor_enabled)
        self.user.enable_two_factor()
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_two_factor_enabled)

    def test_disable_two_factor(self):
        """Test disable_two_factor sets flag to False."""
        self.user.is_two_factor_enabled = True
        self.user.save()
        self.user.disable_two_factor()
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_two_factor_enabled)

    def test_record_login_updates_timestamp(self):
        """Test record_login updates last_login_at."""
        self.assertIsNone(self.user.last_login_at)
        self.user.record_login()
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_login_at)

    def test_record_login_updates_to_current_time(self):
        """Test that record_login sets timestamp to current time."""
        before = timezone.now()
        self.user.record_login()
        after = timezone.now()
        self.user.refresh_from_db()
        self.assertGreaterEqual(self.user.last_login_at, before)
        self.assertLessEqual(self.user.last_login_at, after)


class UserSoftDeleteTestCase(TestCase):
    """Test User soft delete functionality."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_soft_delete_sets_deleted_at(self):
        """Test soft_delete sets deleted_at timestamp."""
        self.assertIsNone(self.user.deleted_at)
        self.user.soft_delete()
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.deleted_at)

    def test_soft_delete_sets_is_active_false(self):
        """Test soft_delete sets is_active to False."""
        self.user.is_active = True
        self.user.save()
        self.user.soft_delete()
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_restore_clears_deleted_at(self):
        """Test restore clears deleted_at timestamp."""
        self.user.soft_delete()
        self.user.restore()
        self.user.refresh_from_db()
        self.assertIsNone(self.user.deleted_at)

    def test_soft_deleted_user_not_account_active(self):
        """Test that soft-deleted users are not considered active."""
        self.user.status = UserStatus.ACTIVE
        self.user.save()
        self.user.soft_delete()
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_account_active)


class UserPreferencesTestCase(TestCase):
    """Test User preferences fields."""

    def test_user_with_language_preference(self):
        """Test setting preferred_language."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            preferred_language=Language.SPANISH
        )
        self.assertEqual(user.preferred_language, Language.SPANISH)

    def test_user_with_timezone(self):
        """Test setting timezone preference."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            timezone='America/New_York'
        )
        self.assertEqual(user.timezone, 'America/New_York')
