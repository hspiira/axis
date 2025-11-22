"""Tests for Document API endpoints."""
import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal

from apps.documents.models import Document
from apps.authentication.models import User
from apps.clients.models import Client
from apps.contracts.models import Contract
from axis_backend.enums import DocumentType, DocumentStatus, BaseStatus, ContractStatus


@pytest.mark.django_db
class TestDocumentAPI(TestCase):
    """Test cases for Document API endpoints."""

    def setUp(self):
        """Set up test data and API client."""
        self.client_api = APIClient()

        # Create test user with authentication
        self.user = User.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="testpass123"
        )
        self.user.is_superuser = True
        self.user.save()

        # Authenticate client
        self.client_api.force_authenticate(user=self.user)

        # Create test client
        self.test_client = Client.objects.create(
            name="Test Client",
            status=BaseStatus.ACTIVE
        )

        # Create test contract
        self.contract = Contract.objects.create(
            client=self.test_client,
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

    # === List Endpoint Tests ===

    def test_list_documents(self):
        """Test GET /api/documents/ - List all documents."""
        # Create test documents
        Document.objects.create(
            title="Test Document 1",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc1.pdf",
            uploaded_by=self.user,
            client=self.test_client
        )
        Document.objects.create(
            title="Test Document 2",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/doc2.pdf",
            uploaded_by=self.user
        )

        response = self.client_api.get('/api/documents/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        self.assertEqual(response.data['count'], 2)

    def test_list_documents_with_pagination(self):
        """Test GET /api/documents/ with pagination."""
        # Create multiple documents
        for i in range(5):
            Document.objects.create(
                title=f"Document {i}",
                type=DocumentType.OTHER,
                url=f"https://example.com/doc{i}.pdf",
                uploaded_by=self.user
            )

        response = self.client_api.get('/api/documents/?page=1&page_size=2')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['page'], 1)
        self.assertEqual(response.data['page_size'], 2)

    def test_list_documents_with_type_filter(self):
        """Test GET /api/documents/ with type filter."""
        Document.objects.create(
            title="Contract Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/contract.pdf",
            uploaded_by=self.user
        )
        Document.objects.create(
            title="Cert Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/cert.pdf",
            uploaded_by=self.user
        )

        response = self.client_api.get(f'/api/documents/?type={DocumentType.CONTRACT}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['type'], DocumentType.CONTRACT)

    def test_list_documents_with_status_filter(self):
        """Test GET /api/documents/ with status filter."""
        doc = Document.objects.create(
            title="Published Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/published.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.PUBLISHED
        )

        response = self.client_api.get(f'/api/documents/?status={DocumentStatus.PUBLISHED}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['status'], DocumentStatus.PUBLISHED)

    def test_list_documents_with_search(self):
        """Test GET /api/documents/ with search."""
        Document.objects.create(
            title="Important Contract",
            description="Very important document",
            type=DocumentType.CONTRACT,
            url="https://example.com/important.pdf",
            uploaded_by=self.user
        )

        response = self.client_api.get('/api/documents/?search=Important')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    # === Retrieve Endpoint Tests ===

    def test_retrieve_document(self):
        """Test GET /api/documents/{id}/ - Retrieve single document."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user,
            client=self.test_client,
            description="Test description"
        )

        response = self.client_api.get(f'/api/documents/{doc.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(doc.id))
        self.assertEqual(response.data['title'], "Test Document")
        self.assertEqual(response.data['description'], "Test description")

    def test_retrieve_document_not_found(self):
        """Test GET /api/documents/{id}/ with invalid ID."""
        response = self.client_api.get('/api/documents/nonexistent-id/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # === Create Endpoint Tests ===

    def test_create_document(self):
        """Test POST /api/documents/ - Create new document."""
        data = {
            'title': 'New Document',
            'type': DocumentType.CONTRACT,
            'url': 'https://example.com/new.pdf',
            'uploaded_by_id': str(self.user.id),
            'description': 'New document description',
            'client_id': str(self.test_client.id)
        }

        response = self.client_api.post('/api/documents/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Document')
        self.assertEqual(response.data['type'], DocumentType.CONTRACT)
        self.assertEqual(response.data['status'], DocumentStatus.DRAFT)

    def test_create_document_missing_required_field(self):
        """Test POST /api/documents/ with missing required field."""
        data = {
            'type': DocumentType.CONTRACT,
            'url': 'https://example.com/new.pdf',
            'uploaded_by_id': str(self.user.id)
            # Missing title
        }

        response = self.client_api.post('/api/documents/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_document_invalid_type(self):
        """Test POST /api/documents/ with invalid type."""
        data = {
            'title': 'New Document',
            'type': 'INVALID_TYPE',
            'url': 'https://example.com/new.pdf',
            'uploaded_by_id': str(self.user.id)
        }

        response = self.client_api.post('/api/documents/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_document_with_tags(self):
        """Test POST /api/documents/ with tags."""
        data = {
            'title': 'Tagged Document',
            'type': DocumentType.CONTRACT,
            'url': 'https://example.com/tagged.pdf',
            'uploaded_by_id': str(self.user.id),
            'tags': ['hr', 'policy']
        }

        response = self.client_api.post('/api/documents/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tags'], ['hr', 'policy'])

    # === Update Endpoint Tests ===

    def test_update_document(self):
        """Test PUT /api/documents/{id}/ - Update document."""
        doc = Document.objects.create(
            title="Original Title",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user
        )

        data = {
            'title': 'Updated Title',
            'description': 'Updated description'
        }

        response = self.client_api.patch(f'/api/documents/{doc.id}/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
        self.assertEqual(response.data['description'], 'Updated description')

    def test_update_document_cannot_change_version(self):
        """Test PUT /api/documents/{id}/ cannot change version."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user
        )

        data = {
            'version': 2  # Attempt to change version
        }

        response = self.client_api.patch(f'/api/documents/{doc.id}/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # === Delete Endpoint Tests ===

    def test_delete_document(self):
        """Test DELETE /api/documents/{id}/ - Soft delete document."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user
        )

        response = self.client_api.delete(f'/api/documents/{doc.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify soft delete
        doc.refresh_from_db()
        self.assertIsNotNone(doc.deleted_at)

    # === Custom Action Tests ===

    def test_publish_document(self):
        """Test POST /api/documents/{id}/publish/ - Publish document."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.DRAFT
        )

        response = self.client_api.post(f'/api/documents/{doc.id}/publish/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], DocumentStatus.PUBLISHED)

    def test_publish_document_already_published(self):
        """Test POST /api/documents/{id}/publish/ on published document."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.PUBLISHED
        )

        response = self.client_api.post(f'/api/documents/{doc.id}/publish/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_archive_document(self):
        """Test POST /api/documents/{id}/archive/ - Archive document."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.PUBLISHED
        )

        data = {'reason': 'Outdated'}
        response = self.client_api.post(f'/api/documents/{doc.id}/archive/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], DocumentStatus.ARCHIVED)

    def test_archive_document_not_published(self):
        """Test POST /api/documents/{id}/archive/ on draft document."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.DRAFT
        )

        response = self.client_api.post(f'/api/documents/{doc.id}/archive/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_version(self):
        """Test POST /api/documents/{id}/create-version/ - Create new version."""
        original = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v1.pdf",
            uploaded_by=self.user
        )

        data = {
            'url': 'https://example.com/doc-v2.pdf',
            'uploaded_by_id': str(self.user.id),
            'description': 'Updated version'
        }

        response = self.client_api.post(f'/api/documents/{original.id}/create-version/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['version'], 2)
        self.assertEqual(response.data['description'], 'Updated version')
        self.assertTrue(response.data['is_latest'])

    def test_create_version_missing_url(self):
        """Test POST /api/documents/{id}/create-version/ with missing URL."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user
        )

        data = {
            'uploaded_by_id': str(self.user.id)
            # Missing url
        }

        response = self.client_api.post(f'/api/documents/{doc.id}/create-version/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_version_history(self):
        """Test GET /api/documents/{id}/version-history/ - Get version history."""
        # Create version chain
        v1 = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v1.pdf",
            uploaded_by=self.user,
            version=1,
            is_latest=False
        )

        v2 = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v2.pdf",
            uploaded_by=self.user,
            version=2,
            is_latest=True,
            previous_version=v1
        )

        response = self.client_api.get(f'/api/documents/{v2.id}/version-history/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['version'], 1)
        self.assertEqual(response.data[1]['version'], 2)

    def test_check_expiry(self):
        """Test GET /api/documents/{id}/check-expiry/ - Check expiry status."""
        doc = Document.objects.create(
            title="Test Document",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/doc.pdf",
            uploaded_by=self.user,
            expiry_date=date.today() + timedelta(days=15)
        )

        response = self.client_api.get(f'/api/documents/{doc.id}/check-expiry/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_expiry'])
        self.assertFalse(response.data['is_expired'])
        self.assertEqual(response.data['days_until_expiry'], 15)
        self.assertTrue(response.data['expires_soon'])

    def test_expiring_soon(self):
        """Test GET /api/documents/expiring-soon/ - Get expiring documents."""
        # Create expiring document
        doc = Document.objects.create(
            title="Expiring Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/expiring.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.PUBLISHED,
            expiry_date=date.today() + timedelta(days=15)
        )

        response = self.client_api.get('/api/documents/expiring-soon/?days=30')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_expired(self):
        """Test GET /api/documents/expired/ - Get expired documents."""
        # Create expired document
        doc = Document.objects.create(
            title="Expired Doc",
            type=DocumentType.CERTIFICATION,
            url="https://example.com/expired.pdf",
            uploaded_by=self.user,
            expiry_date=date.today() + timedelta(days=1)
        )
        # Manually expire it
        doc.expiry_date = date.today() - timedelta(days=10)
        doc.save()

        response = self.client_api.get('/api/documents/expired/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_published(self):
        """Test GET /api/documents/published/ - Get published documents."""
        Document.objects.create(
            title="Published Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/published.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.PUBLISHED
        )
        Document.objects.create(
            title="Draft Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/draft.pdf",
            uploaded_by=self.user,
            status=DocumentStatus.DRAFT
        )

        response = self.client_api.get('/api/documents/published/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return published documents
        for doc in response.data:
            self.assertEqual(doc['status'], DocumentStatus.PUBLISHED)

    def test_latest_versions(self):
        """Test GET /api/documents/latest-versions/ - Get latest versions."""
        # Create old version
        old = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v1.pdf",
            uploaded_by=self.user,
            version=1,
            is_latest=False
        )
        # Create latest version
        latest = Document.objects.create(
            title="Test Document",
            type=DocumentType.CONTRACT,
            url="https://example.com/doc-v2.pdf",
            uploaded_by=self.user,
            version=2,
            is_latest=True,
            previous_version=old
        )

        response = self.client_api.get('/api/documents/latest-versions/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return latest versions
        for doc in response.data:
            self.assertTrue(doc['is_latest'])

    def test_confidential(self):
        """Test GET /api/documents/confidential/ - Get confidential documents."""
        Document.objects.create(
            title="Secret Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/secret.pdf",
            uploaded_by=self.user,
            is_confidential=True
        )
        Document.objects.create(
            title="Public Doc",
            type=DocumentType.CONTRACT,
            url="https://example.com/public.pdf",
            uploaded_by=self.user,
            is_confidential=False
        )

        response = self.client_api.get('/api/documents/confidential/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return confidential documents
        for doc in response.data:
            self.assertTrue(doc['is_confidential'])
