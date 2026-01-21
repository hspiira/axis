"""Repository for KPI model data access."""
from typing import Optional, List
from django.db.models import QuerySet, Q

from axis_backend.repositories.base import BaseRepository
from apps.kpis.models import KPI, KPIType


class KPIRepository(BaseRepository[KPI]):
    """
    Repository for KPI model.

    Responsibilities (Single Responsibility Principle):
    - KPI data access operations
    - Complex filtering and searching
    - Relationship loading optimization

    Design Notes:
    - Extends BaseRepository for common CRUD
    - KPI-specific queries with relationships
    - Supports client/contract filtering
    """

    model = KPI

    def get_queryset(self) -> QuerySet:
        """
        Get optimized queryset with relationships.

        Returns:
            QuerySet with select_related for type
        """
        return super().get_queryset().select_related(
            'type',
            'client',
            'contract'
        )

    # Query Methods

    def find_by_name(self, name: str) -> Optional[KPI]:
        """
        Find KPI by exact name.

        Args:
            name: KPI name

        Returns:
            KPI instance or None
        """
        return self.get_queryset().filter(name=name).first()

    def search_by_name(self, query: str) -> QuerySet:
        """
        Search KPIs by name (case-insensitive).

        Args:
            query: Search query

        Returns:
            QuerySet of matching KPIs
        """
        return self.get_queryset().filter(
            name__icontains=query
        )

    def filter_by_type(self, kpi_type_id: str) -> QuerySet:
        """
        Filter KPIs by type.

        Args:
            kpi_type_id: KPI type ID

        Returns:
            QuerySet of KPIs with specified type
        """
        return self.get_queryset().filter(type_id=kpi_type_id)

    def filter_by_client(self, client_id: str) -> QuerySet:
        """
        Filter KPIs by client (including null for global KPIs).

        Args:
            client_id: Client ID

        Returns:
            QuerySet of KPIs for client or global
        """
        return self.get_queryset().filter(
            Q(client_id=client_id) | Q(client__isnull=True)
        )

    def filter_by_contract(self, contract_id: str) -> QuerySet:
        """
        Filter KPIs by contract.

        Args:
            contract_id: Contract ID

        Returns:
            QuerySet of KPIs for contract
        """
        return self.get_queryset().filter(contract_id=contract_id)

    def filter_by_unit_type(self, unit_type: str) -> QuerySet:
        """
        Filter KPIs by unit type.

        Args:
            unit_type: Unit type enum value

        Returns:
            QuerySet of KPIs with specified unit type
        """
        return self.get_queryset().filter(unit_type=unit_type)

    def filter_by_frequency(self, frequency: str) -> QuerySet:
        """
        Filter KPIs by measurement frequency.

        Args:
            frequency: Frequency enum value

        Returns:
            QuerySet of KPIs with specified frequency
        """
        return self.get_queryset().filter(frequency=frequency)

    def get_public_kpis(self) -> QuerySet:
        """
        Get all public KPIs.

        Returns:
            QuerySet of public KPIs
        """
        return self.get_queryset().filter(is_public=True)

    def get_private_kpis(self) -> QuerySet:
        """
        Get all private KPIs.

        Returns:
            QuerySet of private KPIs
        """
        return self.get_queryset().filter(is_public=False)

    def get_global_kpis(self) -> QuerySet:
        """
        Get global KPIs (not client or contract specific).

        Returns:
            QuerySet of global KPIs
        """
        return self.get_queryset().filter(
            client__isnull=True,
            contract__isnull=True
        )

    def get_client_specific_kpis(self, client_id: str) -> QuerySet:
        """
        Get client-specific KPIs only (excluding global).

        Args:
            client_id: Client ID

        Returns:
            QuerySet of client-specific KPIs
        """
        return self.get_queryset().filter(
            client_id=client_id,
            contract__isnull=True
        )

    def get_contract_specific_kpis(self, contract_id: str) -> QuerySet:
        """
        Get contract-specific KPIs.

        Args:
            contract_id: Contract ID

        Returns:
            QuerySet of contract-specific KPIs
        """
        return self.get_queryset().filter(contract_id=contract_id)

    # Complex Filters

    def search_kpis(
        self,
        query: Optional[str] = None,
        kpi_type_id: Optional[str] = None,
        client_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        is_public: Optional[bool] = None,
        frequency: Optional[str] = None,
        unit_type: Optional[str] = None
    ) -> QuerySet:
        """
        Advanced KPI search with multiple filters.

        Args:
            query: Name search query
            kpi_type_id: Filter by KPI type
            client_id: Filter by client (includes global)
            contract_id: Filter by contract
            is_public: Filter by public/private
            frequency: Filter by measurement frequency
            unit_type: Filter by unit type

        Returns:
            QuerySet matching all specified filters
        """
        queryset = self.get_queryset()

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query)
            )

        if kpi_type_id:
            queryset = queryset.filter(type_id=kpi_type_id)

        if client_id:
            queryset = queryset.filter(
                Q(client_id=client_id) | Q(client__isnull=True)
            )

        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)

        if is_public is not None:
            queryset = queryset.filter(is_public=is_public)

        if frequency:
            queryset = queryset.filter(frequency=frequency)

        if unit_type:
            queryset = queryset.filter(unit_type=unit_type)

        return queryset
