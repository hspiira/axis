"""Comprehensive tests for Session model."""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from apps.authentication.models import User, Session


class SessionModelTestCase(TestCase):
    """Test Session model fields and basic functionality."""

    def setUp(self):
        """Set up test user and session."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.session = Session.objects.create(
            session_token='session_token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1),
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0'
        )

    def test_session_creation_generates_cuid(self):
        """Test that session ID is auto-generated as CUID."""
        self.assertIsNotNone(self.session.id)
        self.assertTrue(len(self.session.id) > 0)

    def test_session_string_representation(self):
        """Test Session __str__ includes user email."""
        str_rep = str(self.session)
        self.assertIn('test@example.com', str_rep)

    def test_session_repr(self):
        """Test Session __repr__ includes user and token."""
        repr_str = repr(self.session)
        self.assertIn('test@example.com', repr_str)
        self.assertIn('session_token_123'[:8], repr_str)

    def test_session_token_is_unique(self):
        """Test that duplicate session tokens are not allowed."""
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Session.objects.create(
                session_token='session_token_123',
                user=self.user,
                expires=timezone.now() + timedelta(hours=1)
            )

    def test_user_can_have_multiple_sessions(self):
        """Test that user can have multiple active sessions."""
        Session.objects.create(
            session_token='session_token_456',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1)
        )

        self.assertEqual(self.user.sessions.count(), 2)

    def test_session_cascade_delete_with_user(self):
        """Test that session is deleted when user is deleted."""
        session_id = self.session.id
        self.user.delete()
        self.assertFalse(Session.objects.filter(id=session_id).exists())

    def test_session_defaults_to_valid(self):
        """Test that is_valid defaults to True."""
        self.assertTrue(self.session.is_valid)

    def test_session_with_security_tracking(self):
        """Test session with IP and user agent."""
        self.assertEqual(self.session.ip_address, '192.168.1.1')
        self.assertEqual(self.session.user_agent, 'Mozilla/5.0')

    def test_session_without_security_tracking(self):
        """Test creating session without IP/user agent."""
        session = Session.objects.create(
            session_token='token_789',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1)
        )
        self.assertIsNone(session.ip_address)
        self.assertIsNone(session.user_agent)


class SessionPropertiesTestCase(TestCase):
    """Test Session model properties."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_is_expired_false_for_future_expiry(self):
        """Test is_expired returns False when session is still valid."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1)
        )
        self.assertFalse(session.is_expired)

    def test_is_expired_true_for_past_expiry(self):
        """Test is_expired returns True when session has expired."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() - timedelta(hours=1)
        )
        self.assertTrue(session.is_expired)

    def test_is_active_true_for_valid_unexpired_session(self):
        """Test is_active returns True for valid, unexpired session."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1),
            is_valid=True
        )
        self.assertTrue(session.is_active)

    def test_is_active_false_for_expired_session(self):
        """Test is_active returns False for expired session."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() - timedelta(hours=1),
            is_valid=True
        )
        self.assertFalse(session.is_active)

    def test_is_active_false_for_invalidated_session(self):
        """Test is_active returns False for invalidated session."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1),
            is_valid=False
        )
        self.assertFalse(session.is_active)

    def test_time_remaining_for_future_expiry(self):
        """Test time_remaining returns positive seconds for valid session."""
        expires = timezone.now() + timedelta(hours=1)
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=expires
        )
        time_remaining = session.time_remaining
        self.assertGreater(time_remaining, 0)
        self.assertLessEqual(time_remaining, 3600)  # 1 hour in seconds

    def test_time_remaining_zero_for_expired_session(self):
        """Test time_remaining returns 0 for expired session."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() - timedelta(hours=1)
        )
        self.assertEqual(session.time_remaining, 0)


class SessionMethodsTestCase(TestCase):
    """Test Session model methods."""

    def setUp(self):
        """Set up test user and session."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1)
        )

    def test_invalidate_sets_is_valid_false(self):
        """Test invalidate method sets is_valid to False."""
        self.assertTrue(self.session.is_valid)
        self.session.invalidate()
        self.session.refresh_from_db()
        self.assertFalse(self.session.is_valid)

    def test_invalidate_makes_session_inactive(self):
        """Test that invalidated session is no longer active."""
        self.session.invalidate()
        self.session.refresh_from_db()
        self.assertFalse(self.session.is_active)

    def test_extend_updates_expiry(self):
        """Test extend method updates expiration time."""
        # Set session to expire soon
        near_expiry = timezone.now() + timedelta(minutes=5)
        self.session.expires = near_expiry
        self.session.save()

        # Extend it
        self.session.extend(minutes=30)
        self.session.refresh_from_db()

        # New expiry should be ~30 minutes from now (more than the 5 minutes it was)
        self.assertGreater(self.session.expires, near_expiry)

    def test_extend_with_custom_minutes(self):
        """Test extend with custom time period."""
        before_extend = timezone.now()
        self.session.extend(minutes=60)
        self.session.refresh_from_db()

        expected_min = before_extend + timedelta(minutes=59)
        expected_max = before_extend + timedelta(minutes=61)

        self.assertGreaterEqual(self.session.expires, expected_min)
        self.assertLessEqual(self.session.expires, expected_max)

    def test_extend_default_30_minutes(self):
        """Test extend defaults to 30 minutes."""
        before_extend = timezone.now()
        self.session.extend()
        self.session.refresh_from_db()

        expected_min = before_extend + timedelta(minutes=29)
        expected_max = before_extend + timedelta(minutes=31)

        self.assertGreaterEqual(self.session.expires, expected_min)
        self.assertLessEqual(self.session.expires, expected_max)


class SessionCleanupTestCase(TestCase):
    """Test Session cleanup class method."""

    def setUp(self):
        """Set up test user and sessions."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

        # Create expired sessions
        Session.objects.create(
            session_token='expired_1',
            user=self.user,
            expires=timezone.now() - timedelta(hours=2)
        )
        Session.objects.create(
            session_token='expired_2',
            user=self.user,
            expires=timezone.now() - timedelta(hours=1)
        )

        # Create valid session
        Session.objects.create(
            session_token='valid_1',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1)
        )

    def test_cleanup_expired_removes_expired_sessions(self):
        """Test cleanup_expired removes only expired sessions."""
        self.assertEqual(Session.objects.count(), 3)

        deleted_count = Session.cleanup_expired()

        self.assertEqual(deleted_count, 2)
        self.assertEqual(Session.objects.count(), 1)
        self.assertTrue(
            Session.objects.filter(session_token='valid_1').exists()
        )

    def test_cleanup_expired_returns_count(self):
        """Test that cleanup_expired returns number of deleted sessions."""
        count = Session.cleanup_expired()
        self.assertEqual(count, 2)

    def test_cleanup_expired_with_no_expired_sessions(self):
        """Test cleanup_expired when no sessions are expired."""
        # Remove all expired sessions first
        Session.objects.filter(expires__lt=timezone.now()).delete()

        count = Session.cleanup_expired()
        self.assertEqual(count, 0)
        self.assertEqual(Session.objects.count(), 1)


class SessionSecurityTestCase(TestCase):
    """Test session security features."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_session_tracks_ipv4_address(self):
        """Test session can store IPv4 address."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1),
            ip_address='192.168.1.1'
        )
        self.assertEqual(session.ip_address, '192.168.1.1')

    def test_session_tracks_ipv6_address(self):
        """Test session can store IPv6 address."""
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1),
            ip_address='2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        )
        self.assertEqual(session.ip_address, '2001:0db8:85a3:0000:0000:8a2e:0370:7334')

    def test_session_stores_user_agent(self):
        """Test session stores user agent string."""
        user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        session = Session.objects.create(
            session_token='token_123',
            user=self.user,
            expires=timezone.now() + timedelta(hours=1),
            user_agent=user_agent
        )
        self.assertEqual(session.user_agent, user_agent)
