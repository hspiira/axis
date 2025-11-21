"""FieldChange model - field-level change tracking."""
from django.db import models

from axis_backend.models import BaseModel
from axis_backend.enums import ChangeType


class FieldChange(BaseModel):
    """
    Field-level change detail for granular audit trail.

    Responsibilities:
    - Track individual field modifications
    - Store old and new values
    - Link to parent entity change
    - Support field history queries

    Design Notes:
    - Many field changes belong to one entity change
    - JSON storage for flexible value types
    - Supports soft delete for data retention
    """

    entity_change = models.ForeignKey(
        'audit.EntityChange',
        on_delete=models.CASCADE,
        related_name='field_changes',
        db_index=True,
        help_text="Parent entity change record"
    )
    field_name = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Name of changed field"
    )
    old_value = models.JSONField(
        null=True,
        blank=True,
        help_text="Previous field value"
    )
    new_value = models.JSONField(
        null=True,
        blank=True,
        help_text="New field value"
    )
    change_type = models.CharField(
        max_length=20,
        choices=ChangeType.choices,
        db_index=True,
        help_text="Type of field change"
    )

    class Meta:
        db_table = 'field_changes'
        verbose_name = 'Field Change'
        verbose_name_plural = 'Field Changes'
        ordering = ['entity_change', 'field_name']
        indexes = [
            models.Index(fields=['entity_change']),
            models.Index(fields=['field_name']),
            models.Index(fields=['change_type']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.field_name}: {self.old_value} → {self.new_value}"

    def __repr__(self):
        return f"<FieldChange: {self.field_name} ({self.change_type})>"

    @property
    def has_changed(self) -> bool:
        """Check if value actually changed."""
        return self.old_value != self.new_value

    @classmethod
    def record_field_change(
        cls,
        entity_change,
        field_name: str,
        old_value,
        new_value,
        change_type: str = ChangeType.UPDATE
    ) -> 'FieldChange':
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
        return cls.objects.create(
            entity_change=entity_change,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            change_type=change_type
        )
