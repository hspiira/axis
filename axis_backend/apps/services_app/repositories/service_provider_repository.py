"""Repository for ServiceProvider model data access."""
from typing import Optional
from django.db.models import QuerySet, Q, Avg

from axis_backend.repositories.base import BaseRepository
from axis_backend.enums import ServiceProviderType, WorkStatus
from apps.services_app.models import ServiceProvider


class ServiceProviderRepository(BaseRepository[ServiceProvider]):
    """
    Repository for ServiceProvider model.

    Responsibilities:
    - ServiceProvider data access operations
    - Filtering by type, status, verification
    - Provider search and rating operations
    """

    model = ServiceProvider

    def get_queryset(self) -> QuerySet:
        """
        Get queryset for service providers.

        Returns:
            QuerySet for ServiceProvider
        """
        return super().get_queryset()

    # Query Methods

    def find_by_name(self, name: str) -> Optional[ServiceProvider]:
        """Find provider by exact name match."""
        return self.get_queryset().filter(name=name).first()

    def search_by_name(self, name: str) -> QuerySet:
        """Search providers by partial name match."""
        return self.get_queryset().filter(name__icontains=name)

    def find_by_email(self, email: str) -> Optional[ServiceProvider]:
        """Find provider by contact email."""
        return self.get_queryset().filter(contact_email=email).first()

    # Type Filters

    def filter_by_type(self, provider_type: str) -> QuerySet:
        """Filter providers by type."""
        return self.get_queryset().filter(type=provider_type)

    # Status Filters

    def get_active_providers(self) -> QuerySet:
        """Get all active providers."""
        return self.get_queryset().filter(status=WorkStatus.ACTIVE)

    def get_inactive_providers(self) -> QuerySet:
        """Get all inactive providers."""
        return self.get_queryset().filter(status=WorkStatus.INACTIVE)

    def filter_by_status(self, status: str) -> QuerySet:
        """Filter providers by status."""
        return self.get_queryset().filter(status=status)

    # Verification Filters

    def get_verified_providers(self) -> QuerySet:
        """Get all verified providers."""
        return self.get_queryset().filter(is_verified=True)

    def get_unverified_providers(self) -> QuerySet:
        """Get all unverified providers."""
        return self.get_queryset().filter(is_verified=False)

    # Availability Filters

    def get_available_providers(self) -> QuerySet:
        """Get providers that are active and verified."""
        return self.get_queryset().filter(
            status=WorkStatus.ACTIVE,
            is_verified=True,
            deleted_at__isnull=True
        )

    # Rating Filters

    def get_top_rated_providers(self, min_rating: float = 4.0) -> QuerySet:
        """Get providers with rating above threshold."""
        return self.get_queryset().filter(rating__gte=min_rating)

    def get_providers_by_rating(self) -> QuerySet:
        """Get all providers ordered by rating (highest first)."""
        return self.get_queryset().order_by('-rating', 'name')

    # Location Filters

    def search_by_location(self, location: str) -> QuerySet:
        """Search providers by location."""
        return self.get_queryset().filter(location__icontains=location)

    # Search Methods

    def search_providers(
        self,
        name: Optional[str] = None,
        provider_type: Optional[str] = None,
        status: Optional[str] = None,
        is_verified: Optional[bool] = None,
        location: Optional[str] = None,
        min_rating: Optional[float] = None
    ) -> QuerySet:
        """
        Advanced provider search with multiple filters.

        Args:
            name: Partial name match
            provider_type: Provider type
            status: Provider status
            is_verified: Verification status
            location: Location search
            min_rating: Minimum rating threshold

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if name:
            queryset = queryset.filter(name__icontains=name)
        if provider_type:
            queryset = queryset.filter(type=provider_type)
        if status:
            queryset = queryset.filter(status=status)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified)
        if location:
            queryset = queryset.filter(location__icontains=location)
        if min_rating is not None:
            queryset = queryset.filter(rating__gte=min_rating)

        return queryset

    # Business Logic Queries

    def get_providers_needing_verification(self) -> QuerySet:
        """Get active providers that haven't been verified yet."""
        return self.get_queryset().filter(
            status=WorkStatus.ACTIVE,
            is_verified=False
        )

    def get_providers_by_specialization(self, specialization: str) -> QuerySet:
        """Get providers with specific specialization."""
        return self.get_queryset().filter(
            specializations__contains=[specialization]
        )
