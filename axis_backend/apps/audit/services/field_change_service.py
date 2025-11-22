"""Service for FieldChange business logic."""
from typing import Optional
from django.db import transaction

from axis_backend.enums.choices import ChangeType
from axis_backend.services.base import BaseService
from apps.audit.models import FieldChange
from apps.audit.repositories import FieldChangeRepository


class FieldChangeService(BaseService[FieldChange]):
    """
    Service for FieldChange business logic.

    Responsibilities:
    - Field change recording
    - Field history queries
    - Change analysis
    """

    repository_class = FieldChangeRepository

    # Create Operations

    @transaction.atomic
    def record_field_change(
        self,
        entity_change,
        field_name: str,
        old_value,
        new_value,
        change_type: str = ChangeType.UPDATE
    ) -> FieldChange:
        """
        Record a field change.

        Args:
            entity_change: Parent EntityChange instance
            field_name: Field that changed
            old_value: Previous value
            new_value: New value
            change_type: Type of change

        Returns:
            FieldChange: Created field change record
        """
        return FieldChange.record_field_change(
            entity_change=entity_change,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            change_type=change_type
        )

    # Query Operations

    def get_by_entity_change(self, entity_change_id: str) -> list[FieldChange]:
        """Get all field changes for an entity change."""
        return list(self.repository.filter_by_entity_change(entity_change_id))

    def get_field_history(
        self,
        entity_type: str,
        entity_id: str,
        field_name: str
    ) -> list[FieldChange]:
        """Get complete history for a specific field."""
        return list(self.repository.get_field_history(entity_type, entity_id, field_name))

    def get_by_field_name(self, field_name: str) -> list[FieldChange]:
        """Get all changes for a specific field name."""
        return list(self.repository.filter_by_field_name(field_name))

    def search_field_changes(
        self,
        *,
        entity_change_id: Optional[str] = None,
        field_name: Optional[str] = None,
        change_type: Optional[str] = None
    ) -> list[FieldChange]:
        """Advanced field change search."""
        return list(self.repository.search_field_changes(
            entity_change_id=entity_change_id,
            field_name=field_name,
            change_type=change_type
        ))
