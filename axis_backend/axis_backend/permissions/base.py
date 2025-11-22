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
    Permission for document management.

    Use for operations that require document management privileges:
    - Publishing/archiving documents
    - Creating new versions
    - Managing document lifecycle
    """

    def has_permission(self, request, view) -> bool:
        """
        Check if user has document management privileges.

        Args:
            request: HTTP request
            view: View being accessed

        Returns:
            True if user can manage documents
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Superuser has all permissions
        if request.user.is_superuser:
            return True

        # Check if user has document manager role
        # TODO: Implement role checking once User/Profile models are complete
        # For now, allow authenticated users (will be restricted later)
        return True

    def has_object_permission(self, request, view, obj: Any) -> bool:
        """
        Check if user can manage specific document.

        Args:
            request: HTTP request
            view: View being accessed
            obj: Document object being accessed

        Returns:
            True if user can manage this document
        """
        # Superuser has all permissions
        if request.user.is_superuser:
            return True

        # Check if user is authorized for document's client
        # TODO: Implement client-based authorization once relationships are complete
        # For now, allow authenticated users (will be restricted later)
        return True


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
