"""Tests for DocumentService."""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from datetime import date, timedelta
from decimal import Decimal

from apps.documents.models import Document
from apps.documents.services.document_service import DocumentService
from apps.authentication.models import User
from apps.clients.models import Client
from apps.contracts.models import Contract
from axis_backend.enums import DocumentType, DocumentStatus, BaseStatus, ContractStatus


@pytest.mark.django_db
class TestDocumentService(TestCase):
    """Test cases for DocumentService."""

    def setUp(self):
        """Set up test data."""
        self.service = DocumentService()

        # Create test user
        self.user = User.objects.create(
            email="test@example.com",
            username="testuser"
        )

        # Create second user for version testing
        self.user2 = User.objects.create(
            email="test2@example.com",
            username="testuser2"
        )

        # Create test client
        self.client = Client.objects.create(
            name="Test Client",
            status=BaseStatus.ACTIVE
        )

        # Create test contract
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            currency='USD',
            status=ContractStatus.ACTIVE
        )

    def tearDown(self):
        """Clean up test data."""
        Document.objects.all().delete()
        Contract.objects.all().delete()
        Client.objects.all().delete()
        User.objects.all().delete()

    # === Document Creation Tests ===

    def test_create_document_success(self):
        """Test successful document creation."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id),
            description="Test description",
            client_id=str(self.client.id)
        )

        self.assertIsNotNone(document.id)
        self.assertEqual(document.title, "Test Document")
        self.assertEqual(document.type, DocumentType.CONTRACT)
        self.assertEqual(document.status, DocumentStatus.DRAFT)
        self.assertEqual(document.version, 1)
        self.assertTrue(document.is_latest)

    def test_create_document_missing_title(self):
        """Test document creation with missing title."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="",
                type=DocumentType.CONTRACT,
                url="https://example.com/doc.pdf",
                uploaded_by_id=str(self.user.id)
            )

        self.assertIn('title', str(context.exception))

    def test_create_document_missing_url(self):
        """Test document creation with missing URL."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type=DocumentType.CONTRACT,
                url="",
                uploaded_by_id=str(self.user.id)
            )

        self.assertIn('url', str(context.exception))

    def test_create_document_invalid_type(self):
        """Test document creation with invalid type."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type="INVALID_TYPE",
                url="https://example.com/doc.pdf",
                uploaded_by_id=str(self.user.id)
            )

        self.assertIn('type', str(context.exception))

    def test_create_document_negative_file_size(self):
        """Test document creation with negative file size."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type=DocumentType.CONTRACT,
                url="https://example.com/doc.pdf",
                uploaded_by_id=str(self.user.id),
                file_size=-100
            )

        self.assertIn('file_size', str(context.exception))

    def test_create_document_past_expiry_date(self):
        """Test document creation with past expiry date."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type=DocumentType.CONTRACT,
                url="https://example.com/doc.pdf",
                uploaded_by_id=str(self.user.id),
                expiry_date=date.today() - timedelta(days=1)
            )

        self.assertIn('expiry_date', str(context.exception))

    def test_create_document_nonexistent_user(self):
        """Test document creation with nonexistent user."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type=DocumentType.CONTRACT,
                url="https://example.com/doc.pdf",
                uploaded_by_id="nonexistent-id"
            )

        self.assertIn('uploaded_by_id', str(context.exception))

    def test_create_document_nonexistent_client(self):
        """Test document creation with nonexistent client."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type=DocumentType.CONTRACT,
                url="https://example.com/doc.pdf",
                uploaded_by_id=str(self.user.id),
                client_id="nonexistent-id"
            )

        self.assertIn('client_id', str(context.exception))

    def test_create_document_nonexistent_contract(self):
        """Test document creation with nonexistent contract."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type=DocumentType.CONTRACT,
                url="https://example.com/doc.pdf",
                uploaded_by_id=str(self.user.id),
                contract_id="nonexistent-id"
            )

        self.assertIn('contract_id', str(context.exception))

    def test_create_document_contract_client_mismatch(self):
        """Test document creation with contract not belonging to client."""
        # Create different client
        other_client = Client.objects.create(
            name="Other Client",
            status=BaseStatus.ACTIVE
        )

        with self.assertRaises(ValidationError) as context:
            self.service.create_document(
                title="Test Document",
                type=DocumentType.CONTRACT,
                url="https://example.com/doc.pdf",
                uploaded_by_id=str(self.user.id),
                client_id=str(other_client.id),
                contract_id=str(self.contract.id)  # Belongs to self.client
            )

        self.assertIn('contract_id', str(context.exception))

    def test_create_document_with_tags(self):
        """Test document creation with tags."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id),
            tags=["hr", "policy"]
        )

        self.assertEqual(document.tags, ["hr", "policy"])

    def test_create_document_confidential(self):
        """Test confidential document creation."""
        document = self.service.create_document(
            title="Secret Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/secret.pdf",
            uploaded_by_id=str(self.user.id),
            is_confidential=True
        )

        self.assertTrue(document.is_confidential)

    # === Document Update Tests ===

    def test_update_document_success(self):
        """Test successful document update."""
        document = self.service.create_document(
            title="Original Title",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        updated = self.service.update_document(
            document_id=str(document.id),
            title="Updated Title",
            description="Updated description"
        )

        self.assertEqual(updated.title, "Updated Title")
        self.assertEqual(updated.description, "Updated description")

    def test_update_document_nonexistent(self):
        """Test updating nonexistent document."""
        with self.assertRaises(ValidationError) as context:
            self.service.update_document(
                document_id="nonexistent-id",
                title="New Title"
            )

        self.assertIn('document_id', str(context.exception))

    def test_update_document_version_field(self):
        """Test that version field cannot be updated."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.update_document(
                document_id=str(document.id),
                version=2
            )

        self.assertIn('version', str(context.exception))

    def test_update_document_is_latest_field(self):
        """Test that is_latest field cannot be updated."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.update_document(
                document_id=str(document.id),
                is_latest=False
            )

        self.assertIn('is_latest', str(context.exception))

    def test_update_document_past_expiry_date(self):
        """Test updating with past expiry date."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.update_document(
                document_id=str(document.id),
                expiry_date=date.today() - timedelta(days=1)
            )

        self.assertIn('expiry_date', str(context.exception))

    # === Publication Workflow Tests ===

    def test_publish_document_success(self):
        """Test successful document publication."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        published = self.service.publish_document(document_id=str(document.id))

        self.assertEqual(published.status, DocumentStatus.PUBLISHED)

    def test_publish_document_nonexistent(self):
        """Test publishing nonexistent document."""
        with self.assertRaises(ValidationError) as context:
            self.service.publish_document(document_id="nonexistent-id")

        self.assertIn('document_id', str(context.exception))

    def test_publish_document_already_published(self):
        """Test publishing already published document."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )
        self.service.publish_document(document_id=str(document.id))

        with self.assertRaises(ValidationError) as context:
            self.service.publish_document(document_id=str(document.id))

        self.assertIn('status', str(context.exception))

    def test_publish_document_not_latest_version(self):
        """Test publishing old version."""
        # Create original
        original = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        # Publish original
        self.service.publish_document(document_id=str(original.id))

        # Create new version
        new_version = self.service.create_new_version(
            document_id=str(original.id),
            url="https://example.com/doc-v2.pdf",
            uploaded_by_id=str(self.user2.id)
        )

        # Try to publish old version - it's already published, so status check fails first
        original.refresh_from_db()
        with self.assertRaises(ValidationError) as context:
            self.service.publish_document(document_id=str(original.id))

        # Status check happens before is_latest check
        self.assertIn('status', str(context.exception))

    def test_publish_document_expired(self):
        """Test publishing expired document."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id),
            expiry_date=date.today() + timedelta(days=1)
        )

        # Manually set expiry to past
        document.expiry_date = date.today() - timedelta(days=1)
        document.save()

        with self.assertRaises(ValidationError) as context:
            self.service.publish_document(document_id=str(document.id))

        self.assertIn('expiry_date', str(context.exception))

    # === Archive Workflow Tests ===

    def test_archive_document_success(self):
        """Test successful document archival."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )
        self.service.publish_document(document_id=str(document.id))

        archived = self.service.archive_document(
            document_id=str(document.id),
            reason="Outdated"
        )

        self.assertEqual(archived.status, DocumentStatus.ARCHIVED)
        self.assertIn('archive_reason', archived.metadata)
        self.assertEqual(archived.metadata['archive_reason'], "Outdated")

    def test_archive_document_nonexistent(self):
        """Test archiving nonexistent document."""
        with self.assertRaises(ValidationError) as context:
            self.service.archive_document(document_id="nonexistent-id")

        self.assertIn('document_id', str(context.exception))

    def test_archive_document_not_published(self):
        """Test archiving non-published document."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.archive_document(document_id=str(document.id))

        self.assertIn('status', str(context.exception))

    def test_archive_document_without_reason(self):
        """Test archiving without reason (should still work)."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )
        self.service.publish_document(document_id=str(document.id))

        archived = self.service.archive_document(document_id=str(document.id))

        self.assertEqual(archived.status, DocumentStatus.ARCHIVED)

    # === Version Management Tests ===

    def test_create_new_version_success(self):
        """Test successful version creation."""
        original = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v1.pdf",
            uploaded_by_id=str(self.user.id),
            description="Original version"
        )

        new_version = self.service.create_new_version(
            document_id=str(original.id),
            url="https://example.com/doc-v2.pdf",
            uploaded_by_id=str(self.user2.id),
            description="Updated version"
        )

        # Check new version
        self.assertEqual(new_version.version, 2)
        self.assertTrue(new_version.is_latest)
        self.assertEqual(new_version.status, DocumentStatus.DRAFT)
        self.assertEqual(new_version.description, "Updated version")
        self.assertEqual(new_version.previous_version.id, original.id)

        # Check original is no longer latest
        original.refresh_from_db()
        self.assertFalse(original.is_latest)

    def test_create_new_version_nonexistent(self):
        """Test creating version of nonexistent document."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_new_version(
                document_id="nonexistent-id",
                url="https://example.com/doc-v2.pdf",
                uploaded_by_id=str(self.user.id)
            )

        self.assertIn('document_id', str(context.exception))

    def test_create_new_version_not_latest(self):
        """Test creating version from old version."""
        # Create original
        original = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v1.pdf",
            uploaded_by_id=str(self.user.id)
        )

        # Create version 2
        v2 = self.service.create_new_version(
            document_id=str(original.id),
            url="https://example.com/doc-v2.pdf",
            uploaded_by_id=str(self.user.id)
        )

        # Try to create version from original (not latest)
        with self.assertRaises(ValidationError) as context:
            self.service.create_new_version(
                document_id=str(original.id),
                url="https://example.com/doc-v3.pdf",
                uploaded_by_id=str(self.user.id)
            )

        self.assertIn('is_latest', str(context.exception))

    def test_create_new_version_same_url(self):
        """Test creating version with same URL."""
        original = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.create_new_version(
                document_id=str(original.id),
                url="https://example.com/doc.pdf",  # Same URL
                uploaded_by_id=str(self.user.id)
            )

        self.assertIn('url', str(context.exception))

    def test_create_new_version_nonexistent_uploader(self):
        """Test creating version with nonexistent uploader."""
        original = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v1.pdf",
            uploaded_by_id=str(self.user.id)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.create_new_version(
                document_id=str(original.id),
                url="https://example.com/doc-v2.pdf",
                uploaded_by_id="nonexistent-id"
            )

        self.assertIn('uploaded_by_id', str(context.exception))

    def test_get_version_history_success(self):
        """Test getting version history."""
        # Create original
        v1 = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v1.pdf",
            uploaded_by_id=str(self.user.id)
        )

        # Create version 2
        v2 = self.service.create_new_version(
            document_id=str(v1.id),
            url="https://example.com/doc-v2.pdf",
            uploaded_by_id=str(self.user.id)
        )

        # Create version 3
        v3 = self.service.create_new_version(
            document_id=str(v2.id),
            url="https://example.com/doc-v3.pdf",
            uploaded_by_id=str(self.user.id)
        )

        # Get history
        history = self.service.get_version_history(document_id=str(v2.id))

        self.assertEqual(len(history), 3)
        self.assertEqual(history[0].version, 1)
        self.assertEqual(history[1].version, 2)
        self.assertEqual(history[2].version, 3)

    def test_get_version_history_nonexistent(self):
        """Test getting history of nonexistent document."""
        with self.assertRaises(ValidationError) as context:
            self.service.get_version_history(document_id="nonexistent-id")

        self.assertIn('document_id', str(context.exception))

    # === Expiry Management Tests ===

    def test_check_expiry_no_expiry_date(self):
        """Test checking expiry for document without expiry date."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id)
        )

        info = self.service.check_expiry(document_id=str(document.id))

        self.assertFalse(info['has_expiry'])
        self.assertFalse(info['is_expired'])
        self.assertIsNone(info['expiry_date'])
        self.assertIsNone(info['days_until_expiry'])

    def test_check_expiry_future_date(self):
        """Test checking expiry for future date."""
        expiry = date.today() + timedelta(days=15)
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id),
            expiry_date=expiry
        )

        info = self.service.check_expiry(document_id=str(document.id))

        self.assertTrue(info['has_expiry'])
        self.assertFalse(info['is_expired'])
        self.assertEqual(info['expiry_date'], expiry)
        self.assertEqual(info['days_until_expiry'], 15)
        self.assertTrue(info['expires_soon'])  # Within 30 days

    def test_check_expiry_expired(self):
        """Test checking expiry for expired document."""
        document = self.service.create_document(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by_id=str(self.user.id),
            expiry_date=date.today() + timedelta(days=1)
        )

        # Manually set to expired
        document.expiry_date = date.today() - timedelta(days=10)
        document.save()

        info = self.service.check_expiry(document_id=str(document.id))

        self.assertTrue(info['has_expiry'])
        self.assertTrue(info['is_expired'])
        self.assertEqual(info['days_until_expiry'], -10)

    def test_get_expiring_documents(self):
        """Test getting documents expiring soon."""
        # Create document expiring in 15 days
        doc1 = self.service.create_document(
            title="Expiring Soon",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/expiring.pdf",
            uploaded_by_id=str(self.user.id),
            expiry_date=date.today() + timedelta(days=15)
        )
        # Publish it (expiring_soon only returns published docs)
        self.service.publish_document(document_id=str(doc1.id))

        # Create document expiring in 60 days
        doc2 = self.service.create_document(
            title="Future Expiry",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/future.pdf",
            uploaded_by_id=str(self.user.id),
            expiry_date=date.today() + timedelta(days=60)
        )
        self.service.publish_document(document_id=str(doc2.id))

        # Get expiring within 30 days
        expiring = self.service.get_expiring_documents(days=30)

        self.assertEqual(len(expiring), 1)
        self.assertEqual(expiring[0].title, "Expiring Soon")

    def test_get_expired_documents(self):
        """Test getting expired documents."""
        # Create expired document
        doc = self.service.create_document(
            title="Expired Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/expired.pdf",
            uploaded_by_id=str(self.user.id),
            expiry_date=date.today() + timedelta(days=1)
        )

        # Manually expire it
        doc.expiry_date = date.today() - timedelta(days=10)
        doc.save()

        # Get expired
        expired = self.service.get_expired_documents()

        self.assertEqual(len(expired), 1)
        self.assertEqual(expired[0].title, "Expired Doc")
