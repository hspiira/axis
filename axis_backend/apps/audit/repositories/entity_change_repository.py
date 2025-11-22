"""Repository for EntityChange model data access."""
from typing import Optional
from datetime import datetime
from django.db.models import QuerySet, Q

from axis_backend.repositories.base import BaseRepository
from apps.audit.models import EntityChange


class EntityChangeRepository(BaseRepository[EntityChange]):
    """
    Repository for EntityChange model.

    Responsibilities:
    - EntityChange data access operations
    - Filtering by entity, change type, user, time
    - Change history queries
    """

    model = EntityChange

    def get_queryset(self) -> QuerySet:
        """Get queryset."""
        return super().get_queryset()

    # Create Operations

    def record_change(
        self,
        entity_type: str,
        entity_id: str,
        change_type: str,
        changed_by: Optional[str] = None,
        change_reason: Optional[str] = None,
        old_data: Optional[dict] = None,
        new_data: Optional[dict] = None,
        **kwargs
    ) -> EntityChange:
        """
        Record an entity change.

        Encapsulates persistence logic for entity change records.
        All writes to EntityChange should go through this method.

        Args:
            entity_type: Entity model name
            entity_id: Entity identifier
            change_type: Type of change
            changed_by: User ID
            change_reason: Explanation
            old_data: Previous state
            new_data: New state
            **kwargs: Additional metadata

        Returns:
            EntityChange: Created change record
        """
        return self.model.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            change_type=change_type,
            changed_by=changed_by,
            change_reason=change_reason,
            old_data=old_data,
            new_data=new_data,
            metadata=kwargs
        )

    # Query Methods

    def filter_by_entity(self, entity_type: str, entity_id: Optional[str] = None) -> QuerySet:
        """Filter changes by entity type and optionally ID."""
        queryset = self.get_queryset().filter(entity_type=entity_type)
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)
        return queryset

    def filter_by_change_type(self, change_type: str) -> QuerySet:
        """Filter changes by type."""
        return self.get_queryset().filter(change_type=change_type)

    def filter_by_user(self, user_id: str) -> QuerySet:
        """Filter changes by user who made them."""
        return self.get_queryset().filter(changed_by=user_id)

    def filter_by_date_range(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> QuerySet:
        """Filter changes by date range."""
        queryset = self.get_queryset()
        if start_date:
            queryset = queryset.filter(changed_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(changed_at__lte=end_date)
        return queryset

    def get_active_changes(self) -> QuerySet:
        """Get active change records."""
        return self.get_queryset().filter(is_active=True)

    def get_entity_history(self, entity_type: str, entity_id: str) -> QuerySet:
        """Get complete change history for an entity."""
        return self.get_queryset().filter(
            entity_type=entity_type,
            entity_id=entity_id
        ).order_by('changed_at')

    def get_recent_changes(self, days: int = 7) -> QuerySet:
        """Get changes from recent days."""
        from datetime import timedelta
        from django.utils import timezone
        cutoff = timezone.now() - timedelta(days=days)
        return self.get_queryset().filter(changed_at__gte=cutoff)

    def search_changes(
        self,
        *,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        change_type: Optional[str] = None,
        changed_by: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        is_active: Optional[bool] = None
    ) -> QuerySet:
        """Advanced entity change search."""
        queryset = self.get_queryset()

        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)
        if change_type:
            queryset = queryset.filter(change_type=change_type)
        if changed_by:
            queryset = queryset.filter(changed_by=changed_by)
        if start_date:
            queryset = queryset.filter(changed_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(changed_at__lte=end_date)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)

        return queryset
