"""Repository for Contract model data access."""
from typing import Optional
from datetime import date, timedelta
from django.db.models import QuerySet, Q
from django.utils import timezone

from axis_backend.repositories.base import BaseRepository
from axis_backend.enums import ContractStatus, PaymentStatus
from apps.contracts.models import Contract


class ContractRepository(BaseRepository[Contract]):
    """
    Repository for Contract model.

    Responsibilities:
    - Contract data access operations
    - Filtering by status, client, dates
    - Contract search and payment tracking
    """

    model = Contract

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with relationships optimized.

        Returns:
            QuerySet with select_related for client
        """
        return super().get_queryset().select_related('client')

    # Query Methods

    def find_by_client(self, client_id: str) -> QuerySet:
        """Get all contracts for a client."""
        return self.get_queryset().filter(client_id=client_id)

    # Status Filters

    def get_active_contracts(self) -> QuerySet:
        """Get all active contracts."""
        return self.get_queryset().filter(status=ContractStatus.ACTIVE)

    def get_expired_contracts(self) -> QuerySet:
        """Get all expired contracts."""
        return self.get_queryset().filter(status=ContractStatus.EXPIRED)

    def get_terminated_contracts(self) -> QuerySet:
        """Get all terminated contracts."""
        return self.get_queryset().filter(status=ContractStatus.TERMINATED)

    def get_renewed_contracts(self) -> QuerySet:
        """Get all renewed contracts."""
        return self.get_queryset().filter(status=ContractStatus.RENEWED)

    def filter_by_status(self, status: str) -> QuerySet:
        """Filter contracts by status."""
        return self.get_queryset().filter(status=status)

    # Date-based Filters

    def get_contracts_starting_in_range(self, start_date: date, end_date: date) -> QuerySet:
        """Get contracts starting within date range."""
        return self.get_queryset().filter(
            start_date__gte=start_date,
            start_date__lte=end_date
        )

    def get_contracts_ending_in_range(self, start_date: date, end_date: date) -> QuerySet:
        """Get contracts ending within date range."""
        return self.get_queryset().filter(
            end_date__gte=start_date,
            end_date__lte=end_date
        )

    def get_expiring_soon(self, days: int = 30) -> QuerySet:
        """
        Get contracts expiring within specified days.

        Args:
            days: Number of days to look ahead

        Returns:
            QuerySet of contracts expiring soon
        """
        today = timezone.now().date()
        expiry_threshold = today + timedelta(days=days)
        return self.get_queryset().filter(
            status=ContractStatus.ACTIVE,
            end_date__gte=today,
            end_date__lte=expiry_threshold
        )

    def get_contracts_in_effect(self, as_of_date: Optional[date] = None) -> QuerySet:
        """
        Get contracts active on a specific date.

        Args:
            as_of_date: Date to check, defaults to today

        Returns:
            QuerySet of contracts in effect on the date
        """
        if as_of_date is None:
            as_of_date = timezone.now().date()

        return self.get_queryset().filter(
            start_date__lte=as_of_date,
            end_date__gte=as_of_date
        )

    # Renewal Filters

    def get_renewable_contracts(self) -> QuerySet:
        """Get contracts eligible for renewal."""
        return self.get_queryset().filter(is_renewable=True)

    def get_auto_renew_contracts(self) -> QuerySet:
        """Get contracts with auto-renewal enabled."""
        return self.get_queryset().filter(is_auto_renew=True)

    def get_pending_renewal(self) -> QuerySet:
        """Get contracts approaching renewal date."""
        today = timezone.now().date()
        return self.get_queryset().filter(
            is_renewable=True,
            renewal_date__lte=today,
            end_date__gte=today,
            status=ContractStatus.ACTIVE
        )

    # Payment Filters

    def filter_by_payment_status(self, payment_status: str) -> QuerySet:
        """Filter contracts by payment status."""
        return self.get_queryset().filter(payment_status=payment_status)

    def get_paid_contracts(self) -> QuerySet:
        """Get contracts with paid status."""
        return self.get_queryset().filter(payment_status=PaymentStatus.PAID)

    def get_pending_payment_contracts(self) -> QuerySet:
        """Get contracts with pending payment."""
        return self.get_queryset().filter(payment_status=PaymentStatus.PENDING)

    def get_overdue_payment_contracts(self) -> QuerySet:
        """Get contracts with overdue payment."""
        return self.get_queryset().filter(payment_status=PaymentStatus.OVERDUE)

    def get_next_billing_due(self, days: int = 7) -> QuerySet:
        """
        Get contracts with billing due within specified days.

        Args:
            days: Number of days to look ahead

        Returns:
            QuerySet of contracts with upcoming billing
        """
        today = timezone.now().date()
        billing_threshold = today + timedelta(days=days)
        return self.get_queryset().filter(
            next_billing_date__gte=today,
            next_billing_date__lte=billing_threshold
        )

    # Advanced Search

    def search_contracts(
        self,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        is_renewable: Optional[bool] = None,
        is_auto_renew: Optional[bool] = None,
        start_date_from: Optional[date] = None,
        start_date_to: Optional[date] = None,
        end_date_from: Optional[date] = None,
        end_date_to: Optional[date] = None
    ) -> QuerySet:
        """
        Advanced contract search with multiple filters.

        Args:
            client_id: Filter by client
            status: Contract status
            payment_status: Payment status
            is_renewable: Renewable flag
            is_auto_renew: Auto-renewal flag
            start_date_from: Minimum start date
            start_date_to: Maximum start date
            end_date_from: Minimum end date
            end_date_to: Maximum end date

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if status:
            queryset = queryset.filter(status=status)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        if is_renewable is not None:
            queryset = queryset.filter(is_renewable=is_renewable)
        if is_auto_renew is not None:
            queryset = queryset.filter(is_auto_renew=is_auto_renew)
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        if end_date_from:
            queryset = queryset.filter(end_date__gte=end_date_from)
        if end_date_to:
            queryset = queryset.filter(end_date__lte=end_date_to)

        return queryset

    # Business Logic Queries

    def get_client_active_contracts(self, client_id: str) -> QuerySet:
        """Get active contracts for a client."""
        return self.get_queryset().filter(
            client_id=client_id,
            status=ContractStatus.ACTIVE
        )

    def get_recent_contracts(self, days: int = 30) -> QuerySet:
        """
        Get contracts created within the specified number of days.

        Args:
            days: Number of days to look back

        Returns:
            QuerySet of recent contracts
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.get_queryset().filter(created_at__gte=cutoff_date)
