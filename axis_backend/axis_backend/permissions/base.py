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

    Authorization Rules:
    - Superusers bypass all checks
    - Staff users (is_staff=True) have admin access
    - Users with 'admin' or 'manager' role via RBAC
    - Default deny if no authorization found
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

        # Staff users have admin access
        if request.user.is_staff:
            return True

        # Check if user has admin or manager role via RBAC
        return self._has_admin_or_manager_role(request.user)

    def _has_admin_or_manager_role(self, user) -> bool:
        """
        Check if user has admin or manager role assigned.

        Returns True if user has:
        - 'admin' role, OR
        - 'manager' role via RBAC
        """
        from apps.authentication.models.role import UserRole

        return UserRole.objects.filter(
            user=user,
            role__name__in=['admin', 'manager'],
            deleted_at__isnull=True
        ).exists()


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission for accessing own records or admin access.

    Use for operations where users can access their own data:
    - Viewing own profile
    - Updating own information
    - Viewing own family members

    Authorization Rules:
    - Superusers bypass all checks
    - Staff users have admin access to all objects
    - Users can access objects they own
    - Ownership determined by 'user', 'user_id', 'owner', or 'owner_id' attributes
    - Default deny if no ownership found
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

        # Staff users have admin access
        if request.user.is_staff:
            return True

        # Check if user owns the object
        return self._is_owner(request.user, obj)

    def _is_owner(self, user, obj) -> bool:
        """
        Check if user owns the object.

        Checks multiple common ownership patterns:
        - obj.user == user
        - obj.user_id == user.id
        - obj.owner == user
        - obj.owner_id == user.id
        - obj.created_by == user (for audit trails)

        Args:
            user: User instance
            obj: Object to check ownership

        Returns:
            True if user owns the object
        """
        # Check direct user relationship
        if hasattr(obj, 'user'):
            return obj.user == user if obj.user else False

        if hasattr(obj, 'user_id'):
            return obj.user_id == user.id

        # Check owner relationship
        if hasattr(obj, 'owner'):
            return obj.owner == user if obj.owner else False

        if hasattr(obj, 'owner_id'):
            return obj.owner_id == user.id

        # Check created_by (audit trail)
        if hasattr(obj, 'created_by'):
            return obj.created_by == user if obj.created_by else False

        if hasattr(obj, 'created_by_id'):
            return obj.created_by_id == user.id

        # Default deny if no ownership attribute found
        return False


class CanManagePersons(permissions.BasePermission):
    """
    Permission for HR/manager level person management.

    Use for operations that require HR or manager privileges:
    - Activating/deactivating persons
    - Updating employment status
    - Managing person records

    Authorization Rules:
    - Superusers bypass all checks
    - Staff users have access to all persons
    - Users with 'hr_manager' or 'manager' role via RBAC
    - For object-level: user must be authorized for person's client
    - Default deny if no authorization found
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

        # Staff users have access
        if request.user.is_staff:
            return True

        # Check if user has HR or manager role
        return self._has_hr_or_manager_role(request.user)

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

        # Staff users have access to all persons
        if request.user.is_staff:
            return True

        # Check if user has HR/manager role
        if not self._has_hr_or_manager_role(request.user):
            return False

        # Check if user is authorized for person's client
        person_client_id = self._get_person_client(obj)
        if person_client_id:
            return self._is_user_authorized_for_client(request.user, person_client_id)

        # If no client association, allow if user has role
        return True

    def _has_hr_or_manager_role(self, user) -> bool:
        """
        Check if user has HR manager or manager role.

        Returns True if user has:
        - 'hr_manager' role, OR
        - 'manager' role via RBAC
        """
        from apps.authentication.models.role import UserRole

        return UserRole.objects.filter(
            user=user,
            role__name__in=['hr_manager', 'manager'],
            deleted_at__isnull=True
        ).exists()

    def _get_person_client(self, person_obj) -> str | None:
        """
        Extract client ID from person object.

        Args:
            person_obj: Person instance

        Returns:
            Client ID string or None
        """
        if hasattr(person_obj, 'client_id'):
            return person_obj.client_id
        elif hasattr(person_obj, 'client'):
            return person_obj.client.id if person_obj.client else None

        return None

    def _is_user_authorized_for_client(self, user, client_id: str) -> bool:
        """
        Verify user is authorized to access specific client's persons.

        Args:
            user: User instance
            client_id: Client ID to check authorization for

        Returns:
            True if user authorized for client
        """
        if user.is_superuser or user.is_staff:
            return True

        # Check UserClient junction table for authorization
        from apps.authentication.models import UserClient
        return UserClient.objects.filter(
            user=user,
            client_id=client_id,
            deleted_at__isnull=True
        ).exists()


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
        Extract and validate client ID from request context.

        Checks in order:
        1. X-Client-ID header
        2. client_id query parameter

        Returns:
            Validated client ID string or None if not provided

        Raises:
            PermissionDenied: If client ID format is invalid or client doesn't exist
        """
        import re
        from rest_framework.exceptions import PermissionDenied

        # Check header first
        client_id = request.headers.get('X-Client-ID')

        # Check query parameter if header not found
        if not client_id:
            if hasattr(request, 'query_params'):
                client_id = request.query_params.get('client_id')
            else:
                client_id = request.GET.get('client_id')

        # If no client context provided, return None (not an error)
        if not client_id:
            return None

        # Validate client ID format (CUID: 25 alphanumeric characters)
        if not re.match(r'^[a-z0-9]{25}$', client_id):
            raise PermissionDenied("Invalid client ID format")

        # Verify client exists and is not deleted
        from apps.clients.models import Client
        if not Client.objects.filter(id=client_id, deleted_at__isnull=True).exists():
            raise PermissionDenied("Client not found or has been deleted")

        return client_id

    def _is_user_authorized_for_client(self, user, client_id: str) -> bool:
        """
        Verify user is authorized to access specific client's data.

        Authorization logic:
        - Superusers: always authorized
        - Staff users: authorized for all clients
        - Regular users: check UserClient junction table

        Args:
            user: User instance
            client_id: Client ID to check authorization for

        Returns:
            True if user authorized for client
        """
        if user.is_superuser or user.is_staff:
            return True

        # Check UserClient junction table for authorization
        from apps.authentication.models import UserClient
        return UserClient.objects.filter(
            user=user,
            client_id=client_id,
            deleted_at__isnull=True
        ).exists()

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
