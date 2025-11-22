"""Comprehensive tests for ServiceProvider model."""
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.services_app.models import ServiceProvider
from axis_backend.enums import ServiceProviderType, WorkStatus


class ServiceProviderModelTestCase(TestCase):
    """Test ServiceProvider model fields, properties, and methods."""

    def setUp(self):
        """Set up test data."""
        self.provider = ServiceProvider.objects.create(
            name='Dr. John Smith',
            type=ServiceProviderType.COUNSELOR,
            contact_email='dr.smith@example.com',
            contact_phone='+1234567890',
            status=WorkStatus.ACTIVE,
            is_verified=True,
            rating=Decimal('4.5')
        )

    def tearDown(self):
        """Clean up test data."""
        ServiceProvider.objects.all().delete()

    def test_provider_creation_success(self):
        """Test creating a service provider."""
        provider = ServiceProvider.objects.create(
            name='Dr. Jane Doe',
            type=ServiceProviderType.COUNSELOR,
            contact_email='jane.doe@example.com',
            status=WorkStatus.ACTIVE
        )
        self.assertEqual(provider.name, 'Dr. Jane Doe')
        self.assertEqual(provider.type, ServiceProviderType.COUNSELOR)
        self.assertEqual(provider.contact_email, 'jane.doe@example.com')
        self.assertIsNotNone(provider.id)
        self.assertIsNotNone(provider.created_at)

    def test_provider_name_required(self):
        """Test that name field is required."""
        with self.assertRaises(ValidationError):
            provider = ServiceProvider(type=ServiceProviderType.COUNSELOR)
            provider.full_clean()

    def test_provider_type_required(self):
        """Test that type field is required."""
        with self.assertRaises(ValidationError):
            provider = ServiceProvider(name='Test Provider')
            provider.full_clean()

    def test_provider_type_choices(self):
        """Test all valid provider type choices."""
        for provider_type in ServiceProviderType.choices:
            provider = ServiceProvider.objects.create(
                name=f'Provider {provider_type[0]}',
                type=provider_type[0]
            )
            self.assertEqual(provider.type, provider_type[0])

    def test_provider_status_default(self):
        """Test that status defaults to ACTIVE."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.CLINIC
        )
        self.assertEqual(provider.status, WorkStatus.ACTIVE)

    def test_provider_status_choices(self):
        """Test all valid status choices."""
        for status in [WorkStatus.ACTIVE, WorkStatus.INACTIVE, WorkStatus.ON_LEAVE,
                       WorkStatus.SUSPENDED, WorkStatus.TERMINATED, WorkStatus.RESIGNED]:
            provider = ServiceProvider.objects.create(
                name=f'Provider {status}',
                type=ServiceProviderType.COUNSELOR,
                status=status
            )
            self.assertEqual(provider.status, status)

    def test_provider_is_verified_default(self):
        """Test that is_verified defaults to False."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertFalse(provider.is_verified)

    def test_provider_contact_email_optional(self):
        """Test that contact email is optional."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.HOTLINE
        )
        self.assertIsNone(provider.contact_email)

    def test_provider_contact_email_validation(self):
        """Test email format validation."""
        with self.assertRaises(ValidationError):
            provider = ServiceProvider(
                name='Test Provider',
                type=ServiceProviderType.COUNSELOR,
                contact_email='invalid-email'
            )
            provider.full_clean()

    def test_provider_contact_phone_optional(self):
        """Test that contact phone is optional."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertIsNone(provider.contact_phone)

    def test_provider_location_optional(self):
        """Test that location is optional."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertIsNone(provider.location)

    def test_provider_location_text(self):
        """Test storing location information."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.CLINIC,
            location='123 Main St, New York, NY 10001'
        )
        self.assertEqual(provider.location, '123 Main St, New York, NY 10001')

    def test_provider_qualifications_default(self):
        """Test that qualifications defaults to empty list."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertEqual(provider.qualifications, [])

    def test_provider_qualifications_list(self):
        """Test storing qualifications as list."""
        qualifications = [
            'Licensed Professional Counselor (LPC)',
            'Certified Clinical Mental Health Counselor (CCMHC)',
            'PhD in Psychology'
        ]
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR,
            qualifications=qualifications
        )
        self.assertEqual(len(provider.qualifications), 3)
        self.assertIn('Licensed Professional Counselor (LPC)', provider.qualifications)

    def test_provider_specializations_default(self):
        """Test that specializations defaults to empty list."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertEqual(provider.specializations, [])

    def test_provider_specializations_list(self):
        """Test storing specializations as list."""
        specializations = ['Anxiety', 'Depression', 'PTSD', 'Family Therapy']
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR,
            specializations=specializations
        )
        self.assertEqual(len(provider.specializations), 4)
        self.assertIn('Anxiety', provider.specializations)

    def test_provider_availability_optional(self):
        """Test that availability is optional."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertIsNone(provider.availability)

    def test_provider_availability_json(self):
        """Test storing availability as JSON."""
        availability = {
            'monday': ['09:00-17:00'],
            'tuesday': ['09:00-17:00'],
            'wednesday': ['09:00-12:00'],
            'friday': ['09:00-17:00']
        }
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR,
            availability=availability
        )
        self.assertEqual(provider.availability['monday'], ['09:00-17:00'])
        self.assertEqual(provider.availability['wednesday'], ['09:00-12:00'])

    def test_provider_rating_optional(self):
        """Test that rating is optional."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertIsNone(provider.rating)

    def test_provider_rating_range_validation(self):
        """Test rating must be between 0 and 5."""
        with self.assertRaises(ValidationError):
            provider = ServiceProvider(
                name='Test Provider',
                type=ServiceProviderType.COUNSELOR,
                rating=Decimal('6.0')
            )
            provider.full_clean()

        with self.assertRaises(ValidationError):
            provider = ServiceProvider(
                name='Test Provider',
                type=ServiceProviderType.COUNSELOR,
                rating=Decimal('-1.0')
            )
            provider.full_clean()

    def test_provider_rating_decimal(self):
        """Test rating accepts decimal values."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR,
            rating=Decimal('4.75')
        )
        self.assertEqual(provider.rating, Decimal('4.75'))

    def test_provider_metadata_defaults_to_dict(self):
        """Test that metadata defaults to empty dict."""
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR
        )
        self.assertEqual(provider.metadata, {})

    def test_provider_string_representation(self):
        """Test __str__ method."""
        expected = f'Dr. John Smith ({ServiceProviderType.COUNSELOR})'
        self.assertEqual(str(self.provider), expected)

    def test_provider_repr_representation(self):
        """Test __repr__ method."""
        self.assertEqual(repr(self.provider), '<ServiceProvider: Dr. John Smith>')

    def test_provider_ordering(self):
        """Test that providers are ordered by rating (desc) then name."""
        ServiceProvider.objects.create(
            name='Provider A',
            type=ServiceProviderType.COUNSELOR,
            rating=Decimal('3.5')
        )
        ServiceProvider.objects.create(
            name='Provider B',
            type=ServiceProviderType.COUNSELOR,
            rating=Decimal('5.0')
        )
        ServiceProvider.objects.create(
            name='Provider C',
            type=ServiceProviderType.COUNSELOR,
            rating=Decimal('4.5')
        )

        providers = list(ServiceProvider.objects.all())
        self.assertEqual(providers[0].name, 'Provider B')  # 5.0
        self.assertEqual(providers[1].rating, Decimal('4.5'))  # 4.5 (our setUp provider)
        self.assertEqual(providers[2].name, 'Provider C')  # 4.5
        self.assertEqual(providers[3].name, 'Provider A')  # 3.5

    def test_is_available_property_true(self):
        """Test is_available property for available provider."""
        self.provider.status = WorkStatus.ACTIVE
        self.provider.is_verified = True
        self.provider.save()
        self.assertTrue(self.provider.is_available)

    def test_is_available_property_false_inactive(self):
        """Test is_available property for inactive provider."""
        self.provider.status = WorkStatus.INACTIVE
        self.provider.is_verified = True
        self.provider.save()
        self.assertFalse(self.provider.is_available)

    def test_is_available_property_false_not_verified(self):
        """Test is_available property for unverified provider."""
        self.provider.status = WorkStatus.ACTIVE
        self.provider.is_verified = False
        self.provider.save()
        self.assertFalse(self.provider.is_available)

    def test_is_available_property_false_deleted(self):
        """Test is_available property for soft-deleted provider."""
        self.provider.soft_delete()
        self.assertFalse(self.provider.is_available)

    def test_verify_method(self):
        """Test verify method."""
        provider = ServiceProvider.objects.create(
            name='Unverified Provider',
            type=ServiceProviderType.COUNSELOR,
            is_verified=False
        )

        provider.verify()
        provider.refresh_from_db()

        self.assertTrue(provider.is_verified)

    def test_update_rating_method(self):
        """Test update_rating method."""
        self.provider.update_rating(Decimal('4.8'))
        self.provider.refresh_from_db()

        self.assertEqual(self.provider.rating, Decimal('4.8'))

    def test_soft_delete_provider(self):
        """Test soft delete functionality."""
        self.assertIsNone(self.provider.deleted_at)
        self.provider.soft_delete()
        self.assertIsNotNone(self.provider.deleted_at)

    def test_restore_provider(self):
        """Test restore functionality."""
        self.provider.soft_delete()
        self.assertIsNotNone(self.provider.deleted_at)
        self.provider.restore()
        self.assertIsNone(self.provider.deleted_at)

    def test_provider_metadata_complex(self):
        """Test complex metadata storage."""
        metadata = {
            'insurance_accepted': ['Blue Cross', 'Aetna', 'Cigna'],
            'languages_spoken': ['English', 'Spanish'],
            'office_hours': {
                'weekdays': '9:00 AM - 5:00 PM',
                'weekends': 'By appointment'
            },
            'telehealth_available': True
        }
        provider = ServiceProvider.objects.create(
            name='Test Provider',
            type=ServiceProviderType.COUNSELOR,
            metadata=metadata
        )

        retrieved = ServiceProvider.objects.get(id=provider.id)
        self.assertEqual(len(retrieved.metadata['insurance_accepted']), 3)
        self.assertTrue(retrieved.metadata['telehealth_available'])
        self.assertEqual(retrieved.metadata['office_hours']['weekdays'], '9:00 AM - 5:00 PM')

    def test_provider_update(self):
        """Test updating provider fields."""
        original_updated_at = self.provider.updated_at

        self.provider.name = 'Dr. John Smith Jr.'
        self.provider.rating = Decimal('4.9')
        self.provider.save()

        updated = ServiceProvider.objects.get(id=self.provider.id)
        self.assertEqual(updated.name, 'Dr. John Smith Jr.')
        self.assertEqual(updated.rating, Decimal('4.9'))
        self.assertGreater(updated.updated_at, original_updated_at)

    def test_provider_different_types(self):
        """Test creating providers of different types."""
        clinic = ServiceProvider.objects.create(
            name='Mental Health Clinic',
            type=ServiceProviderType.CLINIC
        )
        hotline = ServiceProvider.objects.create(
            name='Crisis Hotline',
            type=ServiceProviderType.HOTLINE
        )
        coach = ServiceProvider.objects.create(
            name='Life Coach',
            type=ServiceProviderType.COACH
        )

        self.assertEqual(clinic.type, ServiceProviderType.CLINIC)
        self.assertEqual(hotline.type, ServiceProviderType.HOTLINE)
        self.assertEqual(coach.type, ServiceProviderType.COACH)
