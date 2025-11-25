"""
Object-level permissions for Axis Backend.

Implements fine-grained access control at the object level,
ensuring users can only access resources within their authorized scope.
"""
from rest_framework import permissions
from apps.authentication.models import UserClient


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit an object.

    Read permissions are allowed to any authenticated user.
    Write permissions are only allowed to the owner of the object.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions are only allowed to the owner
        # Check multiple common owner fields
        owner_fields = ['user', 'owner', 'created_by', 'uploaded_by']

        for field in owner_fields:
            if hasattr(obj, field):
                owner = getattr(obj, field)
                if owner == request.user:
                    return True

        return False


class IsClientScopedOrAdmin(permissions.BasePermission):
    """
    Object-level permission enforcing client-scoped access.

    Users can only access objects belonging to clients they are authorized for.
    Admin and Manager roles have access to all clients.

    Checks:
    1. User has admin/manager role → grant access
    2. Object belongs to user's authorized client(s) → grant access
    3. Otherwise → deny access
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Ensure user is authenticated
        if not user or not user.is_authenticated:
            return False

        # Admin and managers have access to all objects
        if user.has_perm('can_manage_all_clients') or user.role in ['admin', 'manager']:
            return True

        # Extract client ID from object
        client_id = self._get_client_id(obj)
        if not client_id:
            # Object has no client association - allow access for now
            # (Could be changed to deny by default for stricter security)
            return True

        # Check if user is authorized for this client
        return UserClient.objects.filter(
            user=user,
            client_id=client_id,
            is_active=True
        ).exists()

    def _get_client_id(self, obj):
        """
        Extract client ID from object.

        Tries multiple common patterns:
        - obj.client_id (direct FK)
        - obj.client.id (FK relationship)
        - obj.person.client_id (nested FK)
        - obj.contract.client_id (nested FK)

        Returns:
            str: Client ID or None
        """
        # Direct client_id field
        if hasattr(obj, 'client_id'):
            return str(obj.client_id) if obj.client_id else None

        # Client FK relationship
        if hasattr(obj, 'client'):
            client = obj.client
            if client:
                return str(client.id if hasattr(client, 'id') else client)

        # Nested person.client relationship
        if hasattr(obj, 'person') and hasattr(obj.person, 'client'):
            person = obj.person
            if person and person.client:
                return str(person.client.id)

        # Nested contract.client relationship
        if hasattr(obj, 'contract') and hasattr(obj.contract, 'client'):
            contract = obj.contract
            if contract and contract.client:
                return str(contract.client.id)

        return None


class IsConfidentialAllowed(permissions.BasePermission):
    """
    Object-level permission for confidential documents.

    Only admins, managers, and document owners can access confidential documents.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Ensure user is authenticated
        if not user or not user.is_authenticated:
            return False

        # Check if object is confidential (documents)
        is_confidential = getattr(obj, 'is_confidential', False)
        if not is_confidential:
            # Not confidential - allow access
            return True

        # Admin and managers have access to confidential documents
        if user.role in ['admin', 'manager']:
            return True

        # Owner/uploader has access to their confidential documents
        if hasattr(obj, 'uploaded_by') and obj.uploaded_by == user:
            return True

        if hasattr(obj, 'created_by') and obj.created_by == user:
            return True

        # Otherwise deny access to confidential documents
        return False


class CanModifyObject(permissions.BasePermission):
    """
    Object-level permission for modification operations.

    Combines ownership and client-scoped checks for write operations.

    Allows modification if:
    1. User is admin/manager
    2. User is the owner/creator
    3. User has manage permissions for the client

    For read operations, uses IsClientScopedOrAdmin logic.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Ensure user is authenticated
        if not user or not user.is_authenticated:
            return False

        # Read operations - use client-scoped check
        if request.method in permissions.SAFE_METHODS:
            # Delegate to IsClientScopedOrAdmin
            client_scoped = IsClientScopedOrAdmin()
            return client_scoped.has_object_permission(request, view, obj)

        # Write operations - stricter checks
        # Admin and managers can modify anything
        if user.role in ['admin', 'manager']:
            return True

        # Check ownership
        owner_fields = ['user', 'owner', 'created_by', 'uploaded_by']
        for field in owner_fields:
            if hasattr(obj, field):
                owner = getattr(obj, field)
                if owner == user:
                    return True

        # Check if user has manage permissions for this client
        client_id = self._get_client_id(obj)
        if client_id:
            # Check if user has manager role for this specific client
            user_client = UserClient.objects.filter(
                user=user,
                client_id=client_id,
                is_active=True
            ).first()

            if user_client and hasattr(user_client, 'role'):
                # If UserClient has a role field, check for manager/admin
                if user_client.role in ['manager', 'admin']:
                    return True

        return False

    def _get_client_id(self, obj):
        """Extract client ID from object (same logic as IsClientScopedOrAdmin)."""
        if hasattr(obj, 'client_id'):
            return str(obj.client_id) if obj.client_id else None

        if hasattr(obj, 'client'):
            client = obj.client
            if client:
                return str(client.id if hasattr(client, 'id') else client)

        if hasattr(obj, 'person') and hasattr(obj.person, 'client'):
            person = obj.person
            if person and person.client:
                return str(person.client.id)

        if hasattr(obj, 'contract') and hasattr(obj.contract, 'client'):
            contract = obj.contract
            if contract and contract.client:
                return str(contract.client.id)

        return None
