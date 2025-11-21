"""Base service for business logic orchestration."""
from typing import Generic, TypeVar, Optional, Dict, Any, List
from django.db import transaction
from django.core.exceptions import ValidationError

T = TypeVar('T')


class BaseService(Generic[T]):
    """
    Abstract base service for business logic.

    Responsibilities (Single Responsibility Principle):
    - Business logic orchestration
    - Validation rules enforcement
    - Transaction coordination
    - Cross-entity operations

    Design Notes (SOLID):
    - Single Responsibility: Only business logic, no data access
    - Open/Closed: Extend with specific services
    - Dependency Inversion: Depends on repository abstraction, not implementation
    """

    repository_class = None

    def __init__(self):
        """Initialize service with repository."""
        if self.repository_class is None:
            raise NotImplementedError("Service must define 'repository_class'")
        self.repository = self.repository_class()

    def get(self, id: str) -> Optional[T]:
        """
        Retrieve single instance by ID.

        Args:
            id: Primary key

        Returns:
            Model instance or None

        Raises:
            ValidationError: If ID is invalid
        """
        if not id:
            raise ValidationError("ID is required")

        return self.repository.get_by_id(id)

    def list(
        self,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        ordering: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        List instances with filters and pagination.

        Args:
            filters: Dictionary of filter parameters
            search: Search query string
            ordering: List of field names for ordering
            page: Page number
            page_size: Items per page

        Returns:
            Dictionary with results and pagination info
        """
        return self.repository.list(
            filters=filters,
            search=search,
            ordering=ordering,
            page=page,
            page_size=page_size
        )

    @transaction.atomic
    def create(self, data: Dict[str, Any]) -> T:
        """
        Create new instance with validation.

        Override in subclass to add business logic.

        Args:
            data: Dictionary of field values

        Returns:
            Created instance

        Raises:
            ValidationError: If validation fails
        """
        # Pre-creation validation
        self._validate_create(data)

        # Create instance
        instance = self.repository.create(**data)

        # Post-creation hooks
        self._post_create(instance)

        return instance

    @transaction.atomic
    def update(self, id: str, data: Dict[str, Any]) -> T:
        """
        Update existing instance with validation.

        Override in subclass to add business logic.

        Args:
            id: Primary key
            data: Dictionary of field values to update

        Returns:
            Updated instance

        Raises:
            ValidationError: If instance not found or validation fails
        """
        # Get instance
        instance = self.repository.get_by_id(id)
        if not instance:
            raise ValidationError(f"Instance with id {id} not found")

        # Pre-update validation
        self._validate_update(instance, data)

        # Update instance
        updated_instance = self.repository.update(instance, **data)

        # Post-update hooks
        self._post_update(updated_instance)

        return updated_instance

    @transaction.atomic
    def delete(self, id: str) -> None:
        """
        Delete instance with validation.

        Override in subclass to add business logic.

        Args:
            id: Primary key

        Raises:
            ValidationError: If instance not found or validation fails
        """
        # Get instance
        instance = self.repository.get_by_id(id)
        if not instance:
            raise ValidationError(f"Instance with id {id} not found")

        # Pre-deletion validation
        self._validate_delete(instance)

        # Delete instance
        self.repository.delete(instance)

        # Post-deletion hooks
        self._post_delete(instance)

    def exists(self, filters: Dict[str, Any]) -> bool:
        """
        Check if instances exist matching filters.

        Args:
            filters: Dictionary of filter parameters

        Returns:
            True if matching instances exist
        """
        return self.repository.exists(filters)

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count instances with optional filters.

        Args:
            filters: Dictionary of filter parameters

        Returns:
            Count of matching instances
        """
        return self.repository.count(filters)

    # Validation hooks - override in subclasses

    def _validate_create(self, data: Dict[str, Any]) -> None:
        """
        Validate data before creation.

        Override in subclass to add business validation rules.

        Args:
            data: Dictionary of field values

        Raises:
            ValidationError: If validation fails
        """
        pass

    def _validate_update(self, instance: T, data: Dict[str, Any]) -> None:
        """
        Validate data before update.

        Override in subclass to add business validation rules.

        Args:
            instance: Instance being updated
            data: Dictionary of field values to update

        Raises:
            ValidationError: If validation fails
        """
        pass

    def _validate_delete(self, instance: T) -> None:
        """
        Validate before deletion.

        Override in subclass to add business validation rules.

        Args:
            instance: Instance being deleted

        Raises:
            ValidationError: If validation fails
        """
        pass

    # Post-operation hooks - override in subclasses

    def _post_create(self, instance: T) -> None:
        """
        Execute logic after creation.

        Override in subclass to add post-creation logic
        (e.g., send notifications, trigger events).

        Args:
            instance: Created instance
        """
        pass

    def _post_update(self, instance: T) -> None:
        """
        Execute logic after update.

        Override in subclass to add post-update logic.

        Args:
            instance: Updated instance
        """
        pass

    def _post_delete(self, instance: T) -> None:
        """
        Execute logic after deletion.

        Override in subclass to add post-deletion logic.

        Args:
            instance: Deleted instance
        """
        pass
