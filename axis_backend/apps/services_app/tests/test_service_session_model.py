"""Comprehensive tests for ServiceSession model."""
from datetime import date, datetime, timedelta
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.authentication.models import User, Profile
from apps.persons.models import Person
from apps.clients.models import Client
from apps.services_app.models import (
    ServiceCategory, Service, ServiceProvider, ServiceSession
)
from axis_backend.enums import (
    BaseStatus, SessionStatus, ServiceProviderType, WorkStatus,
    UserStatus, Gender, Language, PersonType
)


class ServiceSessionModelTestCase(TestCase):
    """Test ServiceSession model fields, properties, and methods."""

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
            status=BaseStatus.ACTIVE,
            duration=60
        )
        self.provider = ServiceProvider.objects.create(
            name='Dr. Smith',
            type=ServiceProviderType.COUNSELOR,
            status=WorkStatus.ACTIVE,
            is_verified=True
        )

        # Create service session
        self.scheduled_time = timezone.now() + timedelta(days=1)
        self.session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=self.scheduled_time,
            status=SessionStatus.SCHEDULED
        )

    def tearDown(self):
        """Clean up test data."""
        # Delete in correct order to avoid FK constraint violations
        ServiceSession.objects.all().delete()
        Person.objects.all().delete()
        ServiceProvider.objects.all().delete()
        Service.objects.all().delete()
        ServiceCategory.objects.all().delete()
        Client.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()

    def test_session_creation_success(self):
        """Test creating a service session."""
        scheduled_time = timezone.now() + timedelta(days=2)
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=scheduled_time,
            status=SessionStatus.SCHEDULED,
            location='Office 101'
        )
        self.assertEqual(session.service, self.service)
        self.assertEqual(session.provider, self.provider)
        self.assertEqual(session.person, self.person)
        self.assertEqual(session.scheduled_at, scheduled_time)
        self.assertEqual(session.status, SessionStatus.SCHEDULED)
        self.assertEqual(session.location, 'Office 101')
        self.assertIsNotNone(session.id)
        self.assertIsNotNone(session.created_at)

    def test_session_service_required(self):
        """Test that service field is required."""
        with self.assertRaises(ValidationError):
            session = ServiceSession(
                provider=self.provider,
                person=self.person,
                scheduled_at=timezone.now()
            )
            session.full_clean()

    def test_session_provider_required(self):
        """Test that provider field is required."""
        with self.assertRaises(ValidationError):
            session = ServiceSession(
                service=self.service,
                person=self.person,
                scheduled_at=timezone.now()
            )
            session.full_clean()

    def test_session_person_required(self):
        """Test that person field is required."""
        with self.assertRaises(ValidationError):
            session = ServiceSession(
                service=self.service,
                provider=self.provider,
                scheduled_at=timezone.now()
            )
            session.full_clean()

    def test_session_scheduled_at_required(self):
        """Test that scheduled_at field is required."""
        with self.assertRaises(ValidationError):
            session = ServiceSession(
                service=self.service,
                provider=self.provider,
                person=self.person
            )
            session.full_clean()

    def test_session_status_default(self):
        """Test that status defaults to SCHEDULED."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertEqual(session.status, SessionStatus.SCHEDULED)

    def test_session_status_choices(self):
        """Test all valid status choices."""
        for status in [SessionStatus.SCHEDULED, SessionStatus.RESCHEDULED,
                       SessionStatus.COMPLETED, SessionStatus.CANCELED,
                       SessionStatus.NO_SHOW, SessionStatus.POSTPONED]:
            session = ServiceSession.objects.create(
                service=self.service,
                provider=self.provider,
                person=self.person,
                scheduled_at=timezone.now() + timedelta(days=1),
                status=status
            )
            self.assertEqual(session.status, status)

    def test_session_completed_at_optional(self):
        """Test that completed_at is optional."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertIsNone(session.completed_at)

    def test_session_notes_optional(self):
        """Test that notes is optional."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertIsNone(session.notes)

    def test_session_feedback_optional(self):
        """Test that feedback is optional."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertIsNone(session.feedback)

    def test_session_duration_optional(self):
        """Test that duration is optional."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertIsNone(session.duration)

    def test_session_duration_positive_validator(self):
        """Test that duration must be positive."""
        with self.assertRaises(ValidationError):
            session = ServiceSession(
                service=self.service,
                provider=self.provider,
                person=self.person,
                scheduled_at=timezone.now() + timedelta(days=1),
                duration=0
            )
            session.full_clean()

        with self.assertRaises(ValidationError):
            session = ServiceSession(
                service=self.service,
                provider=self.provider,
                person=self.person,
                scheduled_at=timezone.now() + timedelta(days=1),
                duration=-10
            )
            session.full_clean()

    def test_session_location_optional(self):
        """Test that location is optional."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertIsNone(session.location)

    def test_session_cancellation_reason_optional(self):
        """Test that cancellation_reason is optional."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertIsNone(session.cancellation_reason)

    def test_session_reschedule_count_default(self):
        """Test that reschedule_count defaults to 0."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertEqual(session.reschedule_count, 0)

    def test_session_is_group_session_default(self):
        """Test that is_group_session defaults to False."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertFalse(session.is_group_session)

    def test_session_metadata_defaults_to_dict(self):
        """Test that metadata defaults to empty dict."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1)
        )
        self.assertEqual(session.metadata, {})

    def test_session_string_representation(self):
        """Test __str__ method."""
        # Profile.display_name returns preferred_name or full_name
        expected = f'{self.service.name} - {self.profile.full_name} ({self.scheduled_time.date()})'
        self.assertEqual(str(self.session), expected)

    def test_session_ordering(self):
        """Test that sessions are ordered by scheduled_at (descending)."""
        now = timezone.now()

        session1 = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=now + timedelta(days=5)
        )
        session2 = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=now + timedelta(days=3)
        )

        sessions = list(ServiceSession.objects.all())
        # Most recent scheduled first
        self.assertEqual(sessions[0], session1)  # +5 days
        self.assertEqual(sessions[1], session2)  # +3 days
        self.assertEqual(sessions[2], self.session)  # +1 day

    def test_session_validation_ineligible_person(self):
        """Test that validation fails for ineligible person."""
        # Make person ineligible by setting status to INACTIVE
        self.person.status = BaseStatus.INACTIVE
        self.person.save()

        with self.assertRaises(ValidationError) as context:
            session = ServiceSession(
                service=self.service,
                provider=self.provider,
                person=self.person,
                scheduled_at=timezone.now() + timedelta(days=1)
            )
            session.full_clean()

        self.assertIn('not currently eligible', str(context.exception))

    def test_complete_method(self):
        """Test complete method."""
        self.session.complete(duration=60, notes='Session went well')
        self.session.refresh_from_db()

        self.assertEqual(self.session.status, SessionStatus.COMPLETED)
        self.assertIsNotNone(self.session.completed_at)
        self.assertEqual(self.session.duration, 60)
        self.assertEqual(self.session.notes, 'Session went well')

    def test_complete_method_without_duration(self):
        """Test complete method without duration."""
        self.session.complete(notes='Session completed')
        self.session.refresh_from_db()

        self.assertEqual(self.session.status, SessionStatus.COMPLETED)
        self.assertIsNotNone(self.session.completed_at)
        self.assertIsNone(self.session.duration)
        self.assertEqual(self.session.notes, 'Session completed')

    def test_complete_method_updates_person_last_service_date(self):
        """Test that complete method updates person's last service date."""
        self.assertIsNone(self.person.last_service_date)

        self.session.complete(duration=60)
        self.person.refresh_from_db()

        self.assertIsNotNone(self.person.last_service_date)
        self.assertEqual(self.person.last_service_date, self.session.completed_at.date())

    def test_cancel_method(self):
        """Test cancel method."""
        self.session.cancel(reason='Client requested cancellation')
        self.session.refresh_from_db()

        self.assertEqual(self.session.status, SessionStatus.CANCELED)
        self.assertEqual(self.session.cancellation_reason, 'Client requested cancellation')

    def test_reschedule_method(self):
        """Test reschedule method."""
        new_time = timezone.now() + timedelta(days=3)
        original_count = self.session.reschedule_count

        self.session.reschedule(new_datetime=new_time)
        self.session.refresh_from_db()

        self.assertEqual(self.session.status, SessionStatus.RESCHEDULED)
        self.assertEqual(self.session.scheduled_at, new_time)
        self.assertEqual(self.session.reschedule_count, original_count + 1)

    def test_reschedule_method_increments_count(self):
        """Test that reschedule increments count correctly."""
        new_time1 = timezone.now() + timedelta(days=3)
        new_time2 = timezone.now() + timedelta(days=5)

        self.session.reschedule(new_datetime=new_time1)
        self.session.reschedule(new_datetime=new_time2)
        self.session.refresh_from_db()

        self.assertEqual(self.session.reschedule_count, 2)

    def test_related_service_access(self):
        """Test accessing service via foreign key."""
        self.assertEqual(self.session.service.name, 'Individual Counseling')

    def test_related_provider_access(self):
        """Test accessing provider via foreign key."""
        self.assertEqual(self.session.provider.name, 'Dr. Smith')

    def test_related_person_access(self):
        """Test accessing person via foreign key."""
        self.assertEqual(self.session.person.profile.full_name, 'John Doe')

    def test_service_sessions_reverse_relationship(self):
        """Test reverse relationship from service to sessions."""
        session2 = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=5)
        )

        sessions = list(self.service.sessions.all())
        self.assertEqual(len(sessions), 2)
        self.assertIn(self.session, sessions)
        self.assertIn(session2, sessions)

    def test_provider_sessions_reverse_relationship(self):
        """Test reverse relationship from provider to sessions."""
        sessions = list(self.provider.sessions.all())
        self.assertEqual(len(sessions), 1)
        self.assertEqual(sessions[0], self.session)

    def test_person_sessions_reverse_relationship(self):
        """Test reverse relationship from person to sessions."""
        sessions = list(self.person.service_sessions.all())
        self.assertEqual(len(sessions), 1)
        self.assertEqual(sessions[0], self.session)

    def test_soft_delete_session(self):
        """Test soft delete functionality."""
        self.assertIsNone(self.session.deleted_at)
        self.session.soft_delete()
        self.assertIsNotNone(self.session.deleted_at)

    def test_restore_session(self):
        """Test restore functionality."""
        self.session.soft_delete()
        self.assertIsNotNone(self.session.deleted_at)
        self.session.restore()
        self.assertIsNone(self.session.deleted_at)

    def test_session_update(self):
        """Test updating session fields."""
        original_updated_at = self.session.updated_at

        self.session.location = 'Virtual/Zoom'
        self.session.notes = 'Updated notes'
        self.session.save()

        updated = ServiceSession.objects.get(id=self.session.id)
        self.assertEqual(updated.location, 'Virtual/Zoom')
        self.assertEqual(updated.notes, 'Updated notes')
        self.assertGreater(updated.updated_at, original_updated_at)

    def test_cascade_protect_on_service_delete(self):
        """Test that session prevents service deletion."""
        with self.assertRaises(Exception):
            self.service.delete()

    def test_cascade_protect_on_provider_delete(self):
        """Test that session prevents provider deletion."""
        with self.assertRaises(Exception):
            self.provider.delete()

    def test_cascade_protect_on_person_delete(self):
        """Test that session prevents person deletion."""
        with self.assertRaises(Exception):
            self.person.delete()

    def test_group_session(self):
        """Test creating a group session."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1),
            is_group_session=True
        )
        self.assertTrue(session.is_group_session)

    def test_session_metadata_complex(self):
        """Test complex metadata storage and retrieval."""
        metadata = {
            'session_type': 'telehealth',
            'zoom_link': 'https://zoom.us/j/123456789',
            'participants': ['participant1@example.com', 'participant2@example.com'],
            'materials': {
                'worksheets': ['anxiety-worksheet.pdf'],
                'resources': ['relaxation-techniques.pdf']
            }
        }
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1),
            metadata=metadata
        )

        retrieved = ServiceSession.objects.get(id=session.id)
        self.assertEqual(retrieved.metadata['session_type'], 'telehealth')
        self.assertEqual(retrieved.metadata['zoom_link'], 'https://zoom.us/j/123456789')
        self.assertEqual(len(retrieved.metadata['participants']), 2)
        self.assertEqual(len(retrieved.metadata['materials']['worksheets']), 1)

    def test_session_with_all_fields(self):
        """Test creating session with all optional fields populated."""
        session = ServiceSession.objects.create(
            service=self.service,
            provider=self.provider,
            person=self.person,
            scheduled_at=timezone.now() + timedelta(days=1),
            status=SessionStatus.SCHEDULED,
            notes='Initial session notes',
            feedback='Expected to be productive',
            duration=60,
            location='Office 201',
            is_group_session=False,
            metadata={'reminder_sent': True}
        )

        self.assertEqual(session.notes, 'Initial session notes')
        self.assertEqual(session.feedback, 'Expected to be productive')
        self.assertEqual(session.duration, 60)
        self.assertEqual(session.location, 'Office 201')
        self.assertFalse(session.is_group_session)
        self.assertTrue(session.metadata['reminder_sent'])
