"""Base repository for data access operations."""
from typing import Generic, TypeVar, List, Optional, Dict, Any
from django.db import models
from django.db.models import QuerySet, Q
from django.core.paginator import Paginator

T = TypeVar('T', bound=models.Model)


class BaseRepository(Generic[T]):
    """
    Abstract base repository for data access operations.

    Responsibilities (Single Responsibility Principle):
    - Data access abstraction
    - Query building and optimization
    - Pagination handling
    - Search and filtering

    Design Notes (SOLID):
    - Open/Closed: Extend with specific repositories without modification
    - Liskov Substitution: All repositories can be used interchangeably
    - Dependency Inversion: Services depend on this abstraction
    """

    model: type[T]

    def __init__(self):
        """Initialize repository."""
        if not hasattr(self, 'model'):
            raise NotImplementedError("Repository must define 'model' attribute")

    def get_queryset(self) -> QuerySet[T]:
        """
        Get base queryset.

        Default: excludes soft-deleted records
        Override in subclass to add select_related/prefetch_related
        """
        return self.model.objects.all()

    def get_by_id(self, id: str) -> Optional[T]:
        """
        Retrieve single instance by ID.

        Args:
            id: Primary key of instance

        Returns:
            Model instance or None if not found
        """
        try:
            return self.get_queryset().get(id=id)
        except self.model.DoesNotExist:
            return None

    def list(
        self,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        ordering: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        List instances with filtering, search, and pagination.

        Args:
            filters: Dictionary of filter parameters
            search: Search query string
            ordering: List of field names for ordering (prefix with '-' for desc)
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Dictionary with:
                - results: List of model instances
                - count: Total count of items (all pages)
                - page: Current page number
                - page_size: Items per page
                - total_pages: Total number of pages
        """
        queryset = self.get_queryset()

        # Apply filters
        if filters:
            queryset = self._apply_filters(queryset, filters)

        # Apply search
        if search:
            queryset = self._apply_search(queryset, search)

        # Apply ordering
        if ordering:
            queryset = queryset.order_by(*ordering)
        else:
            # Default ordering by creation date (most recent first)
            queryset = queryset.order_by('-created_at')

        # Get total count before pagination
        total_count = queryset.count()

        # Paginate
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        return {
            'results': list(page_obj),
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages
        }

    def create(self, **data) -> T:
        """
        Create new instance.

        Args:
            **data: Field values for new instance

        Returns:
            Created model instance
        """
        return self.model.objects.create(**data)

    def update(self, instance: T, **data) -> T:
        """
        Update existing instance.

        Args:
            instance: Instance to update
            **data: Field values to update

        Returns:
            Updated model instance
        """
        for key, value in data.items():
            setattr(instance, key, value)
        instance.save()
        return instance

    def delete(self, instance: T) -> None:
        """
        Delete instance (soft delete if supported).

        Args:
            instance: Instance to delete
        """
        if hasattr(instance, 'deleted_at'):
            # Soft delete
            from django.utils import timezone
            instance.deleted_at = timezone.now()
            instance.save(update_fields=['deleted_at', 'updated_at'])
        else:
            # Hard delete
            instance.delete()

    def bulk_create(self, instances: List[T]) -> List[T]:
        """
        Bulk create instances.

        Args:
            instances: List of model instances to create

        Returns:
            List of created instances
        """
        return self.model.objects.bulk_create(instances)

    def bulk_update(self, instances: List[T], fields: List[str]) -> None:
        """
        Bulk update instances.

        Args:
            instances: List of model instances to update
            fields: List of field names to update
        """
        self.model.objects.bulk_update(instances, fields)

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count instances with optional filters.

        Args:
            filters: Dictionary of filter parameters

        Returns:
            Count of matching instances
        """
        queryset = self.get_queryset()
        if filters:
            queryset = self._apply_filters(queryset, filters)
        return queryset.count()

    def exists(self, filters: Dict[str, Any]) -> bool:
        """
        Check if instances exist matching filters.

        Args:
            filters: Dictionary of filter parameters

        Returns:
            True if matching instances exist
        """
        return self.get_queryset().filter(**filters).exists()

    def filter(self, **filters) -> QuerySet[T]:
        """
        Get filtered queryset.

        Args:
            **filters: Django ORM filter parameters

        Returns:
            Filtered queryset
        """
        return self.get_queryset().filter(**filters)

    def all(self) -> QuerySet[T]:
        """
        Get all instances.

        Returns:
            Complete queryset
        """
        return self.get_queryset()

    # Abstract methods - override in subclasses
    def _apply_filters(self, queryset: QuerySet[T], filters: Dict[str, Any]) -> QuerySet[T]:
        """
        Apply model-specific filters.

        Override in subclass to handle complex filtering logic.

        Args:
            queryset: Base queryset
            filters: Dictionary of filter parameters

        Returns:
            Filtered queryset
        """
        # Default: apply filters directly as kwargs
        filter_kwargs = {}
        for key, value in filters.items():
            if value is not None:
                filter_kwargs[key] = value
        return queryset.filter(**filter_kwargs)

    def _apply_search(self, queryset: QuerySet[T], search: str) -> QuerySet[T]:
        """
        Apply model-specific search.

        Override in subclass to define searchable fields.

        Args:
            queryset: Base queryset
            search: Search query string

        Returns:
            Filtered queryset
        """
        # Default: no search applied
        # Override in subclass with specific search fields
        return queryset
