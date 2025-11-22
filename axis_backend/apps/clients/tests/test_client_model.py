"""Comprehensive tests for Client model."""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.clients.models import Client, Industry
from axis_backend.enums import BaseStatus, ContactMethod


class ClientModelTestCase(TestCase):
    """Test Client model fields and basic functionality."""

    def setUp(self):
        """Set up test industry and client."""
        self.industry = Industry.objects.create(
            name='Technology',
            code='TECH001'
        )
        self.client = Client.objects.create(
            name='Acme Corporation',
            email='contact@acme.com',
            phone='+1234567890',
            industry=self.industry
        )

    def test_client_creation_generates_cuid(self):
        """Test that client ID is auto-generated as CUID."""
        self.assertIsNotNone(self.client.id)
        self.assertTrue(len(self.client.id) > 0)
        self.assertTrue(isinstance(self.client.id, str))

    def test_client_string_representation(self):
        """Test Client __str__ returns name."""
        self.assertEqual(str(self.client), 'Acme Corporation')

    def test_client_repr(self):
        """Test Client __repr__ includes name and status."""
        repr_str = repr(self.client)
        self.assertIn('Acme Corporation', repr_str)
        self.assertIn(BaseStatus.ACTIVE, repr_str)

    def test_client_default_status_is_active(self):
        """Test that new clients default to ACTIVE status."""
        self.assertEqual(self.client.status, BaseStatus.ACTIVE)

    def test_client_is_not_verified_by_default(self):
        """Test that clients are not verified by default."""
        self.assertFalse(self.client.is_verified)

    def test_client_metadata_defaults_to_dict(self):
        """Test that metadata field defaults to empty dict."""
        self.assertEqual(self.client.metadata, {})

    def test_timestamps_are_auto_generated(self):
        """Test that created_at and updated_at are auto-set."""
        self.assertIsNotNone(self.client.created_at)
        self.assertIsNotNone(self.client.updated_at)


class ClientContactInformationTestCase(TestCase):
    """Test Client contact information fields."""

    def test_client_with_full_contact_info(self):
        """Test creating client with all contact fields."""
        client = Client.objects.create(
            name='Test Corp',
            email='info@test.com',
            phone='+1234567890',
            website='https://test.com',
            contact_person='John Doe',
            contact_email='john@test.com',
            contact_phone='+9876543210'
        )
        self.assertEqual(client.email, 'info@test.com')
        self.assertEqual(client.phone, '+1234567890')
        self.assertEqual(client.website, 'https://test.com')
        self.assertEqual(client.contact_person, 'John Doe')

    def test_client_with_minimal_info(self):
        """Test creating client with only required name field."""
        client = Client.objects.create(name='Minimal Corp')
        self.assertEqual(client.name, 'Minimal Corp')
        self.assertIsNone(client.email)
        self.assertIsNone(client.phone)

    def test_client_with_preferred_contact_method(self):
        """Test setting preferred contact method."""
        client = Client.objects.create(
            name='Test Corp',
            email='info@test.com',
            preferred_contact_method=ContactMethod.EMAIL
        )
        self.assertEqual(client.preferred_contact_method, ContactMethod.EMAIL)

    def test_client_website_validation(self):
        """Test that invalid website URL raises validation error."""
        client = Client(
            name='Test Corp',
            website='not-a-valid-url'
        )
        with self.assertRaises(ValidationError):
            client.full_clean()


class ClientLocationTestCase(TestCase):
    """Test Client location and address fields."""

    def test_client_with_address(self):
        """Test creating client with physical address."""
        client = Client.objects.create(
            name='Test Corp',
            address='123 Main St, City, State 12345'
        )
        self.assertEqual(client.address, '123 Main St, City, State 12345')

    def test_client_with_separate_billing_address(self):
        """Test client with different billing address."""
        client = Client.objects.create(
            name='Test Corp',
            address='123 Main St, City, State 12345',
            billing_address='PO Box 456, City, State 12345'
        )
        self.assertEqual(client.billing_address, 'PO Box 456, City, State 12345')

    def test_client_with_timezone(self):
        """Test setting client timezone."""
        client = Client.objects.create(
            name='Test Corp',
            timezone='Africa/Kampala'
        )
        self.assertEqual(client.timezone, 'Africa/Kampala')


class ClientFinancialTestCase(TestCase):
    """Test Client financial information fields."""

    def test_client_with_tax_id(self):
        """Test creating client with tax ID."""
        client = Client.objects.create(
            name='Test Corp',
            tax_id='TAX-123456'
        )
        self.assertEqual(client.tax_id, 'TAX-123456')

    def test_client_without_tax_id(self):
        """Test creating client without tax ID."""
        client = Client.objects.create(name='Test Corp')
        self.assertIsNone(client.tax_id)


class ClientIndustryRelationshipTestCase(TestCase):
    """Test Client-Industry relationship."""

    def setUp(self):
        """Set up test industries."""
        self.tech_industry = Industry.objects.create(
            name='Technology',
            code='TECH'
        )
        self.health_industry = Industry.objects.create(
            name='Healthcare',
            code='HEALTH'
        )

    def test_client_with_industry(self):
        """Test creating client with industry classification."""
        client = Client.objects.create(
            name='Tech Corp',
            industry=self.tech_industry
        )
        self.assertEqual(client.industry, self.tech_industry)

    def test_client_without_industry(self):
        """Test creating client without industry."""
        client = Client.objects.create(name='Unclassified Corp')
        self.assertIsNone(client.industry)

    def test_industry_set_null_on_delete(self):
        """Test that client.industry is set to NULL when industry is deleted."""
        client = Client.objects.create(
            name='Tech Corp',
            industry=self.tech_industry
        )

        self.tech_industry.delete()
        client.refresh_from_db()

        self.assertIsNone(client.industry)

    def test_multiple_clients_same_industry(self):
        """Test that multiple clients can share the same industry."""
        client1 = Client.objects.create(
            name='Tech Corp 1',
            industry=self.tech_industry
        )
        client2 = Client.objects.create(
            name='Tech Corp 2',
            industry=self.tech_industry
        )

        self.assertEqual(self.tech_industry.clients.count(), 2)
        self.assertIn(client1, self.tech_industry.clients.all())
        self.assertIn(client2, self.tech_industry.clients.all())


class ClientValidationTestCase(TestCase):
    """Test Client model validation rules."""

    def test_active_client_without_contact_raises_error(self):
        """Test that active client without any contact info raises ValidationError."""
        client = Client(
            name='No Contact Corp',
            status=BaseStatus.ACTIVE
        )
        with self.assertRaises(ValidationError) as context:
            client.full_clean()

        self.assertIn('contact method', str(context.exception).lower())

    def test_active_client_with_email_passes_validation(self):
        """Test that active client with email passes validation."""
        client = Client(
            name='Email Corp',
            email='info@example.com',
            status=BaseStatus.ACTIVE
        )
        # Should not raise ValidationError
        client.full_clean()

    def test_active_client_with_phone_passes_validation(self):
        """Test that active client with phone passes validation."""
        client = Client(
            name='Phone Corp',
            phone='+1234567890',
            status=BaseStatus.ACTIVE
        )
        # Should not raise ValidationError
        client.full_clean()

    def test_active_client_with_contact_email_passes_validation(self):
        """Test that active client with contact person email passes validation."""
        client = Client(
            name='Contact Email Corp',
            contact_email='contact@example.com',
            status=BaseStatus.ACTIVE
        )
        # Should not raise ValidationError
        client.full_clean()

    def test_active_client_with_contact_phone_passes_validation(self):
        """Test that active client with contact person phone passes validation."""
        client = Client(
            name='Contact Phone Corp',
            contact_phone='+1234567890',
            status=BaseStatus.ACTIVE
        )
        # Should not raise ValidationError
        client.full_clean()

    def test_inactive_client_without_contact_passes_validation(self):
        """Test that inactive client can exist without contact info."""
        client = Client(
            name='Inactive Corp',
            status=BaseStatus.INACTIVE
        )
        # Should not raise ValidationError
        client.full_clean()


class ClientPropertiesTestCase(TestCase):
    """Test Client model properties."""

    def setUp(self):
        """Set up test client."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='info@test.com'
        )

    def test_is_active_true_for_active_client(self):
        """Test is_active returns True for active clients."""
        self.client.status = BaseStatus.ACTIVE
        self.client.save()
        self.assertTrue(self.client.is_active)

    def test_is_active_false_for_inactive_client(self):
        """Test is_active returns False for inactive clients."""
        self.client.status = BaseStatus.INACTIVE
        self.client.save()
        self.assertFalse(self.client.is_active)

    def test_is_active_false_for_soft_deleted_client(self):
        """Test is_active returns False for soft-deleted clients."""
        self.client.status = BaseStatus.ACTIVE
        self.client.soft_delete()
        self.client.refresh_from_db()
        self.assertFalse(self.client.is_active)

    def test_verified_status_false_by_default(self):
        """Test verified_status returns False for unverified clients."""
        self.assertFalse(self.client.verified_status)

    def test_verified_status_true_after_verification(self):
        """Test verified_status returns True after verification."""
        self.client.is_verified = True
        self.client.save()
        self.assertTrue(self.client.verified_status)


class ClientStateTransitionTestCase(TestCase):
    """Test Client status transition methods."""

    def setUp(self):
        """Set up test client."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='info@test.com'
        )

    def test_verify_sets_is_verified_true(self):
        """Test verify method sets is_verified to True."""
        self.assertFalse(self.client.is_verified)
        self.client.verify()
        self.client.refresh_from_db()
        self.assertTrue(self.client.is_verified)

    def test_verify_records_timestamp_in_metadata(self):
        """Test verify records verified_at in metadata."""
        self.client.verify()
        self.client.refresh_from_db()
        self.assertIn('verified_at', self.client.metadata)

    def test_verify_records_verified_by(self):
        """Test verify records who verified the client."""
        self.client.verify(verified_by='user_123')
        self.client.refresh_from_db()
        self.assertEqual(self.client.metadata['verified_by'], 'user_123')

    def test_activate_changes_status_to_active(self):
        """Test activate method changes status to ACTIVE."""
        self.client.status = BaseStatus.INACTIVE
        self.client.save()

        self.client.activate()
        self.client.refresh_from_db()

        self.assertEqual(self.client.status, BaseStatus.ACTIVE)

    def test_activate_tracks_status_change(self):
        """Test activate records status change in metadata."""
        self.client.status = BaseStatus.INACTIVE
        self.client.save()

        self.client.activate()
        self.client.refresh_from_db()

        self.assertIn('status_history', self.client.metadata)
        history = self.client.metadata['status_history']
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]['from'], BaseStatus.INACTIVE)
        self.assertEqual(history[0]['to'], BaseStatus.ACTIVE)

    def test_deactivate_changes_status_to_inactive(self):
        """Test deactivate method changes status to INACTIVE."""
        self.client.deactivate('Client request')
        self.client.refresh_from_db()

        self.assertEqual(self.client.status, BaseStatus.INACTIVE)

    def test_deactivate_records_reason(self):
        """Test deactivate records reason in metadata."""
        self.client.deactivate('Client request')
        self.client.refresh_from_db()

        self.assertIn('deactivation_reason', self.client.metadata)
        self.assertEqual(self.client.metadata['deactivation_reason'], 'Client request')

    def test_deactivate_without_reason(self):
        """Test deactivate works without providing reason."""
        self.client.deactivate()
        self.client.refresh_from_db()

        self.assertEqual(self.client.status, BaseStatus.INACTIVE)
        self.assertNotIn('deactivation_reason', self.client.metadata)

    def test_archive_changes_status_to_archived(self):
        """Test archive method changes status to ARCHIVED."""
        self.client.archive('End of contract')
        self.client.refresh_from_db()

        self.assertEqual(self.client.status, BaseStatus.ARCHIVED)

    def test_archive_records_reason(self):
        """Test archive records reason in metadata."""
        self.client.archive('End of contract')
        self.client.refresh_from_db()

        self.assertIn('archive_reason', self.client.metadata)
        self.assertEqual(self.client.metadata['archive_reason'], 'End of contract')


class ClientContactMethodsTestCase(TestCase):
    """Test Client contact retrieval methods."""

    def test_get_primary_contact_with_contact_person(self):
        """Test get_primary_contact returns contact person details."""
        client = Client.objects.create(
            name='Test Corp',
            email='company@test.com',
            phone='+1111111111',
            contact_person='Jane Doe',
            contact_email='jane@test.com',
            contact_phone='+2222222222',
            preferred_contact_method=ContactMethod.EMAIL
        )

        contact = client.get_primary_contact()

        self.assertEqual(contact['name'], 'Jane Doe')
        self.assertEqual(contact['email'], 'jane@test.com')
        self.assertEqual(contact['phone'], '+2222222222')
        self.assertEqual(contact['method'], ContactMethod.EMAIL)

    def test_get_primary_contact_without_contact_person(self):
        """Test get_primary_contact falls back to company info."""
        client = Client.objects.create(
            name='Test Corp',
            email='company@test.com',
            phone='+1111111111',
            preferred_contact_method=ContactMethod.PHONE
        )

        contact = client.get_primary_contact()

        self.assertEqual(contact['name'], 'Test Corp')
        self.assertEqual(contact['email'], 'company@test.com')
        self.assertEqual(contact['phone'], '+1111111111')
        self.assertEqual(contact['method'], ContactMethod.PHONE)

    def test_get_primary_contact_partial_contact_person(self):
        """Test get_primary_contact with partial contact person info."""
        client = Client.objects.create(
            name='Test Corp',
            email='company@test.com',
            contact_person='John Smith',
            contact_phone='+3333333333'
        )

        contact = client.get_primary_contact()

        self.assertEqual(contact['name'], 'John Smith')
        self.assertEqual(contact['email'], 'company@test.com')  # Falls back to company
        self.assertEqual(contact['phone'], '+3333333333')


class ClientNotesAndMetadataTestCase(TestCase):
    """Test Client notes and metadata fields."""

    def test_client_with_notes(self):
        """Test creating client with internal notes."""
        client = Client.objects.create(
            name='Test Corp',
            notes='VIP client - handle with priority'
        )
        self.assertEqual(client.notes, 'VIP client - handle with priority')

    def test_client_metadata_storage(self):
        """Test storing custom data in metadata."""
        client = Client.objects.create(
            name='Test Corp',
            metadata={
                'custom_field': 'custom_value',
                'tags': ['vip', 'enterprise']
            }
        )
        self.assertEqual(client.metadata['custom_field'], 'custom_value')
        self.assertIn('vip', client.metadata['tags'])


class ClientSoftDeleteTestCase(TestCase):
    """Test Client soft delete functionality."""

    def setUp(self):
        """Set up test client."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='info@test.com'
        )

    def test_soft_delete_sets_deleted_at(self):
        """Test soft_delete sets deleted_at timestamp."""
        self.assertIsNone(self.client.deleted_at)
        self.client.soft_delete()
        self.client.refresh_from_db()
        self.assertIsNotNone(self.client.deleted_at)

    def test_restore_clears_deleted_at(self):
        """Test restore clears deleted_at timestamp."""
        self.client.soft_delete()
        self.client.restore()
        self.client.refresh_from_db()
        self.assertIsNone(self.client.deleted_at)

    def test_soft_deleted_client_not_active(self):
        """Test that soft-deleted clients are not considered active."""
        self.client.status = BaseStatus.ACTIVE
        self.client.save()
        self.client.soft_delete()
        self.client.refresh_from_db()
        self.assertFalse(self.client.is_active)
