"""KPIType model - categorizes and classifies KPIs."""
from django.db import models

from axis_backend.models import BaseModel


class KPIType(BaseModel):
    """
    KPI category/classification.

    Responsibilities:
    - Organize KPIs into logical groups
    - Support weighted scoring
    - Enable KPI discovery and filtering
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="KPI type name (e.g., 'Utilization', 'Satisfaction', 'Outcome')"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Type purpose and measurement approach"
    )
    weight = models.IntegerField(
        null=True,
        blank=True,
        help_text="Relative importance for scoring (higher = more important)"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional type attributes"
    )

    class Meta:
        db_table = 'kpi_types'
        verbose_name = 'KPI Type'
        verbose_name_plural = 'KPI Types'
        ordering = ['-weight', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<KPIType: {self.name}>"
