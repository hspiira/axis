"""Comprehensive tests for SessionFeedback model."""
from datetime import date, timedelta
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.authentication.models import User, Profile
from apps.persons.models import Person
from apps.clients.models import Client
from apps.services_app.models import (
    ServiceCategory, Service, ServiceProvider, ServiceSession, SessionFeedback
)
from axis_backend.enums import (
    BaseStatus, SessionStatus, ServiceProviderType, WorkStatus,
    UserStatus, Gender, Language, PersonType
)


class SessionFeedbackModelTestCase(TestCase):
    """Test SessionFeedback model fields, properties, and methods."""

    def setUp(self):
        """Set up test data."""
        # Create user and profile
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            status=UserStatus.ACTIVE
        )
        self.profile = Profile.objects.create(
            user=self.user,
            full_name='John Doe',
            dob=date(1985, 5, 15),
            gender=Gender.MALE,
            preferred_language=Language.ENGLISH
        )

        # Create client
        self.client = Client.objects.create(
            name='ABC Corporation',
            contact_email='contact@abc.com',
            status=BaseStatus.ACTIVE
        )

        # Create person
        self.person = Person.objects.create(
            profile=self.profile,
            user=self.user,
            person_type=PersonType.EMPLOYEE,
            client=self.client
        )

        # Create category, service, and provider
        self.category = ServiceCategory.objects.create(
            name='Counseling',
            description='Mental health counseling'
        )
        self.service = Service.objects.create(
            name='Individual Counseling',
            category=self.category,
            status=BaseStatus.ACTIVE
        )
        self.provider = ServiceProvider.objects.create(
            name='Dr. Smith',
            type=ServiceProviderType.COUNSELOR,
            status=WorkStatus.ACTIVE,
            is_verified=True
        )

        # Create completed service session
        self.session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() - timedelta(days=1),
            completed_at=timezone.now() - timedelta(hours=2),
            status=SessionStatus.COMPLETED,
            duration=60
        )

        # Create feedback
        self.feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=5,
            comment='Excellent session, very helpful'
        )

    def tearDown(self):
        """Clean up test data."""
        # Delete in correct order to avoid FK constraint violations
        SessionFeedback.objects.all().delete()
        ServiceSession.objects.all().delete()
        Person.objects.all().delete()
        ServiceProvider.objects.all().delete()
        Service.objects.all().delete()
        ServiceCategory.objects.all().delete()
        Client.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()

    def test_feedback_creation_success(self):
        """Test creating session feedback."""
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=4,
            comment='Good session'
        )
        self.assertEqual(feedback.session, self.session)
        self.assertEqual(feedback.rating, 4)
        self.assertEqual(feedback.comment, 'Good session')
        self.assertIsNotNone(feedback.id)
        self.assertIsNotNone(feedback.created_at)

    def test_feedback_session_required(self):
        """Test that session field is required."""
        with self.assertRaises(ValidationError):
            feedback = SessionFeedback(rating=5)
            feedback.full_clean()

    def test_feedback_rating_required(self):
        """Test that rating field is required."""
        with self.assertRaises(ValidationError):
            feedback = SessionFeedback(session=self.session)
            feedback.full_clean()

    def test_feedback_rating_minimum_validator(self):
        """Test that rating must be at least 1."""
        with self.assertRaises(ValidationError):
            feedback = SessionFeedback(
                session=self.session,
                rating=0
            )
            feedback.full_clean()

        with self.assertRaises(ValidationError):
            feedback = SessionFeedback(
                session=self.session,
                rating=-1
            )
            feedback.full_clean()

    def test_feedback_rating_maximum_validator(self):
        """Test that rating must be at most 5."""
        with self.assertRaises(ValidationError):
            feedback = SessionFeedback(
                session=self.session,
                rating=6
            )
            feedback.full_clean()

        with self.assertRaises(ValidationError):
            feedback = SessionFeedback(
                session=self.session,
                rating=10
            )
            feedback.full_clean()

    def test_feedback_rating_valid_values(self):
        """Test all valid rating values (1-5)."""
        for rating in range(1, 6):
            feedback = SessionFeedback.objects.create(
                session=self.session,
                rating=rating,
                comment=f'Rating {rating}'
            )
            self.assertEqual(feedback.rating, rating)

    def test_feedback_comment_optional(self):
        """Test that comment is optional."""
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=4
        )
        self.assertIsNone(feedback.comment)

    def test_feedback_comment_text(self):
        """Test storing comment as text."""
        long_comment = 'This is a very detailed feedback about the session. ' * 10
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=5,
            comment=long_comment
        )
        self.assertEqual(feedback.comment, long_comment)

    def test_feedback_metadata_defaults_to_dict(self):
        """Test that metadata defaults to empty dict."""
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=4
        )
        self.assertEqual(feedback.metadata, {})

    def test_feedback_metadata_storage(self):
        """Test storing metadata."""
        metadata = {
            'helpfulness': 5,
            'professionalism': 5,
            'communication': 4,
            'would_recommend': True
        }
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=5,
            metadata=metadata
        )
        self.assertEqual(feedback.metadata['helpfulness'], 5)
        self.assertEqual(feedback.metadata['professionalism'], 5)
        self.assertEqual(feedback.metadata['communication'], 4)
        self.assertTrue(feedback.metadata['would_recommend'])

    def test_feedback_string_representation(self):
        """Test __str__ method."""
        expected = f'Feedback for {self.session} (5/5)'
        self.assertEqual(str(self.feedback), expected)

    def test_feedback_ordering(self):
        """Test that feedback is ordered by created_at (descending)."""
        feedback1 = SessionFeedback.objects.create(
            session=self.session,
            rating=4,
            comment='Second feedback'
        )
        feedback2 = SessionFeedback.objects.create(
            session=self.session,
            rating=3,
            comment='Third feedback'
        )

        feedbacks = list(SessionFeedback.objects.all())
        # Most recent first
        self.assertEqual(feedbacks[0], feedback2)
        self.assertEqual(feedbacks[1], feedback1)
        self.assertEqual(feedbacks[2], self.feedback)

    def test_related_session_access(self):
        """Test accessing session via foreign key."""
        self.assertEqual(self.feedback.session.service.name, 'Individual Counseling')
        self.assertEqual(self.feedback.session.provider.name, 'Dr. Smith')

    def test_session_feedback_reverse_relationship(self):
        """Test reverse relationship from session to feedback."""
        feedback2 = SessionFeedback.objects.create(
            session=self.session,
            rating=4,
            comment='Additional feedback'
        )

        feedbacks = list(self.session.feedback_entries.all())
        self.assertEqual(len(feedbacks), 2)
        self.assertIn(self.feedback, feedbacks)
        self.assertIn(feedback2, feedbacks)

    def test_cascade_delete_on_session_delete(self):
        """Test that feedback is deleted when session is deleted."""
        feedback_id = self.feedback.id
        self.session.delete()

        # Feedback should be deleted
        with self.assertRaises(SessionFeedback.DoesNotExist):
            SessionFeedback.objects.get(id=feedback_id)

    def test_soft_delete_feedback(self):
        """Test soft delete functionality."""
        self.assertIsNone(self.feedback.deleted_at)
        self.feedback.soft_delete()
        self.assertIsNotNone(self.feedback.deleted_at)

    def test_restore_feedback(self):
        """Test restore functionality."""
        self.feedback.soft_delete()
        self.assertIsNotNone(self.feedback.deleted_at)
        self.feedback.restore()
        self.assertIsNone(self.feedback.deleted_at)

    def test_feedback_update(self):
        """Test updating feedback fields."""
        original_updated_at = self.feedback.updated_at

        self.feedback.rating = 4
        self.feedback.comment = 'Updated comment'
        self.feedback.save()

        updated = SessionFeedback.objects.get(id=self.feedback.id)
        self.assertEqual(updated.rating, 4)
        self.assertEqual(updated.comment, 'Updated comment')
        self.assertGreater(updated.updated_at, original_updated_at)

    def test_multiple_feedback_per_session(self):
        """Test that multiple feedback entries can exist for one session."""
        feedback2 = SessionFeedback.objects.create(
            session=self.session,
            rating=4,
            comment='Follow-up feedback'
        )
        feedback3 = SessionFeedback.objects.create(
            session=self.session,
            rating=5,
            comment='Final feedback'
        )

        feedbacks = SessionFeedback.objects.filter(session=self.session)
        self.assertEqual(feedbacks.count(), 3)

    def test_feedback_metadata_complex(self):
        """Test complex metadata storage and retrieval."""
        metadata = {
            'categories': {
                'helpfulness': 5,
                'professionalism': 5,
                'timeliness': 4,
                'environment': 5
            },
            'improvements': ['Longer session duration', 'More resources'],
            'highlights': 'Excellent coping strategies discussed',
            'anonymous': False,
            'consent_to_share': True
        }
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=5,
            comment='Comprehensive feedback',
            metadata=metadata
        )

        retrieved = SessionFeedback.objects.get(id=feedback.id)
        self.assertEqual(retrieved.metadata['categories']['helpfulness'], 5)
        self.assertEqual(len(retrieved.metadata['improvements']), 2)
        self.assertEqual(retrieved.metadata['highlights'], 'Excellent coping strategies discussed')
        self.assertFalse(retrieved.metadata['anonymous'])
        self.assertTrue(retrieved.metadata['consent_to_share'])

    def test_feedback_without_comment(self):
        """Test feedback with only rating, no comment."""
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=3
        )
        self.assertEqual(feedback.rating, 3)
        self.assertIsNone(feedback.comment)
        self.assertIsNotNone(feedback.id)

    def test_feedback_with_empty_comment(self):
        """Test feedback with empty string comment."""
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=4,
            comment=''
        )
        self.assertEqual(feedback.comment, '')

    def test_feedback_rating_distribution(self):
        """Test creating feedback with different ratings to verify distribution."""
        # Create feedback with different ratings
        SessionFeedback.objects.create(session=self.session, rating=1, comment='Poor')
        SessionFeedback.objects.create(session=self.session, rating=2, comment='Below average')
        SessionFeedback.objects.create(session=self.session, rating=3, comment='Average')
        SessionFeedback.objects.create(session=self.session, rating=4, comment='Good')
        # Already have one with rating 5 from setUp

        # Verify count by rating
        self.assertEqual(SessionFeedback.objects.filter(rating=1).count(), 1)
        self.assertEqual(SessionFeedback.objects.filter(rating=2).count(), 1)
        self.assertEqual(SessionFeedback.objects.filter(rating=3).count(), 1)
        self.assertEqual(SessionFeedback.objects.filter(rating=4).count(), 1)
        self.assertEqual(SessionFeedback.objects.filter(rating=5).count(), 1)

    def test_feedback_for_different_sessions(self):
        """Test creating feedback for multiple different sessions."""
        # Create another session
        session2 = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() - timedelta(days=2),
            completed_at=timezone.now() - timedelta(days=2, hours=1),
            status=SessionStatus.COMPLETED
        )

        # Create feedback for second session
        feedback2 = SessionFeedback.objects.create(
            session=session2,
            rating=4,
            comment='Different session feedback'
        )

        # Verify each session has its own feedback
        self.assertEqual(self.session.feedback_entries.count(), 1)
        self.assertEqual(session2.feedback_entries.count(), 1)
        self.assertNotEqual(self.feedback.session, feedback2.session)

    def test_feedback_timestamps(self):
        """Test that created_at and updated_at are properly set."""
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=4,
            comment='Test feedback'
        )

        self.assertIsNotNone(feedback.created_at)
        self.assertIsNotNone(feedback.updated_at)
        # Timestamps should be very close (within 1 second)
        time_diff = abs((feedback.updated_at - feedback.created_at).total_seconds())
        self.assertLess(time_diff, 1.0)

        # Update and verify updated_at changes
        original_updated_at = feedback.updated_at
        feedback.rating = 5
        feedback.save()
        feedback.refresh_from_db()

        self.assertGreater(feedback.updated_at, original_updated_at)

    def test_feedback_with_special_characters_in_comment(self):
        """Test feedback with special characters in comment."""
        special_comment = "Great session! I really appreciated the provider's approach. 5/5 ⭐⭐⭐⭐⭐"
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=5,
            comment=special_comment
        )
        self.assertEqual(feedback.comment, special_comment)

    def test_feedback_with_very_long_comment(self):
        """Test feedback with very long comment."""
        long_comment = "This is an extremely detailed feedback. " * 100
        feedback = SessionFeedback.objects.create(
            session=self.session,
            rating=5,
            comment=long_comment
        )
        retrieved = SessionFeedback.objects.get(id=feedback.id)
        self.assertEqual(retrieved.comment, long_comment)
