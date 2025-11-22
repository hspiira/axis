"""Comprehensive tests for Service model."""
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.services_app.models import ServiceCategory, Service, ServiceProvider
from axis_backend.enums import BaseStatus, ServiceProviderType, WorkStatus


class ServiceModelTestCase(TestCase):
    """Test Service model fields, properties, and methods."""

    def setUp(self):
        """Set up test data."""
        self.category = ServiceCategory.objects.create(
            name='Counseling',
            description='Mental health counseling services'
        )
        self.provider = ServiceProvider.objects.create(
            name='Dr. Smith',
            type=ServiceProviderType.COUNSELOR,
            status=WorkStatus.ACTIVE,
            is_verified=True
        )
        self.service = Service.objects.create(
            name='Individual Counseling',
            description='One-on-one counseling session',
            category=self.category,
            status=BaseStatus.ACTIVE,
            duration=60,
            capacity=1,
            is_public=True
        )

    def tearDown(self):
        """Clean up test data."""
        # Delete in correct order to avoid FK constraint violations
        Service.objects.all().delete()
        ServiceCategory.objects.all().delete()
        ServiceProvider.objects.all().delete()

    def test_service_creation_success(self):
        """Test creating a service."""
        service = Service.objects.create(
            name='Group Therapy',
            description='Group counseling session',
            category=self.category,
            status=BaseStatus.ACTIVE,
            duration=90,
            capacity=8
        )
        self.assertEqual(service.name, 'Group Therapy')
        self.assertEqual(service.description, 'Group counseling session')
        self.assertEqual(service.category, self.category)
        self.assertEqual(service.status, BaseStatus.ACTIVE)
        self.assertEqual(service.duration, 90)
        self.assertEqual(service.capacity, 8)
        self.assertIsNotNone(service.id)
        self.assertIsNotNone(service.created_at)

    def test_service_name_required(self):
        """Test that name field is required."""
        with self.assertRaises(ValidationError):
            service = Service(category=self.category)
            service.full_clean()

    def test_service_category_required(self):
        """Test that category field is required."""
        with self.assertRaises(ValidationError):
            service = Service(name='Test Service')
            service.full_clean()

    def test_service_status_default(self):
        """Test that status defaults to ACTIVE."""
        service = Service.objects.create(
            name='Test Service',
            category=self.category
        )
        self.assertEqual(service.status, BaseStatus.ACTIVE)

    def test_service_status_choices(self):
        """Test all valid status choices."""
        for status in [BaseStatus.ACTIVE, BaseStatus.INACTIVE, BaseStatus.PENDING]:
            service = Service.objects.create(
                name=f'Service {status}',
                category=self.category,
                status=status
            )
            self.assertEqual(service.status, status)

    def test_service_duration_positive_validator(self):
        """Test that duration must be positive."""
        with self.assertRaises(ValidationError):
            service = Service(
                name='Test Service',
                category=self.category,
                duration=0
            )
            service.full_clean()

        with self.assertRaises(ValidationError):
            service = Service(
                name='Test Service',
                category=self.category,
                duration=-10
            )
            service.full_clean()

    def test_service_capacity_positive_validator(self):
        """Test that capacity must be positive."""
        with self.assertRaises(ValidationError):
            service = Service(
                name='Test Service',
                category=self.category,
                capacity=0
            )
            service.full_clean()

    def test_service_price_positive_validator(self):
        """Test that price must be non-negative."""
        with self.assertRaises(ValidationError):
            service = Service(
                name='Test Service',
                category=self.category,
                price=Decimal('-10.00')
            )
            service.full_clean()

    def test_service_price_decimal(self):
        """Test price field accepts decimal values."""
        service = Service.objects.create(
            name='Paid Service',
            category=self.category,
            price=Decimal('150.50')
        )
        self.assertEqual(service.price, Decimal('150.50'))

    def test_service_is_public_default(self):
        """Test that is_public defaults to True."""
        service = Service.objects.create(
            name='Test Service',
            category=self.category
        )
        self.assertTrue(service.is_public)

    def test_service_with_provider(self):
        """Test service with assigned provider."""
        service = Service.objects.create(
            name='Provider Service',
            category=self.category,
            service_provider=self.provider
        )
        self.assertEqual(service.service_provider, self.provider)

    def test_service_provider_optional(self):
        """Test that service_provider is optional."""
        service = Service.objects.create(
            name='Test Service',
            category=self.category
        )
        self.assertIsNone(service.service_provider)

    def test_service_metadata_defaults_to_dict(self):
        """Test that metadata defaults to empty dict."""
        service = Service.objects.create(
            name='Test Service',
            category=self.category
        )
        self.assertEqual(service.metadata, {})

    def test_service_string_representation(self):
        """Test __str__ method."""
        expected = 'Individual Counseling (Counseling)'
        self.assertEqual(str(self.service), expected)

    def test_service_repr_representation(self):
        """Test __repr__ method."""
        self.assertEqual(repr(self.service), '<Service: Individual Counseling>')

    def test_service_ordering(self):
        """Test that services are ordered by category then name."""
        legal_category = ServiceCategory.objects.create(name='Legal')

        Service.objects.create(name='Wellness Check', category=self.category)
        Service.objects.create(name='Legal Consultation', category=legal_category)
        Service.objects.create(name='Crisis Intervention', category=self.category)

        services = list(Service.objects.all())
        # First by category (Counseling < Legal), then by name within category
        self.assertEqual(services[0].name, 'Crisis Intervention')
        self.assertEqual(services[1].name, 'Individual Counseling')
        self.assertEqual(services[2].name, 'Wellness Check')
        self.assertEqual(services[3].name, 'Legal Consultation')

    def test_is_available_property_active(self):
        """Test is_available property for active service."""
        self.service.status = BaseStatus.ACTIVE
        self.service.save()
        self.assertTrue(self.service.is_available)

    def test_is_available_property_inactive(self):
        """Test is_available property for inactive service."""
        self.service.status = BaseStatus.INACTIVE
        self.service.save()
        self.assertFalse(self.service.is_available)

    def test_is_available_property_deleted(self):
        """Test is_available property for soft-deleted service."""
        self.service.soft_delete()
        self.assertFalse(self.service.is_available)

    def test_is_group_service_property_true(self):
        """Test is_group_service property for group service."""
        service = Service.objects.create(
            name='Group Therapy',
            category=self.category,
            capacity=8
        )
        self.assertTrue(service.is_group_service)

    def test_is_group_service_property_false_individual(self):
        """Test is_group_service property for individual service."""
        service = Service.objects.create(
            name='Individual Therapy',
            category=self.category,
            capacity=1
        )
        self.assertFalse(service.is_group_service)

    def test_is_group_service_property_false_no_capacity(self):
        """Test is_group_service property when capacity is None."""
        service = Service.objects.create(
            name='Flexible Service',
            category=self.category,
            capacity=None
        )
        self.assertFalse(service.is_group_service)

    def test_activate_method(self):
        """Test activate method."""
        self.service.status = BaseStatus.INACTIVE
        self.service.save()

        self.service.activate()
        self.service.refresh_from_db()

        self.assertEqual(self.service.status, BaseStatus.ACTIVE)

    def test_deactivate_method(self):
        """Test deactivate method."""
        self.service.status = BaseStatus.ACTIVE
        self.service.save()

        self.service.deactivate()
        self.service.refresh_from_db()

        self.assertEqual(self.service.status, BaseStatus.INACTIVE)

    def test_soft_delete_service(self):
        """Test soft delete functionality."""
        self.assertIsNone(self.service.deleted_at)
        self.service.soft_delete()
        self.assertIsNotNone(self.service.deleted_at)

    def test_restore_service(self):
        """Test restore functionality."""
        self.service.soft_delete()
        self.assertIsNotNone(self.service.deleted_at)
        self.service.restore()
        self.assertIsNone(self.service.deleted_at)

    def test_related_category_access(self):
        """Test accessing category via foreign key."""
        self.assertEqual(self.service.category.name, 'Counseling')

    def test_related_provider_access(self):
        """Test accessing provider via foreign key."""
        self.service.service_provider = self.provider
        self.service.save()
        self.assertEqual(self.service.service_provider.name, 'Dr. Smith')

    def test_provider_services_reverse_relationship(self):
        """Test reverse relationship from provider to services."""
        service1 = Service.objects.create(
            name='Service 1',
            category=self.category,
            service_provider=self.provider
        )
        service2 = Service.objects.create(
            name='Service 2',
            category=self.category,
            service_provider=self.provider
        )

        services = list(self.provider.services.all())
        self.assertEqual(len(services), 2)
        self.assertIn(service1, services)
        self.assertIn(service2, services)

    def test_service_with_prerequisites(self):
        """Test service with prerequisites text."""
        service = Service.objects.create(
            name='Advanced Therapy',
            category=self.category,
            prerequisites='Must complete initial assessment'
        )
        self.assertEqual(service.prerequisites, 'Must complete initial assessment')

    def test_service_metadata_complex(self):
        """Test complex metadata storage."""
        metadata = {
            'booking_rules': {
                'advance_notice_hours': 24,
                'cancellation_hours': 12
            },
            'materials': ['consent form', 'intake questionnaire'],
            'online_available': True
        }
        service = Service.objects.create(
            name='Test Service',
            category=self.category,
            metadata=metadata
        )

        retrieved = Service.objects.get(id=service.id)
        self.assertEqual(retrieved.metadata['booking_rules']['advance_notice_hours'], 24)
        self.assertEqual(len(retrieved.metadata['materials']), 2)
        self.assertTrue(retrieved.metadata['online_available'])

    def test_service_update(self):
        """Test updating service fields."""
        original_updated_at = self.service.updated_at

        self.service.name = 'Updated Counseling'
        self.service.duration = 90
        self.service.save()

        updated = Service.objects.get(id=self.service.id)
        self.assertEqual(updated.name, 'Updated Counseling')
        self.assertEqual(updated.duration, 90)
        self.assertGreater(updated.updated_at, original_updated_at)

    def test_category_cascade_protect(self):
        """Test that category deletion is protected when services exist."""
        with self.assertRaises(Exception):
            self.category.delete()
