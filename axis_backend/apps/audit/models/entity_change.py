"""EntityChange model - detailed entity change tracking."""
from django.db import models

from axis_backend.models import BaseModel
from axis_backend.enums import ChangeType


class EntityChange(BaseModel):
    """
    Detailed entity-level change tracking.

    Responsibilities:
    - Record complete entity state changes
    - Store old and new data for comparison
    - Track change metadata (who, when, why)
    - Support change history queries

    Design Notes:
    - Stores complete entity snapshots before/after
    - Links to field-level changes for granularity
    - Supports soft delete for data retention
    """

    entity_type = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Entity model name (e.g., 'Client', 'Contract')"
    )
    entity_id = models.CharField(
        max_length=25,
        db_index=True,
        help_text="Entity unique identifier"
    )
    change_type = models.CharField(
        max_length=20,
        choices=ChangeType.choices,
        db_index=True,
        help_text="Type of change operation"
    )
    changed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When change occurred"
    )
    changed_by = models.CharField(
        max_length=25,
        null=True,
        blank=True,
        db_index=True,
        help_text="User ID who made change"
    )
    change_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Explanation for change"
    )
    old_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Entity state before change"
    )
    new_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Entity state after change"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional change context"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether change record is active"
    )

    class Meta:
        db_table = 'entity_changes'
        verbose_name = 'Entity Change'
        verbose_name_plural = 'Entity Changes'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['entity_type']),
            models.Index(fields=['entity_id']),
            models.Index(fields=['entity_type', 'entity_id', 'changed_at']),
            models.Index(fields=['changed_at']),
            models.Index(fields=['changed_by']),
            models.Index(fields=['change_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['deleted_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['entity_type', 'entity_id', 'changed_at'],
                name='unique_entity_change'
            )
        ]

    def __str__(self):
        return f"{self.change_type} on {self.entity_type}#{self.entity_id}"

    def __repr__(self):
        return f"<EntityChange: {self.change_type} {self.entity_type}>"

    @classmethod
    def record_change(
        cls,
        entity_type: str,
        entity_id: str,
        change_type: str,
        changed_by: str = None,
        change_reason: str = None,
        old_data: dict = None,
        new_data: dict = None,
        **kwargs
    ) -> 'EntityChange':
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
        return cls.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            change_type=change_type,
            changed_by=changed_by,
            change_reason=change_reason,
            old_data=old_data,
            new_data=new_data,
            metadata=kwargs
        )

    def get_field_changes(self):
        """
        Retrieve detailed field-level changes.

        Returns:
            QuerySet: FieldChange objects
        """
        return self.field_changes.filter(deleted_at__isnull=True)
