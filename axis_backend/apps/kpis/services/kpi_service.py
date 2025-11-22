"""Service for KPI business logic."""
from typing import Optional, List
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from apps.kpis.models import KPI, KPIType
from apps.kpis.repositories import KPIRepository


class KPIService(BaseService[KPI]):
    """
    Service for KPI business logic.

    Responsibilities (Single Responsibility Principle):
    - KPI creation and management
    - Business rule validation
    - Client/Contract relationship validation
    - Visibility management

    Design Notes:
    - Extends BaseService for common operations
    - Validates KPI type relationships
    - Enforces client/contract constraints
    """

    repository_class = KPIRepository

    # Create Operations

    @transaction.atomic
    def create_kpi(
        self,
        name: str,
        type_id: str,
        unit: str,
        unit_type: str,
        description: Optional[str] = None,
        target_value: Optional[str] = None,
        calculation_method: Optional[str] = None,
        frequency: Optional[str] = None,
        is_public: bool = True,
        client_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        **kwargs
    ) -> KPI:
        """
        Create new KPI with validation.

        Business Rules:
        - Name and type are required
        - Unit and unit_type are required
        - Type must exist
        - If contract specified, client should match contract's client
        - Contract-specific KPIs require contract_id

        Args:
            name: KPI name
            type_id: KPI type ID
            unit: Measurement unit
            unit_type: Unit classification
            description: Optional description
            target_value: Target/goal value
            calculation_method: How KPI is calculated
            frequency: Measurement frequency
            is_public: Visibility flag
            client_id: Optional client ID
            contract_id: Optional contract ID
            **kwargs: Additional fields

        Returns:
            Created KPI instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not name or not name.strip():
            raise ValidationError("KPI name cannot be empty")

        if not unit or not unit.strip():
            raise ValidationError("Unit cannot be empty")

        # Validate KPI type exists
        from apps.kpis.models import KPIType
        try:
            kpi_type = KPIType.objects.get(id=type_id)
        except KPIType.DoesNotExist:
            raise ValidationError(f"KPI type with ID '{type_id}' does not exist")

        # Validate contract belongs to client if both provided
        if contract_id and client_id:
            from apps.contracts.models import Contract
            try:
                contract = Contract.objects.get(id=contract_id)
                if str(contract.client_id) != client_id:
                    raise ValidationError("Contract does not belong to specified client")
            except Contract.DoesNotExist:
                raise ValidationError(f"Contract with ID '{contract_id}' does not exist")

        # Create KPI
        return self.repository.create(
            name=name.strip(),
            type_id=type_id,
            unit=unit.strip(),
            unit_type=unit_type,
            description=description,
            target_value=target_value,
            calculation_method=calculation_method,
            frequency=frequency,
            is_public=is_public,
            client_id=client_id,
            contract_id=contract_id,
            **kwargs
        )

    # Update Operations

    @transaction.atomic
    def update_kpi(
        self,
        kpi_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        target_value: Optional[str] = None,
        calculation_method: Optional[str] = None,
        frequency: Optional[str] = None,
        is_public: Optional[bool] = None,
        **kwargs
    ) -> KPI:
        """
        Update KPI with validation.

        Business Rules:
        - Cannot change type, client, or contract after creation
        - Name cannot be empty if provided

        Args:
            kpi_id: KPI ID
            name: New name (optional)
            description: New description (optional)
            target_value: New target value (optional)
            calculation_method: New calculation method (optional)
            frequency: New frequency (optional)
            is_public: New visibility (optional)
            **kwargs: Additional fields to update

        Returns:
            Updated KPI instance

        Raises:
            ValidationError: If validation fails
        """
        kpi = self.repository.get_by_id(kpi_id)

        # Validate name
        if name is not None:
            if not name.strip():
                raise ValidationError("KPI name cannot be empty")
            kwargs['name'] = name.strip()

        # Prevent changing immutable fields
        forbidden_fields = ['type_id', 'type', 'client_id', 'client', 'contract_id', 'contract']
        for field in forbidden_fields:
            if field in kwargs:
                raise ValidationError(f"Cannot modify {field} after creation")

        if description is not None:
            kwargs['description'] = description
        if target_value is not None:
            kwargs['target_value'] = target_value
        if calculation_method is not None:
            kwargs['calculation_method'] = calculation_method
        if frequency is not None:
            kwargs['frequency'] = frequency
        if is_public is not None:
            kwargs['is_public'] = is_public

        return self.repository.update(kpi_id, **kwargs)

    @transaction.atomic
    def toggle_visibility(self, kpi_id: str) -> KPI:
        """
        Toggle KPI public/private visibility.

        Args:
            kpi_id: KPI ID

        Returns:
            Updated KPI instance
        """
        kpi = self.repository.get_by_id(kpi_id)
        return self.repository.update(kpi_id, is_public=not kpi.is_public)

    # Query Operations

    def get_by_type(self, kpi_type_id: str) -> List[KPI]:
        """
        Get all KPIs of a specific type.

        Args:
            kpi_type_id: KPI type ID

        Returns:
            List of KPIs
        """
        return list(self.repository.filter_by_type(kpi_type_id))

    def get_by_client(self, client_id: str, include_global: bool = True) -> List[KPI]:
        """
        Get KPIs for a client.

        Args:
            client_id: Client ID
            include_global: Include global KPIs (default True)

        Returns:
            List of KPIs for client
        """
        if include_global:
            return list(self.repository.filter_by_client(client_id))
        else:
            return list(self.repository.get_client_specific_kpis(client_id))

    def get_by_contract(self, contract_id: str) -> List[KPI]:
        """
        Get KPIs for a contract.

        Args:
            contract_id: Contract ID

        Returns:
            List of KPIs for contract
        """
        return list(self.repository.filter_by_contract(contract_id))

    def get_public_kpis(self) -> List[KPI]:
        """
        Get all public KPIs.

        Returns:
            List of public KPIs
        """
        return list(self.repository.get_public_kpis())

    def get_global_kpis(self) -> List[KPI]:
        """
        Get global KPIs (not client/contract specific).

        Returns:
            List of global KPIs
        """
        return list(self.repository.get_global_kpis())

    def search_kpis(
        self,
        query: Optional[str] = None,
        kpi_type_id: Optional[str] = None,
        client_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        is_public: Optional[bool] = None,
        frequency: Optional[str] = None,
        unit_type: Optional[str] = None
    ) -> List[KPI]:
        """
        Advanced KPI search.

        Args:
            query: Name/description search
            kpi_type_id: Filter by type
            client_id: Filter by client
            contract_id: Filter by contract
            is_public: Filter by visibility
            frequency: Filter by frequency
            unit_type: Filter by unit type

        Returns:
            List of matching KPIs
        """
        return list(self.repository.search_kpis(
            query=query,
            kpi_type_id=kpi_type_id,
            client_id=client_id,
            contract_id=contract_id,
            is_public=is_public,
            frequency=frequency,
            unit_type=unit_type
        ))
