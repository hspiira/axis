"""Tests for document permission classes."""
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from unittest.mock import Mock

from apps.authentication.models import User
from apps.authentication.models.role import Role, Permission, UserRole, RolePermission
from axis_backend.permissions.base import CanManageDocuments


class CanManageDocumentsTestCase(TestCase):
    """Test suite for CanManageDocuments permission class."""

    def setUp(self):
        """Set up test fixtures."""
        self.factory = APIRequestFactory()
        self.permission = CanManageDocuments()
        
        # Create test users
        self.superuser = User.objects.create_superuser(
            email='super@example.com',
            password='testpass123'
        )
        
        self.staff_user = User.objects.create_user(
            email='staff@example.com',
            password='testpass123',
            is_staff=True
        )
        
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            password='testpass123'
        )
        
        # Create roles and permissions
        self.doc_permission = Permission.objects.create(
            name='manage_documents',
            description='Can manage documents'
        )
        
        self.doc_manager_role = Role.objects.create(
            name='document_manager',
            description='Document manager role'
        )
        RolePermission.objects.create(
            role=self.doc_manager_role,
            permission=self.doc_permission
        )
        
        # Create user with document_manager role
        self.doc_manager_user = User.objects.create_user(
            email='docmanager@example.com',
            password='testpass123'
        )
        UserRole.objects.create(
            user=self.doc_manager_user,
            role=self.doc_manager_role
        )
        
        # Mock view
        self.view = Mock()
        self.view.action = 'list'

    def test_has_permission_unauthenticated_denied(self):
        """Unauthenticated requests are denied."""
        request = self.factory.get('/api/documents/')
        request.user = None
        
        result = self.permission.has_permission(request, self.view)
        self.assertFalse(result)

    def test_has_permission_superuser_allowed(self):
        """Superusers bypass all checks."""
        request = self.factory.get('/api/documents/')
        request.user = self.superuser
        
        result = self.permission.has_permission(request, self.view)
        self.assertTrue(result)

    def test_has_permission_staff_user_allowed(self):
        """Staff users are allowed."""
        request = self.factory.get('/api/documents/')
        request.user = self.staff_user
        
        result = self.permission.has_permission(request, self.view)
        self.assertTrue(result)

    def test_has_permission_user_with_role_allowed(self):
        """Users with manage_documents permission are allowed."""
        request = self.factory.get('/api/documents/')
        request.user = self.doc_manager_user
        
        result = self.permission.has_permission(request, self.view)
        self.assertTrue(result)

    def test_has_permission_regular_user_denied(self):
        """Regular users without permissions are denied."""
        request = self.factory.get('/api/documents/')
        request.user = self.regular_user
        
        result = self.permission.has_permission(request, self.view)
        self.assertFalse(result)

    def test_has_permission_client_context_header_authorized(self):
        """User authorized for client in header."""
        # Setup: user authorized for client-123
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.get('/api/documents/')
        request.user = self.doc_manager_user
        request.META['HTTP_X_CLIENT_ID'] = 'client-123'
        
        result = self.permission.has_permission(request, self.view)
        self.assertTrue(result)

    def test_has_permission_client_context_header_unauthorized(self):
        """User NOT authorized for client in header."""
        # Setup: user authorized for client-123 only
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.get('/api/documents/')
        request.user = self.doc_manager_user
        request.META['HTTP_X_CLIENT_ID'] = 'client-456'
        
        result = self.permission.has_permission(request, self.view)
        self.assertFalse(result)

    def test_has_permission_client_context_query_param(self):
        """Client context from query parameter."""
        self.doc_manager_user.metadata = {'authorized_clients': ['client-789']}
        self.doc_manager_user.save()
        
        request = self.factory.get('/api/documents/?client_id=client-789')
        request.user = self.doc_manager_user
        
        result = self.permission.has_permission(request, self.view)
        self.assertTrue(result)

    def test_has_object_permission_superuser_allowed(self):
        """Superuser can access any document."""
        request = self.factory.get('/api/documents/1/')
        request.user = self.superuser
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_has_object_permission_authorized_client(self):
        """User authorized for document's client."""
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.get('/api/documents/1/')
        request.user = self.doc_manager_user
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_has_object_permission_unauthorized_client(self):
        """User NOT authorized for document's client."""
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.get('/api/documents/1/')
        request.user = self.doc_manager_user
        
        mock_document = Mock()
        mock_document.client_id = 'client-456'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertFalse(result)

    def test_has_object_permission_publish_action_requires_manager_role(self):
        """Publish action requires document_manager role."""
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.post('/api/documents/1/publish/')
        request.user = self.doc_manager_user
        
        self.view.action = 'publish'
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_has_object_permission_publish_without_manager_role_denied(self):
        """Publish action denied without document_manager role."""
        # Create user with only manage_documents permission, not document_manager role
        basic_role = Role.objects.create(name='basic_doc_access')
        RolePermission.objects.create(role=basic_role, permission=self.doc_permission)
        
        basic_user = User.objects.create_user(email='basic@example.com', password='test')
        UserRole.objects.create(user=basic_user, role=basic_role)
        basic_user.metadata = {'authorized_clients': ['client-123']}
        basic_user.save()
        
        request = self.factory.post('/api/documents/1/publish/')
        request.user = basic_user
        
        self.view.action = 'publish'
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertFalse(result)

    def test_has_object_permission_archive_action_requires_manager_role(self):
        """Archive action requires document_manager role."""
        self.view.action = 'archive'
        
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.post('/api/documents/1/archive/')
        request.user = self.doc_manager_user
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_has_object_permission_update_action_requires_manager_role(self):
        """Update action requires document_manager role."""
        self.view.action = 'update'
        
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.put('/api/documents/1/')
        request.user = self.doc_manager_user
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_has_object_permission_destroy_action_requires_manager_role(self):
        """Destroy action requires document_manager role."""
        self.view.action = 'destroy'
        
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.delete('/api/documents/1/')
        request.user = self.doc_manager_user
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_staff_user_bypasses_client_authorization(self):
        """Staff users can access documents for any client."""
        request = self.factory.get('/api/documents/1/')
        request.user = self.staff_user
        
        mock_document = Mock()
        mock_document.client_id = 'any-client-id'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_staff_user_bypasses_role_check_for_actions(self):
        """Staff users can perform any action without specific roles."""
        self.view.action = 'publish'
        
        request = self.factory.post('/api/documents/1/publish/')
        request.user = self.staff_user
        
        mock_document = Mock()
        mock_document.client_id = 'client-123'
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)

    def test_user_without_metadata_denied(self):
        """Users without metadata['authorized_clients'] are denied."""
        # doc_manager_user has role but no client authorization
        request = self.factory.get('/api/documents/')
        request.user = self.doc_manager_user
        request.META['HTTP_X_CLIENT_ID'] = 'client-123'
        
        result = self.permission.has_permission(request, self.view)
        self.assertFalse(result)

    def test_document_without_client_allowed(self):
        """Documents without client association are allowed."""
        self.doc_manager_user.metadata = {'authorized_clients': ['client-123']}
        self.doc_manager_user.save()
        
        request = self.factory.get('/api/documents/1/')
        request.user = self.doc_manager_user
        
        # Mock document without client
        mock_document = Mock()
        mock_document.client_id = None
        mock_document.client = None
        
        result = self.permission.has_object_permission(request, self.view, mock_document)
        self.assertTrue(result)
