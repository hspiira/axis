"""Repository for Service model data access."""
from typing import Optional
from django.db.models import QuerySet, Q

from axis_backend.repositories.base import BaseRepository
from axis_backend.enums import BaseStatus
from apps.services_app.models import Service


class ServiceRepository(BaseRepository[Service]):
    """
    Repository for Service model.

    Responsibilities:
    - Service data access operations
    - Filtering by category, status, provider
    - Service search and availability operations
    """

    model = Service

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with relationships optimized.

        Returns:
            QuerySet with select_related for category and service_provider
        """
        return super().get_queryset().select_related('category', 'service_provider')

    # Query Methods

    def find_by_name(self, name: str) -> Optional[Service]:
        """Find service by exact name match."""
        return self.get_queryset().filter(name=name).first()

    def search_by_name(self, name: str) -> QuerySet:
        """Search services by partial name match."""
        return self.get_queryset().filter(name__icontains=name)

    # Status Filters

    def get_active_services(self) -> QuerySet:
        """Get all active services."""
        return self.get_queryset().filter(status=BaseStatus.ACTIVE)

    def get_inactive_services(self) -> QuerySet:
        """Get all inactive services."""
        return self.get_queryset().filter(status=BaseStatus.INACTIVE)

    def filter_by_status(self, status: str) -> QuerySet:
        """Filter services by status."""
        return self.get_queryset().filter(status=status)

    # Category Filters

    def filter_by_category(self, category_id: str) -> QuerySet:
        """Filter services by category."""
        return self.get_queryset().filter(category_id=category_id)

    def get_services_without_category(self) -> QuerySet:
        """Get services with no category assigned."""
        return self.get_queryset().filter(category__isnull=True)

    # Provider Filters

    def filter_by_provider(self, provider_id: str) -> QuerySet:
        """Filter services by provider."""
        return self.get_queryset().filter(service_provider_id=provider_id)

    def get_services_without_provider(self) -> QuerySet:
        """Get services with no provider assigned."""
        return self.get_queryset().filter(service_provider__isnull=True)

    # Visibility Filters

    def get_public_services(self) -> QuerySet:
        """Get all public services."""
        return self.get_queryset().filter(is_public=True)

    def get_private_services(self) -> QuerySet:
        """Get all private services."""
        return self.get_queryset().filter(is_public=False)

    # Availability Filters

    def get_available_services(self) -> QuerySet:
        """Get all available services (active and not soft-deleted)."""
        return self.get_queryset().filter(
            status=BaseStatus.ACTIVE,
            deleted_at__isnull=True
        )

    def get_group_services(self) -> QuerySet:
        """Get services that support multiple participants."""
        return self.get_queryset().filter(capacity__gt=1)

    def get_individual_services(self) -> QuerySet:
        """Get services for individual participants only."""
        return self.get_queryset().filter(Q(capacity__isnull=True) | Q(capacity=1))

    # Price Filters

    def get_paid_services(self) -> QuerySet:
        """Get services with a price."""
        return self.get_queryset().filter(price__gt=0)

    def get_free_services(self) -> QuerySet:
        """Get services with no price."""
        return self.get_queryset().filter(Q(price__isnull=True) | Q(price=0))

    # Search Methods

    def search_services(
        self,
        name: Optional[str] = None,
        category_id: Optional[str] = None,
        provider_id: Optional[str] = None,
        status: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_group: Optional[bool] = None,
        has_price: Optional[bool] = None
    ) -> QuerySet:
        """
        Advanced service search with multiple filters.

        Args:
            name: Partial name match
            category_id: Category filter
            provider_id: Provider filter
            status: Service status
            is_public: Public visibility
            is_group: Group service flag
            has_price: Has price flag

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if name:
            queryset = queryset.filter(name__icontains=name)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if provider_id:
            queryset = queryset.filter(service_provider_id=provider_id)
        if status:
            queryset = queryset.filter(status=status)
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public)
        if is_group is True:
            queryset = queryset.filter(capacity__gt=1)
        elif is_group is False:
            queryset = queryset.filter(Q(capacity__isnull=True) | Q(capacity=1))
        if has_price is True:
            queryset = queryset.filter(price__gt=0)
        elif has_price is False:
            queryset = queryset.filter(Q(price__isnull=True) | Q(price=0))

        return queryset

    # Business Logic Queries

    def get_catalog_services(self) -> QuerySet:
        """Get services available in public catalog."""
        return self.get_queryset().filter(
            status=BaseStatus.ACTIVE,
            is_public=True,
            deleted_at__isnull=True
        )
