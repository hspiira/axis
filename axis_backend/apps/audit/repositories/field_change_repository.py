"""Repository for FieldChange model data access."""
from typing import Optional
from django.db.models import QuerySet, F

from axis_backend.repositories.base import BaseRepository
from apps.audit.models import FieldChange


class FieldChangeRepository(BaseRepository[FieldChange]):
    """
    Repository for FieldChange model.

    Responsibilities:
    - FieldChange data access operations
    - Filtering by entity change, field name, change type
    - Field history queries
    """

    model = FieldChange

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with relationships.

        Returns:
            QuerySet with select_related for entity_change
        """
        return super().get_queryset().select_related('entity_change')

    # Query Methods

    def filter_by_entity_change(self, entity_change_id: str) -> QuerySet:
        """Filter field changes by parent entity change."""
        return self.get_queryset().filter(entity_change_id=entity_change_id)

    def filter_by_field_name(self, field_name: str) -> QuerySet:
        """Filter changes by field name."""
        return self.get_queryset().filter(field_name=field_name)

    def filter_by_change_type(self, change_type: str) -> QuerySet:
        """Filter changes by type."""
        return self.get_queryset().filter(change_type=change_type)

    def get_field_history(
        self,
        entity_type: str,
        entity_id: str,
        field_name: str
    ) -> QuerySet:
        """
        Get complete history for a specific field.

        Args:
            entity_type: Entity model name
            entity_id: Entity identifier
            field_name: Field to get history for

        Returns:
            QuerySet of field changes ordered by time
        """
        return self.get_queryset().filter(
            entity_change__entity_type=entity_type,
            entity_change__entity_id=entity_id,
            field_name=field_name
        ).select_related('entity_change').order_by('entity_change__changed_at')

    def get_changed_fields_only(self) -> QuerySet:
        """Get only field changes where value actually changed."""
        return self.get_queryset().exclude(old_value=F('new_value'))

    def search_field_changes(
        self,
        *,
        entity_change_id: Optional[str] = None,
        field_name: Optional[str] = None,
        change_type: Optional[str] = None
    ) -> QuerySet:
        """Advanced field change search."""
        queryset = self.get_queryset()

        if entity_change_id is not None:
            queryset = queryset.filter(entity_change_id=entity_change_id)
        if field_name is not None:
            queryset = queryset.filter(field_name=field_name)
        if change_type is not None:
            queryset = queryset.filter(change_type=change_type)

        return queryset
