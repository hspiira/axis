"""Custom permission classes for API access control."""
from rest_framework import permissions
from typing import Any


class IsAdminOrManager(permissions.BasePermission):
    """
    Permission for admin or manager level access.

    Use for operations that require elevated privileges:
    - Creating employees/dependents
    - Bulk operations
    - System-wide queries
    """

    def has_permission(self, request, view) -> bool:
        """
        Check if user has admin or manager role.

        Args:
            request: HTTP request
            view: View being accessed

        Returns:
            True if user is admin or manager
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Superuser has all permissions
        if request.user.is_superuser:
            return True

        # Check if user has admin or manager role
        # TODO: Implement role checking once User/Profile models are complete
        # For now, allow authenticated users (will be restricted later)
        return True


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission for accessing own records or admin access.

    Use for operations where users can access their own data:
    - Viewing own profile
    - Updating own information
    - Viewing own family members
    """

    def has_permission(self, request, view) -> bool:
        """
        Check if user is authenticated.

        Args:
            request: HTTP request
            view: View being accessed

        Returns:
            True if user is authenticated
        """
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj: Any) -> bool:
        """
        Check if user owns the object or is admin.

        Args:
            request: HTTP request
            view: View being accessed
            obj: Object being accessed

        Returns:
            True if user owns object or is admin
        """
        # Superuser has all permissions
        if request.user.is_superuser:
            return True

        # Check if user owns the person record
        # TODO: Implement ownership checking once User/Profile relationship is complete
        # For now, allow authenticated users (will be restricted later)
        return True


class CanManagePersons(permissions.BasePermission):
    """
    Permission for HR/manager level person management.

    Use for operations that require HR or manager privileges:
    - Activating/deactivating persons
    - Updating employment status
    - Managing person records
    """

    def has_permission(self, request, view) -> bool:
        """
        Check if user has person management privileges.

        Args:
            request: HTTP request
            view: View being accessed

        Returns:
            True if user can manage persons
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Superuser has all permissions
        if request.user.is_superuser:
            return True

        # Check if user has HR or manager role
        # TODO: Implement role checking once User/Profile models are complete
        # For now, allow authenticated users (will be restricted later)
        return True

    def has_object_permission(self, request, view, obj: Any) -> bool:
        """
        Check if user can manage specific person.

        Args:
            request: HTTP request
            view: View being accessed
            obj: Person object being accessed

        Returns:
            True if user can manage this person
        """
        # Superuser has all permissions
        if request.user.is_superuser:
            return True

        # Check if user is HR/manager for person's client
        # TODO: Implement client-based authorization once relationships are complete
        # For now, allow authenticated users (will be restricted later)
        return True


class CanManageDocuments(permissions.BasePermission):
    """
    Permission for document management with role-based and client-scoped authorization.

    Authorization Rules:
    1. has_permission checks:
       - User must be authenticated
       - Superusers bypass all checks
       - User must have is_staff=True OR 'manage_documents' permission
       - If client context provided (header/query), verify user authorized for that client

    2. has_object_permission checks:
       - Verify user authorized for document's associated client
       - For state-changing actions (publish/archive/version), verify document_manager role
       - Default deny if checks fail

    Client Context Sources (in order of priority):
    - X-Client-ID header
    - client_id query parameter
    """

    DOCUMENT_MANAGER_ACTIONS = {'publish', 'archive', 'create_version', 'update', 'partial_update', 'destroy'}

    def has_permission(self, request, view) -> bool:
        """
        Check if user has document management privileges and client authorization.

        Args:
            request: HTTP request with user and optional client context
            view: View being accessed

        Returns:
            True if user authorized for document management
        """
        # 1. Authentication check
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Superuser bypass
        if request.user.is_superuser:
            return True

        # 3. Role/permission check - user must have at least one:
        #    - is_staff flag (Django admin access)
        #    - 'manage_documents' permission via RBAC
        has_role = self._has_document_role(request.user)
        if not has_role:
            return False

        # 4. Client context validation (if provided)
        client_id = self._get_client_context(request)
        if client_id:
            # If specific client requested, verify user authorized for it
            if not self._is_user_authorized_for_client(request.user, client_id):
                return False

        return True

    def has_object_permission(self, request, view, obj: Any) -> bool:
        """
        Check if user can manage specific document.

        Args:
            request: HTTP request with user
            view: View being accessed
            obj: Document object being accessed

        Returns:
            True if user authorized for this document
        """
        # 1. Superuser bypass
        if request.user.is_superuser:
            return True

        # 2. Verify document's client authorization
        # Assumes Document model has 'client' or 'owner' FK to Client
        document_client_id = self._get_document_client(obj)
        if document_client_id:
            if not self._is_user_authorized_for_client(request.user, document_client_id):
                return False

        # 3. For state-changing actions, require document_manager role
        action = view.action if hasattr(view, 'action') else None
        if action in self.DOCUMENT_MANAGER_ACTIONS:
            if not self._has_document_manager_role(request.user):
                return False

        return True

    # === Helper Methods ===

    def _has_document_role(self, user) -> bool:
        """
        Check if user has basic document management authorization.

        Returns True if user has:
        - is_staff flag, OR
        - 'manage_documents' permission via RBAC
        """
        if user.is_staff:
            return True

        # Check RBAC permission
        return self._has_permission_via_role(user, 'manage_documents')

    def _has_document_manager_role(self, user) -> bool:
        """
        Check if user has document_manager role for state-changing actions.

        Returns True if user has:
        - is_staff flag, OR
        - 'document_manager' role via RBAC
        """
        if user.is_staff:
            return True

        # Check if user has document_manager role assigned
        from apps.authentication.models.role import UserRole
        return UserRole.objects.filter(
            user=user,
            role__name='document_manager',
            deleted_at__isnull=True
        ).exists()

    def _has_permission_via_role(self, user, permission_name: str) -> bool:
        """
        Check if user has specific permission through their roles.

        Args:
            user: User instance
            permission_name: Permission name to check (e.g., 'manage_documents')

        Returns:
            True if user has permission via any assigned role
        """
        from apps.authentication.models.role import UserRole, Permission

        # Get all roles assigned to user
        user_role_ids = UserRole.objects.filter(
            user=user,
            deleted_at__isnull=True
        ).values_list('role_id', flat=True)

        if not user_role_ids:
            return False

        # Check if any role has the required permission
        return Permission.objects.filter(
            name=permission_name,
            roles__role_id__in=user_role_ids,
            deleted_at__isnull=True
        ).exists()

    def _get_client_context(self, request) -> str | None:
        """
        Extract client ID from request context.

        Checks in order:
        1. X-Client-ID header
        2. client_id query parameter

        Returns:
            Client ID string or None if not provided
        """
        # Check header first
        client_id = request.headers.get('X-Client-ID')
        if client_id:
            return client_id

        # Check query parameter (DRF Request has query_params, Django Request has GET)
        if hasattr(request, 'query_params'):
            client_id = request.query_params.get('client_id')
        else:
            client_id = request.GET.get('client_id')

        return client_id

    def _is_user_authorized_for_client(self, user, client_id: str) -> bool:
        """
        Verify user is authorized to access specific client's data.

        Authorization logic:
        - Superusers: always authorized
        - Staff users: authorized for all clients
        - Regular users: check client relationship via metadata

        Args:
            user: User instance
            client_id: Client ID to check authorization for

        Returns:
            True if user authorized for client
        """
        if user.is_superuser or user.is_staff:
            return True

        # Check metadata for authorized clients list
        # This can be customized based on your business model:
        # - User.metadata['authorized_clients'] list (current implementation)
        # - Separate UserClient junction table
        # - Through employment/contract relationships
        if user.metadata and 'authorized_clients' in user.metadata:
            return client_id in user.metadata['authorized_clients']

        # Default deny if no authorization found
        return False

    def _get_document_client(self, document_obj) -> str | None:
        """
        Extract client ID from document object.

        Args:
            document_obj: Document instance

        Returns:
            Client ID string or None
        """
        # Assumes Document has 'client' FK or 'owner' FK to Client
        if hasattr(document_obj, 'client_id'):
            return document_obj.client_id
        elif hasattr(document_obj, 'client'):
            return document_obj.client.id if document_obj.client else None
        elif hasattr(document_obj, 'owner_id'):
            return document_obj.owner_id
        elif hasattr(document_obj, 'owner'):
            return document_obj.owner.id if document_obj.owner else None

        return None


class IsReadOnly(permissions.BasePermission):
    """
    Permission for read-only access.

    Use for endpoints that should be read-only:
    - Public data
    - Reference data
    - Reports
    """

    def has_permission(self, request, view) -> bool:
        """
        Allow only safe methods (GET, HEAD, OPTIONS).

        Args:
            request: HTTP request
            view: View being accessed

        Returns:
            True if request method is safe
        """
        return request.method in permissions.SAFE_METHODS
