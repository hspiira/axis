"""Service for EntityChange business logic."""
from typing import Optional
from datetime import datetime
from django.db import transaction

from axis_backend.services.base import BaseService
from apps.audit.models import EntityChange
from apps.audit.repositories import EntityChangeRepository


class EntityChangeService(BaseService[EntityChange]):
    """
    Service for EntityChange business logic.

    Responsibilities:
    - Entity change recording
    - Change history queries
    - Change validation
    """

    repository_class = EntityChangeRepository

    # Create Operations

    @transaction.atomic
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
        return self.repository.record_change(
            entity_type=entity_type,
            entity_id=entity_id,
            change_type=change_type,
            changed_by=changed_by,
            change_reason=change_reason,
            old_data=old_data,
            new_data=new_data,
            **kwargs
        )

    # Query Operations

    def get_entity_history(self, entity_type: str, entity_id: str) -> list[EntityChange]:
        """Get complete change history for an entity."""
        return list(self.repository.get_entity_history(entity_type, entity_id))

    def get_recent_changes(self, days: int = 7) -> list[EntityChange]:
        """Get recent entity changes."""
        return list(self.repository.get_recent_changes(days))

    def get_by_user(self, user_id: str) -> list[EntityChange]:
        """Get all changes made by a user."""
        return list(self.repository.filter_by_user(user_id))

    def get_by_change_type(self, change_type: str) -> list[EntityChange]:
        """Get changes of a specific type."""
        return list(self.repository.filter_by_change_type(change_type))

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
    ) -> list[EntityChange]:
        """Advanced entity change search."""
        return list(self.repository.search_changes(
            entity_type=entity_type,
            entity_id=entity_id,
            change_type=change_type,
            changed_by=changed_by,
            start_date=start_date,
            end_date=end_date,
            is_active=is_active
        ))
