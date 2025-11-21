"""Comprehensive tests for Account model (OAuth provider accounts)."""
from django.test import TestCase
from django.db import IntegrityError
from django.utils import timezone

from apps.authentication.models import User, Account


class AccountModelTestCase(TestCase):
    """Test Account model fields and basic functionality."""

    def setUp(self):
        """Set up test user and account."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.account = Account.objects.create(
            user=self.user,
            type='oauth',
            provider='google',
            provider_account_id='google_user_123',
            access_token='access_token_value',
            refresh_token='refresh_token_value',
            expires_at=int(timezone.now().timestamp()) + 3600,
            token_type='Bearer'
        )

    def test_account_creation_generates_cuid(self):
        """Test that account ID is auto-generated as CUID."""
        self.assertIsNotNone(self.account.id)
        self.assertTrue(len(self.account.id) > 0)

    def test_account_string_representation(self):
        """Test Account __str__ includes provider and user email."""
        str_rep = str(self.account)
        self.assertIn('google', str_rep)
        self.assertIn('test@example.com', str_rep)

    def test_account_repr(self):
        """Test Account __repr__ includes provider and user."""
        repr_str = repr(self.account)
        self.assertIn('google', repr_str)
        self.assertIn('test@example.com', repr_str)

    def test_unique_provider_account_constraint(self):
        """Test that same provider account ID cannot be used twice."""
        with self.assertRaises(IntegrityError):
            Account.objects.create(
                user=self.user,
                type='oauth',
                provider='google',
                provider_account_id='google_user_123'
            )

    def test_user_can_have_multiple_provider_accounts(self):
        """Test that user can link multiple OAuth providers."""
        Account.objects.create(
            user=self.user,
            type='oauth',
            provider='microsoft',
            provider_account_id='microsoft_user_456'
        )

        self.assertEqual(self.user.accounts.count(), 2)

    def test_account_cascade_delete_with_user(self):
        """Test that account is deleted when user is deleted."""
        account_id = self.account.id
        self.user.delete()
        self.assertFalse(Account.objects.filter(id=account_id).exists())


class AccountTokenManagementTestCase(TestCase):
    """Test Account token management methods."""

    def setUp(self):
        """Set up test user and account."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.account = Account.objects.create(
            user=self.user,
            type='oauth',
            provider='google',
            provider_account_id='google_123'
        )

    def test_update_tokens_updates_access_token(self):
        """Test update_tokens method updates access token."""
        self.account.update_tokens(
            access_token='new_access_token',
            refresh_token='new_refresh_token',
            expires_at=int(timezone.now().timestamp()) + 7200
        )
        self.account.refresh_from_db()

        self.assertEqual(self.account.access_token, 'new_access_token')
        self.assertEqual(self.account.refresh_token, 'new_refresh_token')

    def test_update_tokens_with_partial_data(self):
        """Test update_tokens with only access token."""
        self.account.refresh_token = 'old_refresh'
        self.account.save()

        self.account.update_tokens(access_token='new_access_token')
        self.account.refresh_from_db()

        self.assertEqual(self.account.access_token, 'new_access_token')
        self.assertEqual(self.account.refresh_token, 'old_refresh')

    def test_record_login_updates_timestamp(self):
        """Test record_login updates last_login_at."""
        self.assertIsNone(self.account.last_login_at)
        self.account.record_login()
        self.account.refresh_from_db()
        self.assertIsNotNone(self.account.last_login_at)

    def test_revoke_tokens_clears_all_tokens(self):
        """Test revoke_tokens clears all token fields."""
        self.account.access_token = 'access'
        self.account.refresh_token = 'refresh'
        self.account.expires_at = int(timezone.now().timestamp()) + 3600
        self.account.save()

        self.account.revoke_tokens()
        self.account.refresh_from_db()

        self.assertIsNone(self.account.access_token)
        self.assertIsNone(self.account.refresh_token)
        self.assertIsNone(self.account.expires_at)


class AccountTokenPropertiesTestCase(TestCase):
    """Test Account token-related properties."""

    def setUp(self):
        """Set up test account."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.account = Account.objects.create(
            user=self.user,
            type='oauth',
            provider='google',
            provider_account_id='google_123'
        )

    def test_is_token_expired_true_when_no_expires_at(self):
        """Test is_token_expired returns True when expires_at is None."""
        self.assertTrue(self.account.is_token_expired)

    def test_is_token_expired_true_when_expired(self):
        """Test is_token_expired returns True for expired token."""
        # Set expiry to 1 hour ago
        self.account.expires_at = int(timezone.now().timestamp()) - 3600
        self.account.save()
        self.assertTrue(self.account.is_token_expired)

    def test_is_token_expired_false_when_valid(self):
        """Test is_token_expired returns False for valid token."""
        # Set expiry to 1 hour from now
        self.account.expires_at = int(timezone.now().timestamp()) + 3600
        self.account.save()
        self.assertFalse(self.account.is_token_expired)

    def test_needs_refresh_true_when_expired_with_refresh_token(self):
        """Test needs_refresh True when expired and refresh token available."""
        self.account.expires_at = int(timezone.now().timestamp()) - 3600
        self.account.refresh_token = 'refresh_token'
        self.account.save()
        self.assertTrue(self.account.needs_refresh)

    def test_needs_refresh_false_when_expired_without_refresh_token(self):
        """Test needs_refresh False when expired but no refresh token."""
        self.account.expires_at = int(timezone.now().timestamp()) - 3600
        self.account.refresh_token = None
        self.account.save()
        self.assertFalse(self.account.needs_refresh)

    def test_needs_refresh_false_when_not_expired(self):
        """Test needs_refresh False when token is still valid."""
        self.account.expires_at = int(timezone.now().timestamp()) + 3600
        self.account.refresh_token = 'refresh_token'
        self.account.save()
        self.assertFalse(self.account.needs_refresh)


class AccountOIDCFieldsTestCase(TestCase):
    """Test Account OIDC-specific fields."""

    def test_account_with_id_token(self):
        """Test creating account with OIDC id_token."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        account = Account.objects.create(
            user=user,
            type='oidc',
            provider='microsoft',
            provider_account_id='microsoft_123',
            id_token='id_token_value',
            session_state='session_state_value'
        )

        self.assertEqual(account.id_token, 'id_token_value')
        self.assertEqual(account.session_state, 'session_state_value')


class AccountProviderTypesTestCase(TestCase):
    """Test different OAuth provider types."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_google_provider_account(self):
        """Test creating Google provider account."""
        account = Account.objects.create(
            user=self.user,
            type='oauth',
            provider='google',
            provider_account_id='google_123'
        )
        self.assertEqual(account.provider, 'google')

    def test_microsoft_provider_account(self):
        """Test creating Microsoft provider account."""
        account = Account.objects.create(
            user=self.user,
            type='oauth',
            provider='microsoft',
            provider_account_id='microsoft_123'
        )
        self.assertEqual(account.provider, 'microsoft')

    def test_github_provider_account(self):
        """Test creating GitHub provider account."""
        account = Account.objects.create(
            user=self.user,
            type='oauth',
            provider='github',
            provider_account_id='github_123'
        )
        self.assertEqual(account.provider, 'github')
