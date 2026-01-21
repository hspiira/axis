"""Repository for KPIType model data access."""
from typing import Optional, Any
from django.db.models import QuerySet

from axis_backend.repositories.base import BaseRepository
from apps.kpis.models import KPIType


class KPITypeRepository(BaseRepository[KPIType]):
    """
    Repository for KPIType model.

    Responsibilities (Single Responsibility Principle):
    - KPIType data access operations
    - Query optimization and filtering
    - Database transaction management

    Design Notes:
    - Extends BaseRepository for common CRUD
    - KPIType-specific queries and filters
    - Maintains separation from business logic
    """

    model = KPIType

    # Custom Query Methods

    def find_by_name(self, name: str) -> Optional[KPIType]:
        """
        Find KPI type by exact name.

        Args:
            name: KPI type name

        Returns:
            KPIType instance or None
        """
        return self.get_queryset().filter(name=name).first()

    def search_by_name(self, query: str) -> QuerySet:
        """
        Search KPI types by name (case-insensitive).

        Args:
            query: Search query

        Returns:
            QuerySet of matching KPI types
        """
        return self.get_queryset().filter(
            name__icontains=query
        )

    def filter_by_weight_range(
        self,
        min_weight: Optional[int] = None,
        max_weight: Optional[int] = None
    ) -> QuerySet:
        """
        Filter KPI types by weight range.

        Args:
            min_weight: Minimum weight (inclusive)
            max_weight: Maximum weight (inclusive)

        Returns:
            QuerySet of KPI types in weight range
        """
        queryset = self.get_queryset()

        if min_weight is not None:
            queryset = queryset.filter(weight__gte=min_weight)
        if max_weight is not None:
            queryset = queryset.filter(weight__lte=max_weight)

        return queryset

    def get_by_weight_descending(self) -> QuerySet:
        """
        Get all KPI types ordered by weight (highest first).

        Returns:
            QuerySet ordered by weight descending
        """
        return self.get_queryset().order_by('-weight', 'name')

    # Bulk Operations

    def bulk_create_types(self, types_data: list[dict[str, Any]]) -> list[KPIType]:
        """
        Create multiple KPI types in a single operation.

        Args:
            types_data: List of KPI type data dictionaries

        Returns:
            List of created KPIType instances
        """
        kpi_types = [KPIType(**data) for data in types_data]
        return KPIType.objects.bulk_create(kpi_types)
