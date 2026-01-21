"""Repository for KPIAssignment model data access."""
from typing import Optional
from datetime import date
from django.db.models import QuerySet, Q
from django.utils import timezone

from axis_backend.repositories.base import BaseRepository
from apps.kpis.models import KPIAssignment


class KPIAssignmentRepository(BaseRepository[KPIAssignment]):
    """
    Repository for KPIAssignment model.

    Responsibilities (Single Responsibility Principle):
    - KPIAssignment data access operations
    - Complex filtering by dates and status
    - Relationship loading optimization

    Design Notes:
    - Extends BaseRepository for common CRUD
    - Assignment-specific date and status queries
    - Supports KPI, contract, and client filtering
    """

    model = KPIAssignment

    def get_queryset(self) -> QuerySet:
        """
        Get optimized queryset with relationships.

        Returns:
            QuerySet with select_related for kpi, contract, client
        """
        return super().get_queryset().select_related(
            'kpi',
            'kpi__type',
            'contract',
            'client'
        )

    # Query Methods

    def filter_by_kpi(self, kpi_id: str) -> QuerySet:
        """
        Filter assignments by KPI.

        Args:
            kpi_id: KPI ID

        Returns:
            QuerySet of assignments for KPI
        """
        return self.get_queryset().filter(kpi_id=kpi_id)

    def filter_by_contract(self, contract_id: str) -> QuerySet:
        """
        Filter assignments by contract.

        Args:
            contract_id: Contract ID

        Returns:
            QuerySet of assignments for contract
        """
        return self.get_queryset().filter(contract_id=contract_id)

    def filter_by_client(self, client_id: str) -> QuerySet:
        """
        Filter assignments by client.

        Args:
            client_id: Client ID

        Returns:
            QuerySet of assignments for client
        """
        return self.get_queryset().filter(client_id=client_id)

    def filter_by_status(self, status: str) -> QuerySet:
        """
        Filter assignments by status.

        Args:
            status: Assignment status

        Returns:
            QuerySet of assignments with status
        """
        return self.get_queryset().filter(status=status)

    def filter_by_frequency(self, frequency: str) -> QuerySet:
        """
        Filter assignments by measurement frequency.

        Args:
            frequency: Frequency enum value

        Returns:
            QuerySet of assignments with frequency
        """
        return self.get_queryset().filter(frequency=frequency)

    # Date-based Filters

    def filter_by_date_range(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> QuerySet:
        """
        Filter assignments by date range.

        Args:
            start_date: Filter by start_date >= this date
            end_date: Filter by start_date <= this date

        Returns:
            QuerySet of assignments in date range
        """
        queryset = self.get_queryset()

        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(
                Q(end_date__lte=end_date) | Q(end_date__isnull=True)
            )

        return queryset

    def get_active_assignments(self, as_of_date: Optional[date] = None) -> QuerySet:
        """
        Get assignments active as of a specific date.

        Args:
            as_of_date: Date to check (defaults to today)

        Returns:
            QuerySet of active assignments
        """
        if as_of_date is None:
            as_of_date = timezone.now().date()

        return self.get_queryset().filter(
            start_date__lte=as_of_date
        ).filter(
            Q(end_date__gte=as_of_date) | Q(end_date__isnull=True)
        )

    def get_upcoming_assignments(self, days_ahead: int = 30) -> QuerySet:
        """
        Get assignments starting in the near future.

        Args:
            days_ahead: Number of days to look ahead

        Returns:
            QuerySet of upcoming assignments
        """
        today = timezone.now().date()
        future_date = today + timezone.timedelta(days=days_ahead)

        return self.get_queryset().filter(
            start_date__gte=today,
            start_date__lte=future_date
        )

    def get_expired_assignments(self) -> QuerySet:
        """
        Get assignments that have ended.

        Returns:
            QuerySet of expired assignments
        """
        today = timezone.now().date()

        return self.get_queryset().filter(
            end_date__lt=today
        )

    # Complex Searches

    def search_assignments(
        self,
        kpi_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        frequency: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        active_only: bool = False
    ) -> QuerySet:
        """
        Advanced assignment search with multiple filters.

        Args:
            kpi_id: Filter by KPI
            contract_id: Filter by contract
            client_id: Filter by client
            status: Filter by status
            frequency: Filter by frequency
            start_date: Filter by start date
            end_date: Filter by end date
            active_only: Only return currently active assignments

        Returns:
            QuerySet matching all specified filters
        """
        queryset = self.get_queryset()

        if kpi_id:
            queryset = queryset.filter(kpi_id=kpi_id)

        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)

        if client_id:
            queryset = queryset.filter(client_id=client_id)

        if status:
            queryset = queryset.filter(status=status)

        if frequency:
            queryset = queryset.filter(frequency=frequency)

        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)

        if end_date:
            queryset = queryset.filter(
                Q(end_date__lte=end_date) | Q(end_date__isnull=True)
            )

        if active_only:
            today = timezone.now().date()
            queryset = queryset.filter(
                start_date__lte=today
            ).filter(
                Q(end_date__gte=today) | Q(end_date__isnull=True)
            )

        return queryset

    def get_assignments_with_measurements(self) -> QuerySet:
        """
        Get assignments that have recorded measurements.

        Returns:
            QuerySet of assignments with measurements in metadata
        """
        return self.get_queryset().filter(
            metadata__has_key='measurements'
        ).exclude(
            metadata__measurements=[]
        )
