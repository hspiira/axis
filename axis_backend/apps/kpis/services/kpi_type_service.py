"""Service for KPIType business logic."""
from typing import Optional, List, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from apps.kpis.models import KPIType
from apps.kpis.repositories import KPITypeRepository


class KPITypeService(BaseService[KPIType]):
    """
    Service for KPIType business logic.

    Responsibilities (Single Responsibility Principle):
    - KPI type creation and management
    - Business rule validation
    - Weight management
    - Transaction coordination

    Design Notes:
    - Extends BaseService for common operations
    - Enforces unique name constraint
    - Validates weight values
    """

    repository_class = KPITypeRepository

    # Create Operations

    @transaction.atomic
    def create_kpi_type(
        self,
        name: str,
        description: Optional[str] = None,
        weight: Optional[int] = None,
        **kwargs
    ) -> KPIType:
        """
        Create new KPI type with validation.

        Business Rules:
        - Name must be unique
        - Weight must be positive if provided
        - Name cannot be empty

        Args:
            name: KPI type name
            description: Optional description
            weight: Relative importance weight
            **kwargs: Additional fields

        Returns:
            Created KPIType instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate name
        if not name or not name.strip():
            raise ValidationError("KPI type name cannot be empty")

        # Check uniqueness
        if self.repository.find_by_name(name):
            raise ValidationError(f"KPI type with name '{name}' already exists")

        # Validate weight
        if weight is not None and weight < 0:
            raise ValidationError("Weight must be positive")

        # Create KPI type
        return self.repository.create(
            name=name.strip(),
            description=description,
            weight=weight,
            **kwargs
        )

    # Update Operations

    @transaction.atomic
    def update_kpi_type(
        self,
        kpi_type_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        weight: Optional[int] = None,
        **kwargs
    ) -> KPIType:
        """
        Update KPI type with validation.

        Business Rules:
        - Name must remain unique if changed
        - Weight must be positive if provided

        Args:
            kpi_type_id: KPI type ID
            name: New name (optional)
            description: New description (optional)
            weight: New weight (optional)
            **kwargs: Additional fields to update

        Returns:
            Updated KPIType instance

        Raises:
            ValidationError: If validation fails
        """
        kpi_type = self.repository.get_by_id(kpi_type_id)

        # Validate name uniqueness if changing
        if name and name != kpi_type.name:
            if not name.strip():
                raise ValidationError("KPI type name cannot be empty")
            if self.repository.find_by_name(name):
                raise ValidationError(f"KPI type with name '{name}' already exists")
            kwargs['name'] = name.strip()

        # Validate weight
        if weight is not None and weight < 0:
            raise ValidationError("Weight must be positive")

        if description is not None:
            kwargs['description'] = description
        if weight is not None:
            kwargs['weight'] = weight

        return self.repository.update(kpi_type_id, **kwargs)

    # Query Operations

    def get_by_name(self, name: str) -> Optional[KPIType]:
        """
        Get KPI type by name.

        Args:
            name: KPI type name

        Returns:
            KPIType instance or None
        """
        return self.repository.find_by_name(name)

    def search_by_name(self, query: str) -> List[KPIType]:
        """
        Search KPI types by name.

        Args:
            query: Search query

        Returns:
            List of matching KPI types
        """
        return list(self.repository.search_by_name(query))

    def get_by_weight_range(
        self,
        min_weight: Optional[int] = None,
        max_weight: Optional[int] = None
    ) -> List[KPIType]:
        """
        Get KPI types within weight range.

        Args:
            min_weight: Minimum weight
            max_weight: Maximum weight

        Returns:
            List of KPI types in range
        """
        return list(self.repository.filter_by_weight_range(min_weight, max_weight))

    def get_ordered_by_weight(self) -> List[KPIType]:
        """
        Get all KPI types ordered by weight (highest first).

        Returns:
            List of KPI types ordered by weight
        """
        return list(self.repository.get_by_weight_descending())

    # Bulk Operations

    @transaction.atomic
    def create_bulk_kpi_types(self, types_data: List[Dict[str, Any]]) -> List[KPIType]:
        """
        Create multiple KPI types.

        Business Rules:
        - All names must be unique
        - All weights must be positive

        Args:
            types_data: List of KPI type data dictionaries

        Returns:
            List of created KPI types

        Raises:
            ValidationError: If any validation fails
        """
        # Validate all entries
        names = []
        for data in types_data:
            name = data.get('name', '').strip()
            if not name:
                raise ValidationError("All KPI type names must be non-empty")

            if name in names:
                raise ValidationError(f"Duplicate name in bulk create: '{name}'")
            names.append(name)

            # Check existing
            if self.repository.find_by_name(name):
                raise ValidationError(f"KPI type with name '{name}' already exists")

            # Validate weight
            weight = data.get('weight')
            if weight is not None and weight < 0:
                raise ValidationError(f"Weight must be positive for '{name}'")

            # Clean name
            data['name'] = name

        return self.repository.bulk_create_types(types_data)
