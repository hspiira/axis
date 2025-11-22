"""Repository for ServiceAssignment model data access."""
from typing import Optional
from datetime import date
from django.db.models import QuerySet, Q
from django.utils import timezone

from axis_backend.repositories.base import BaseRepository
from axis_backend.enums import AssignmentStatus
from apps.services_app.models import ServiceAssignment


class ServiceAssignmentRepository(BaseRepository[ServiceAssignment]):
    """
    Repository for ServiceAssignment model.

    Responsibilities:
    - ServiceAssignment data access operations
    - Filtering by service, contract, client, status
    - Assignment search and date operations
    """

    model = ServiceAssignment

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with relationships optimized.

        Returns:
            QuerySet with select_related for service, contract, client
        """
        return super().get_queryset().select_related('service', 'contract', 'client')

    # Query Methods

    def filter_by_service(self, service_id: str) -> QuerySet:
        """Get all assignments for a service."""
        return self.get_queryset().filter(service_id=service_id)

    def filter_by_contract(self, contract_id: str) -> QuerySet:
        """Get all assignments for a contract."""
        return self.get_queryset().filter(contract_id=contract_id)

    def filter_by_client(self, client_id: str) -> QuerySet:
        """Get all assignments for a client."""
        return self.get_queryset().filter(client_id=client_id)

    # Status Filters

    def get_pending_assignments(self) -> QuerySet:
        """Get all pending assignments."""
        return self.get_queryset().filter(status=AssignmentStatus.PENDING)

    def get_active_assignments(self) -> QuerySet:
        """Get all active assignments."""
        return self.get_queryset().filter(status=AssignmentStatus.ACTIVE)

    def get_completed_assignments(self) -> QuerySet:
        """Get all completed assignments."""
        return self.get_queryset().filter(status=AssignmentStatus.COMPLETED)

    def get_canceled_assignments(self) -> QuerySet:
        """Get all canceled assignments."""
        return self.get_queryset().filter(status=AssignmentStatus.CANCELED)

    def filter_by_status(self, status: str) -> QuerySet:
        """Filter assignments by status."""
        return self.get_queryset().filter(status=status)

    # Date Filters

    def get_assignments_starting_on(self, start_date: date) -> QuerySet:
        """Get assignments starting on a specific date."""
        return self.get_queryset().filter(start_date=start_date)

    def get_assignments_starting_in_range(self, start_date: date, end_date: date) -> QuerySet:
        """Get assignments starting within date range."""
        return self.get_queryset().filter(
            start_date__gte=start_date,
            start_date__lte=end_date
        )

    def get_current_assignments(self, as_of_date: Optional[date] = None) -> QuerySet:
        """
        Get assignments currently in effect.

        Args:
            as_of_date: Date to check, defaults to today

        Returns:
            QuerySet of assignments in effect on the date
        """
        if as_of_date is None:
            as_of_date = timezone.now().date()

        return self.get_queryset().filter(
            start_date__lte=as_of_date,
            status=AssignmentStatus.ACTIVE
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=as_of_date)
        )

    def get_expiring_assignments(self, days: int = 30) -> QuerySet:
        """Get assignments expiring within specified days."""
        from datetime import timedelta
        today = timezone.now().date()
        expiry_threshold = today + timedelta(days=days)
        return self.get_queryset().filter(
            status=AssignmentStatus.ACTIVE,
            end_date__gte=today,
            end_date__lte=expiry_threshold
        )

    # Frequency Filters

    def filter_by_frequency(self, frequency: str) -> QuerySet:
        """Filter assignments by frequency."""
        return self.get_queryset().filter(frequency=frequency)

    # Search Methods

    def search_assignments(
        self,
        service_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        frequency: Optional[str] = None,
        start_date_from: Optional[date] = None,
        start_date_to: Optional[date] = None,
        is_current: Optional[bool] = None
    ) -> QuerySet:
        """
        Advanced assignment search with multiple filters.

        Args:
            service_id: Service filter
            contract_id: Contract filter
            client_id: Client filter
            status: Assignment status
            frequency: Service frequency
            start_date_from: Minimum start date
            start_date_to: Maximum start date
            is_current: Filter for current assignments

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if service_id:
            queryset = queryset.filter(service_id=service_id)
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if status:
            queryset = queryset.filter(status=status)
        if frequency:
            queryset = queryset.filter(frequency=frequency)
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        if is_current is True:
            today = timezone.now().date()
            queryset = queryset.filter(
                start_date__lte=today,
                status=AssignmentStatus.ACTIVE
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=today)
            )

        return queryset

    # Business Logic Queries

    def get_client_active_assignments(self, client_id: str) -> QuerySet:
        """Get active assignments for a client."""
        return self.get_queryset().filter(
            client_id=client_id,
            status=AssignmentStatus.ACTIVE
        )

    def get_service_active_assignments(self, service_id: str) -> QuerySet:
        """Get active assignments for a service."""
        return self.get_queryset().filter(
            service_id=service_id,
            status=AssignmentStatus.ACTIVE
        )
