"""Repository for ServiceCategory model data access."""
from typing import Optional
from django.db.models import QuerySet, Count, Q

from axis_backend.repositories.base import BaseRepository
from apps.services_app.models import ServiceCategory


class ServiceCategoryRepository(BaseRepository[ServiceCategory]):
    """
    Repository for ServiceCategory model.

    Responsibilities:
    - ServiceCategory data access operations
    - Category search and lookup operations
    - Service count aggregation
    """

    model = ServiceCategory

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with service count annotation.

        Returns:
            QuerySet with annotated service counts
        """
        return super().get_queryset().annotate(
            active_service_count=Count('services', filter=Q(services__deleted_at__isnull=True))
        )

    # Query Methods

    def find_by_name(self, name: str) -> Optional[ServiceCategory]:
        """Find category by exact name match."""
        return self.get_queryset().filter(name=name).first()

    def search_by_name(self, name: str) -> QuerySet:
        """Search categories by partial name match."""
        return self.get_queryset().filter(name__icontains=name)

    # Filter Methods

    def get_categories_with_services(self) -> QuerySet:
        """Get categories that have at least one active service."""
        return self.get_queryset().filter(services__deleted_at__isnull=True).distinct()

    def get_empty_categories(self) -> QuerySet:
        """Get categories with no active services."""
        return self.get_queryset().filter(
            Q(services__isnull=True) | Q(services__deleted_at__isnull=False)
        ).distinct()

    # Search Methods

    def search_categories(
        self,
        name: Optional[str] = None,
        has_services: Optional[bool] = None
    ) -> QuerySet:
        """
        Advanced category search with multiple filters.

        Args:
            name: Partial name match
            has_services: Filter by presence of active services

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if name:
            queryset = queryset.filter(name__icontains=name)
        if has_services is True:
            queryset = queryset.filter(services__deleted_at__isnull=True).distinct()
        elif has_services is False:
            queryset = queryset.filter(
                Q(services__isnull=True) | Q(services__deleted_at__isnull=False)
            ).distinct()

        return queryset
