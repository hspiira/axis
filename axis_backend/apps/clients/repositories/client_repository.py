"""Repository for Client model data access."""
from typing import Optional
from django.db.models import QuerySet, Q

from axis_backend.repositories.base import BaseRepository
from axis_backend.enums import BaseStatus
from apps.clients.models import Client


class ClientRepository(BaseRepository[Client]):
    """
    Repository for Client model.

    Responsibilities:
    - Client data access operations
    - Filtering by status, industry, verification
    - Client search and lookup operations
    """

    model = Client

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with relationships optimized.

        Returns:
            QuerySet with select_related for industry
        """
        return super().get_queryset().select_related('industry')

    # Query Methods

    def find_by_name(self, name: str) -> Optional[Client]:
        """Find client by exact name match."""
        return self.get_queryset().filter(name=name).first()

    def find_by_email(self, email: str) -> Optional[Client]:
        """Find client by email address."""
        return self.get_queryset().filter(
            Q(email=email) | Q(contact_email=email)
        ).first()

    def find_by_tax_id(self, tax_id: str) -> Optional[Client]:
        """Find client by tax identification number."""
        return self.get_queryset().filter(tax_id=tax_id).first()

    def search_by_name(self, name: str) -> QuerySet:
        """Search clients by partial name match."""
        return self.get_queryset().filter(name__icontains=name)

    # Status Filters

    def get_active_clients(self) -> QuerySet:
        """Get all active clients."""
        return self.get_queryset().filter(status=BaseStatus.ACTIVE)

    def get_inactive_clients(self) -> QuerySet:
        """Get all inactive clients."""
        return self.get_queryset().filter(status=BaseStatus.INACTIVE)

    def get_archived_clients(self) -> QuerySet:
        """Get all archived clients."""
        return self.get_queryset().filter(status=BaseStatus.ARCHIVED)

    def filter_by_status(self, status: str) -> QuerySet:
        """Filter clients by status."""
        return self.get_queryset().filter(status=status)

    # Verification Filters

    def get_verified_clients(self) -> QuerySet:
        """Get all verified clients."""
        return self.get_queryset().filter(is_verified=True)

    def get_unverified_clients(self) -> QuerySet:
        """Get all unverified clients."""
        return self.get_queryset().filter(is_verified=False)

    # Industry Filters

    def filter_by_industry(self, industry_id: str) -> QuerySet:
        """Filter clients by industry."""
        return self.get_queryset().filter(industry_id=industry_id)

    def get_clients_without_industry(self) -> QuerySet:
        """Get clients with no industry assigned."""
        return self.get_queryset().filter(industry__isnull=True)

    # Contact Method Filters

    def filter_by_contact_method(self, method: str) -> QuerySet:
        """Filter clients by preferred contact method."""
        return self.get_queryset().filter(preferred_contact_method=method)

    def get_clients_with_email(self) -> QuerySet:
        """Get clients with email contact available."""
        return self.get_queryset().filter(
            Q(email__isnull=False) | Q(contact_email__isnull=False)
        )

    def get_clients_with_phone(self) -> QuerySet:
        """Get clients with phone contact available."""
        return self.get_queryset().filter(
            Q(phone__isnull=False) | Q(contact_phone__isnull=False)
        )

    # Advanced Search

    def search_clients(
        self,
        name: Optional[str] = None,
        email: Optional[str] = None,
        status: Optional[str] = None,
        industry_id: Optional[str] = None,
        *,
        is_verified: Optional[bool] = None,
        contact_method: Optional[str] = None
    ) -> QuerySet:
        """
        Advanced client search with multiple filters.

        Args:
            name: Partial name match
            email: Email address match
            status: Client status
            industry_id: Industry filter
            is_verified: Verification status
            contact_method: Preferred contact method

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if name:
            queryset = queryset.filter(name__icontains=name)
        if email:
            queryset = queryset.filter(
                Q(email__icontains=email) | Q(contact_email__icontains=email)
            )
        if status:
            queryset = queryset.filter(status=status)
        if industry_id:
            queryset = queryset.filter(industry_id=industry_id)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified)
        if contact_method:
            queryset = queryset.filter(preferred_contact_method=contact_method)

        return queryset

    # Business Logic Queries

    def get_active_verified_clients(self) -> QuerySet:
        """Get clients that are both active and verified."""
        return self.get_queryset().filter(
            status=BaseStatus.ACTIVE,
            is_verified=True
        )

    def get_clients_needing_verification(self) -> QuerySet:
        """Get active clients that haven't been verified yet."""
        return self.get_queryset().filter(
            status=BaseStatus.ACTIVE,
            is_verified=False
        )

    def get_recent_clients(self, days: int = 30) -> QuerySet:
        """
        Get clients created within the specified number of days.

        Args:
            days: Number of days to look back

        Returns:
            QuerySet of recent clients
        """
        from django.utils import timezone
        from datetime import timedelta

        cutoff_date = timezone.now() - timedelta(days=days)
        return self.get_queryset().filter(created_at__gte=cutoff_date)
