"""Comprehensive tests for Document model."""
from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.documents.models import Document
from apps.authentication.models import User
from apps.clients.models import Client
from apps.contracts.models import Contract
from axis_backend.enums import DocumentType, DocumentStatus, BaseStatus, ContractStatus


class DocumentModelTestCase(TestCase):
    """Test Document model fields and basic functionality."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create(
            email="uploader@example.com",
            username="uploader"
        )
        self.client = Client.objects.create(
            name="Test Client",
            status=BaseStatus.ACTIVE
        )
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            billing_rate=1000,
            status=ContractStatus.ACTIVE
        )

    def tearDown(self):
        """Clean up test data."""
        Document.objects.all().delete()
        Contract.objects.all().delete()
        Client.objects.all().delete()
        User.objects.all().delete()

    def test_document_creation_with_required_fields(self):
        """Test creating document with only required fields."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://storage.example.com/doc.pdf"
        )
        self.assertIsNotNone(doc.id)
        self.assertEqual(doc.title, "Test Document")
        self.assertEqual(doc.type, DocumentType.CONTRACT)
        self.assertEqual(doc.url, "https://storage.example.com/doc.pdf")
        self.assertEqual(doc.version, 1)
        self.assertTrue(doc.is_latest)
        self.assertEqual(doc.status, DocumentStatus.DRAFT)

    def test_document_creation_with_all_fields(self):
        """Test creating document with all fields."""
        expiry = date.today() + timedelta(days=365)
        doc = Document.objects.create(
            title="Comprehensive Document",
            description="A test document with all fields",
            type=DocumentType.CONTRACT,
            url="https://storage.example.com/policy.pdf",
            file_size=1024000,
            file_type="application/pdf",
            version=1,
            is_latest=True,
            status=DocumentStatus.PUBLISHED,
            expiry_date=expiry,
            is_confidential=True,
            tags=["important", "confidential"],
            uploaded_by=self.user,
            client=self.client,
            contract=self.contract,
            metadata={"department": "Legal"}
        )
        self.assertEqual(doc.file_size, 1024000)
        self.assertEqual(doc.file_type, "application/pdf")
        self.assertTrue(doc.is_confidential)
        self.assertEqual(len(doc.tags), 2)
        self.assertEqual(doc.uploaded_by, self.user)
        self.assertEqual(doc.client, self.client)
        self.assertEqual(doc.contract, self.contract)

    def test_document_string_representation(self):
        """Test Document __str__ returns title with version."""
        doc = Document.objects.create(
            title="My Document",
            type=DocumentType.KPI_REPORT,
            url="https://example.com/doc.pdf",
            version=2
        )
        self.assertEqual(str(doc), "My Document (v2)")

    def test_document_repr(self):
        """Test Document __repr__."""
        doc = Document.objects.create(
            title="Test Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/form.pdf",
            version=3
        )
        self.assertEqual(repr(doc), "<Document: Test Doc v3>")

    def test_document_type_choices(self):
        """Test all DocumentType choices are valid."""
        types = [
            DocumentType.CONTRACT,
            DocumentType.CONTRACT,
            DocumentType.KPI_REPORT,
            DocumentType.CERTIFICATION,
            DocumentType.BILLING_REPORT,
            DocumentType.CERTIFICATION,
            DocumentType.OTHER
        ]
        for doc_type in types:
            doc = Document.objects.create(
                title=f"Doc {doc_type}",
                type=doc_type,
                url="https://example.com/doc.pdf"
            )
            self.assertEqual(doc.type, doc_type)

    def test_document_status_choices(self):
        """Test all DocumentStatus choices are valid."""
        statuses = [
            DocumentStatus.DRAFT,
            DocumentStatus.PUBLISHED,
            DocumentStatus.ARCHIVED
        ]
        for status in statuses:
            doc = Document.objects.create(
                title=f"Doc {status}",
                type=DocumentType.OTHER,
                url="https://example.com/doc.pdf",
                status=status
            )
            self.assertEqual(doc.status, status)

    def test_file_size_positive_validator(self):
        """Test file_size must be non-negative."""
        doc = Document(
            title="Test",
            type=DocumentType.OTHER,
            url="https://example.com/doc.pdf",
            file_size=-1
        )
        with self.assertRaises(ValidationError):
            doc.full_clean()

    def test_version_minimum_validator(self):
        """Test version must be at least 1."""
        doc = Document(
            title="Test",
            type=DocumentType.OTHER,
            url="https://example.com/doc.pdf",
            version=0
        )
        with self.assertRaises(ValidationError):
            doc.full_clean()

    def test_tags_default_to_list(self):
        """Test tags default to empty list."""
        doc = Document.objects.create(
            title="Test",
            type=DocumentType.OTHER,
            url="https://example.com/doc.pdf"
        )
        self.assertEqual(doc.tags, [])

    def test_metadata_default_to_dict(self):
        """Test metadata defaults to empty dict."""
        doc = Document.objects.create(
            title="Test",
            type=DocumentType.OTHER,
            url="https://example.com/doc.pdf"
        )
        self.assertEqual(doc.metadata, {})


class DocumentPropertiesTestCase(TestCase):
    """Test Document model properties."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create(
            email="test@example.com",
            username="test"
        )

    def tearDown(self):
        """Clean up test data."""
        Document.objects.all().delete()
        User.objects.all().delete()

    def test_is_expired_with_future_date(self):
        """Test is_expired returns False for future expiry."""
        doc = Document.objects.create(
            title="Future Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/cert.pdf",
            expiry_date=date.today() + timedelta(days=30)
        )
        self.assertFalse(doc.is_expired)

    def test_is_expired_with_past_date(self):
        """Test is_expired returns True for past expiry."""
        doc = Document.objects.create(
            title="Expired Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/cert.pdf",
            expiry_date=date.today() - timedelta(days=1)
        )
        self.assertTrue(doc.is_expired)

    def test_is_expired_with_no_expiry(self):
        """Test is_expired returns False when no expiry set."""
        doc = Document.objects.create(
            title="No Expiry",
            type=DocumentType.CONTRACT,
            url="https://example.com/policy.pdf"
        )
        self.assertFalse(doc.is_expired)

    def test_is_active_published_latest_not_expired(self):
        """Test is_active returns True for active document."""
        doc = Document.objects.create(
            title="Active Doc",
            type=DocumentType.KPI_REPORT,
            url="https://example.com/report.pdf",
            status=DocumentStatus.PUBLISHED,
            is_latest=True,
            expiry_date=date.today() + timedelta(days=365)
        )
        self.assertTrue(doc.is_active)

    def test_is_active_draft_status(self):
        """Test is_active returns False for draft."""
        doc = Document.objects.create(
            title="Draft Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/form.pdf",
            status=DocumentStatus.DRAFT,
            is_latest=True
        )
        self.assertFalse(doc.is_active)

    def test_is_active_not_latest(self):
        """Test is_active returns False for old version."""
        doc = Document.objects.create(
            title="Old Version",
            type=DocumentType.CONTRACT,
            url="https://example.com/policy_v1.pdf",
            status=DocumentStatus.PUBLISHED,
            is_latest=False
        )
        self.assertFalse(doc.is_active)

    def test_is_active_expired(self):
        """Test is_active returns False for expired document."""
        doc = Document.objects.create(
            title="Expired Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/cert.pdf",
            status=DocumentStatus.PUBLISHED,
            is_latest=True,
            expiry_date=date.today() - timedelta(days=1)
        )
        self.assertFalse(doc.is_active)


class DocumentMethodsTestCase(TestCase):
    """Test Document model methods."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create(
            email="test@example.com",
            username="test"
        )

    def tearDown(self):
        """Clean up test data."""
        Document.objects.all().delete()
        User.objects.all().delete()

    def test_publish_method(self):
        """Test publish method updates status."""
        doc = Document.objects.create(
            title="Draft Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/policy.pdf",
            status=DocumentStatus.DRAFT
        )
        doc.publish()
        doc.refresh_from_db()
        self.assertEqual(doc.status, DocumentStatus.PUBLISHED)

    def test_archive_method(self):
        """Test archive method updates status."""
        doc = Document.objects.create(
            title="Published Doc",
            type=DocumentType.KPI_REPORT,
            url="https://example.com/report.pdf",
            status=DocumentStatus.PUBLISHED
        )
        doc.archive()
        doc.refresh_from_db()
        self.assertEqual(doc.status, DocumentStatus.ARCHIVED)

    def test_create_new_version(self):
        """Test creating a new version of document."""
        v1 = Document.objects.create(
            title="My Document",
            description="Version 1",
            type=DocumentType.CONTRACT,
            url="https://example.com/v1.pdf",
            version=1,
            is_latest=True,
            status=DocumentStatus.PUBLISHED,
            is_confidential=True,
            tags=["important"],
            uploaded_by=self.user
        )

        v2 = v1.create_new_version(
            url="https://example.com/v2.pdf",
            uploaded_by=self.user
        )

        # Check v1 is no longer latest
        v1.refresh_from_db()
        self.assertFalse(v1.is_latest)

        # Check v2 properties
        self.assertEqual(v2.version, 2)
        self.assertTrue(v2.is_latest)
        self.assertEqual(v2.previous_version, v1)
        self.assertEqual(v2.status, DocumentStatus.DRAFT)
        self.assertEqual(v2.title, v1.title)
        self.assertEqual(v2.description, v1.description)
        self.assertEqual(v2.type, v1.type)
        self.assertTrue(v2.is_confidential)
        self.assertEqual(v2.tags, ["important"])
        self.assertEqual(v2.uploaded_by, self.user)

    def test_get_version_history_single_version(self):
        """Test get_version_history for single version."""
        doc = Document.objects.create(
            title="Single Version",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/form.pdf"
        )
        history = doc.get_version_history()
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0], doc)

    def test_get_version_history_multiple_versions(self):
        """Test get_version_history for multiple versions."""
        v1 = Document.objects.create(
            title="Versioned Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/v1.pdf"
        )
        v2 = v1.create_new_version("https://example.com/v2.pdf")
        v3 = v2.create_new_version("https://example.com/v3.pdf")

        # Get history from any version
        history_from_v1 = v1.get_version_history()
        history_from_v2 = v2.get_version_history()
        history_from_v3 = v3.get_version_history()

        # All should return same 3 versions
        self.assertEqual(len(history_from_v1), 3)
        self.assertEqual(len(history_from_v2), 3)
        self.assertEqual(len(history_from_v3), 3)

        # Check version order
        self.assertEqual(history_from_v3[0].version, 1)
        self.assertEqual(history_from_v3[1].version, 2)
        self.assertEqual(history_from_v3[2].version, 3)


class DocumentRelationshipsTestCase(TestCase):
    """Test Document model relationships."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create(
            email="uploader@example.com",
            username="uploader"
        )
        self.client = Client.objects.create(
            name="Test Client",
            status=BaseStatus.ACTIVE
        )
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            billing_rate=1000,
            status=ContractStatus.ACTIVE
        )

    def tearDown(self):
        """Clean up test data."""
        Document.objects.all().delete()
        Contract.objects.all().delete()
        Client.objects.all().delete()
        User.objects.all().delete()

    def test_uploaded_by_relationship(self):
        """Test document -> user relationship."""
        doc = Document.objects.create(
            title="User's Document",
            type=DocumentType.KPI_REPORT,
            url="https://example.com/report.pdf",
            uploaded_by=self.user
        )
        self.assertEqual(doc.uploaded_by, self.user)

    def test_user_uploaded_documents_reverse(self):
        """Test user -> documents reverse relationship."""
        doc1 = Document.objects.create(
            title="Doc 1",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/doc1.pdf",
            uploaded_by=self.user
        )
        doc2 = Document.objects.create(
            title="Doc 2",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/doc2.pdf",
            uploaded_by=self.user
        )
        self.assertEqual(self.user.uploaded_documents.count(), 2)
        self.assertIn(doc1, self.user.uploaded_documents.all())
        self.assertIn(doc2, self.user.uploaded_documents.all())

    def test_client_relationship(self):
        """Test document -> client relationship."""
        doc = Document.objects.create(
            title="Client Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/contract.pdf",
            client=self.client
        )
        self.assertEqual(doc.client, self.client)

    def test_client_documents_reverse(self):
        """Test client -> documents reverse relationship."""
        doc1 = Document.objects.create(
            title="Client Doc 1",
            type=DocumentType.CONTRACT,
            url="https://example.com/policy.pdf",
            client=self.client
        )
        doc2 = Document.objects.create(
            title="Client Doc 2",
            type=DocumentType.KPI_REPORT,
            url="https://example.com/report.pdf",
            client=self.client
        )
        self.assertEqual(self.client.documents.count(), 2)
        self.assertIn(doc1, self.client.documents.all())

    def test_contract_relationship(self):
        """Test document -> contract relationship."""
        doc = Document.objects.create(
            title="Contract Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/contract.pdf",
            contract=self.contract
        )
        self.assertEqual(doc.contract, self.contract)

    def test_contract_documents_reverse(self):
        """Test contract -> documents reverse relationship."""
        doc = Document.objects.create(
            title="Contract Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/contract.pdf",
            contract=self.contract
        )
        self.assertIn(doc, self.contract.documents.all())

    def test_document_versioning_relationship(self):
        """Test document self-referential versioning."""
        v1 = Document.objects.create(
            title="Versioned",
            type=DocumentType.CONTRACT,
            url="https://example.com/v1.pdf"
        )
        v2 = v1.create_new_version("https://example.com/v2.pdf")

        # Check forward relationship
        self.assertEqual(v2.previous_version, v1)

        # Check reverse relationship
        self.assertIn(v2, v1.next_versions.all())

    def test_uploaded_by_set_null_on_delete(self):
        """Test uploaded_by is set to NULL when user deleted."""
        doc = Document.objects.create(
            title="Test",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/form.pdf",
            uploaded_by=self.user
        )
        self.user.delete()
        doc.refresh_from_db()
        self.assertIsNone(doc.uploaded_by)

    def test_client_cascade_on_delete(self):
        """Test document is deleted when client deleted."""
        doc = Document.objects.create(
            title="Client Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/contract.pdf",
            client=self.client
        )
        doc_id = doc.id
        # Delete contract first to avoid PROTECT error
        self.contract.delete()
        self.client.delete()
        self.assertFalse(Document.objects.filter(id=doc_id).exists())

    def test_contract_cascade_on_delete(self):
        """Test document is deleted when contract deleted."""
        doc = Document.objects.create(
            title="Contract Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/contract.pdf",
            contract=self.contract
        )
        doc_id = doc.id
        self.contract.delete()
        self.assertFalse(Document.objects.filter(id=doc_id).exists())


class DocumentSoftDeleteTestCase(TestCase):
    """Test Document soft delete functionality."""

    def setUp(self):
        """Set up test data."""
        self.doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/policy.pdf"
        )

    def tearDown(self):
        """Clean up test data."""
        Document.objects.all().delete()

    def test_soft_delete_sets_deleted_at(self):
        """Test soft_delete sets deleted_at timestamp."""
        self.assertIsNone(self.doc.deleted_at)
        self.doc.soft_delete()
        self.doc.refresh_from_db()
        self.assertIsNotNone(self.doc.deleted_at)

    def test_restore_clears_deleted_at(self):
        """Test restore clears deleted_at timestamp."""
        self.doc.soft_delete()
        self.doc.restore()
        self.doc.refresh_from_db()
        self.assertIsNone(self.doc.deleted_at)
