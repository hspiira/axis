"""Comprehensive tests for ServiceCategory model."""
from django.test import TestCase
from django.db import IntegrityError
from django.core.exceptions import ValidationError

from apps.services_app.models import ServiceCategory, Service
from axis_backend.enums import BaseStatus


class ServiceCategoryModelTestCase(TestCase):
    """Test ServiceCategory model fields, properties, and methods."""

    def setUp(self):
        """Set up test data."""
        self.category = ServiceCategory.objects.create(
            name='Counseling',
            description='Mental health counseling services'
        )

    def tearDown(self):
        """Clean up test data."""
        Service.objects.all().delete()
        ServiceCategory.objects.all().delete()

    def test_category_creation_success(self):
        """Test creating a service category."""
        category = ServiceCategory.objects.create(
            name='Legal Assistance',
            description='Legal consultation and support'
        )
        self.assertEqual(category.name, 'Legal Assistance')
        self.assertEqual(category.description, 'Legal consultation and support')
        self.assertIsNotNone(category.id)
        self.assertIsNotNone(category.created_at)
        self.assertIsNotNone(category.updated_at)
        self.assertIsNone(category.deleted_at)

    def test_category_creation_with_metadata(self):
        """Test creating category with metadata."""
        category = ServiceCategory.objects.create(
            name='Financial Planning',
            metadata={'target_audience': 'all employees', 'priority': 'high'}
        )
        self.assertEqual(category.metadata['target_audience'], 'all employees')
        self.assertEqual(category.metadata['priority'], 'high')

    def test_category_name_required(self):
        """Test that name field is required."""
        with self.assertRaises(ValidationError):
            category = ServiceCategory(description='Test description')
            category.full_clean()

    def test_category_name_unique(self):
        """Test that category name must be unique."""
        with self.assertRaises(IntegrityError):
            ServiceCategory.objects.create(
                name='Counseling',
                description='Duplicate category'
            )

    def test_category_name_max_length(self):
        """Test name field max length validation."""
        long_name = 'A' * 101
        with self.assertRaises(ValidationError):
            category = ServiceCategory(name=long_name)
            category.full_clean()

    def test_category_description_optional(self):
        """Test that description is optional."""
        category = ServiceCategory.objects.create(name='Wellness')
        self.assertIsNone(category.description)

    def test_category_metadata_defaults_to_dict(self):
        """Test that metadata defaults to empty dict."""
        category = ServiceCategory.objects.create(name='Crisis Support')
        self.assertEqual(category.metadata, {})

    def test_category_string_representation(self):
        """Test __str__ method returns name."""
        self.assertEqual(str(self.category), 'Counseling')

    def test_category_repr_representation(self):
        """Test __repr__ method."""
        self.assertEqual(repr(self.category), '<ServiceCategory: Counseling>')

    def test_category_ordering(self):
        """Test that categories are ordered by name."""
        ServiceCategory.objects.create(name='Wellness')
        ServiceCategory.objects.create(name='Crisis Support')
        ServiceCategory.objects.create(name='Legal Assistance')

        categories = list(ServiceCategory.objects.all())
        self.assertEqual(categories[0].name, 'Counseling')
        self.assertEqual(categories[1].name, 'Crisis Support')
        self.assertEqual(categories[2].name, 'Legal Assistance')
        self.assertEqual(categories[3].name, 'Wellness')

    def test_service_count_property_empty(self):
        """Test service_count property with no services."""
        self.assertEqual(self.category.service_count, 0)

    def test_service_count_property_with_services(self):
        """Test service_count property with active services."""
        Service.objects.create(
            name='Individual Counseling',
            category=self.category,
            status=BaseStatus.ACTIVE
        )
        Service.objects.create(
            name='Group Therapy',
            category=self.category,
            status=BaseStatus.ACTIVE
        )
        self.assertEqual(self.category.service_count, 2)

    def test_service_count_excludes_deleted_services(self):
        """Test that service_count excludes soft-deleted services."""
        service1 = Service.objects.create(
            name='Individual Counseling',
            category=self.category,
            status=BaseStatus.ACTIVE
        )
        Service.objects.create(
            name='Group Therapy',
            category=self.category,
            status=BaseStatus.ACTIVE
        )

        # Soft delete one service
        service1.soft_delete()

        self.assertEqual(self.category.service_count, 1)

    def test_soft_delete_category(self):
        """Test soft delete functionality."""
        self.assertIsNone(self.category.deleted_at)
        self.category.soft_delete()
        self.assertIsNotNone(self.category.deleted_at)

    def test_restore_category(self):
        """Test restore functionality."""
        self.category.soft_delete()
        self.assertIsNotNone(self.category.deleted_at)
        self.category.restore()
        self.assertIsNone(self.category.deleted_at)

    def test_category_cascade_protect_on_delete(self):
        """Test that category deletion is protected if services exist."""
        Service.objects.create(
            name='Individual Counseling',
            category=self.category,
            status=BaseStatus.ACTIVE
        )

        # Hard delete should be protected
        with self.assertRaises(Exception):
            self.category.delete()

    def test_related_services_access(self):
        """Test accessing related services via reverse relationship."""
        service1 = Service.objects.create(
            name='Individual Counseling',
            category=self.category,
            status=BaseStatus.ACTIVE
        )
        service2 = Service.objects.create(
            name='Group Therapy',
            category=self.category,
            status=BaseStatus.ACTIVE
        )

        services = list(self.category.services.all())
        self.assertEqual(len(services), 2)
        self.assertIn(service1, services)
        self.assertIn(service2, services)

    def test_metadata_json_storage(self):
        """Test that complex metadata can be stored and retrieved."""
        complex_metadata = {
            'icon': 'counseling-icon.svg',
            'color': '#4A90E2',
            'tags': ['mental health', 'wellness', 'support'],
            'settings': {
                'max_sessions': 10,
                'requires_approval': False
            }
        }
        category = ServiceCategory.objects.create(
            name='Advanced Counseling',
            metadata=complex_metadata
        )

        # Retrieve and verify
        retrieved = ServiceCategory.objects.get(id=category.id)
        self.assertEqual(retrieved.metadata['icon'], 'counseling-icon.svg')
        self.assertEqual(retrieved.metadata['color'], '#4A90E2')
        self.assertEqual(len(retrieved.metadata['tags']), 3)
        self.assertEqual(retrieved.metadata['settings']['max_sessions'], 10)

    def test_category_update(self):
        """Test updating category fields."""
        self.category.name = 'Advanced Counseling'
        self.category.description = 'Updated description'
        self.category.save()

        updated = ServiceCategory.objects.get(id=self.category.id)
        self.assertEqual(updated.name, 'Advanced Counseling')
        self.assertEqual(updated.description, 'Updated description')
        self.assertGreater(updated.updated_at, updated.created_at)
