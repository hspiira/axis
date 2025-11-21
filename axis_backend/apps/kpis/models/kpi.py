"""KPI model - key performance indicators for contracts."""
from django.db import models

from axis_backend.models import BaseModel
from axis_backend.enums import Unit, Frequency
from .kpi_type import KPIType


class KPI(BaseModel):
    """
    Key Performance Indicator definition.

    Responsibilities:
    - Define measurable performance metrics
    - Store calculation methods and targets
    - Link to contracts and clients
    - Support public/private visibility
    """

    name = models.CharField(
        max_length=255,
        db_index=True,
        help_text="KPI name (e.g., 'Session Attendance Rate')"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Detailed KPI definition and purpose"
    )
    type = models.ForeignKey(
        KPIType,
        on_delete=models.PROTECT,
        related_name='kpis',
        db_index=True,
        help_text="KPI classification"
    )
    unit = models.CharField(
        max_length=50,
        help_text="Measurement unit (e.g., '%', 'count', 'hours')"
    )
    unit_type = models.CharField(
        max_length=20,
        choices=Unit.choices,
        help_text="Unit classification"
    )
    target_value = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Target/goal value (as string for flexibility)"
    )
    calculation_method = models.TextField(
        null=True,
        blank=True,
        help_text="How KPI is calculated or measured"
    )
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Measurement frequency"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Visible in public reports"
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='kpis',
        help_text="Client-specific KPI"
    )
    contract = models.ForeignKey(
        'contracts.Contract',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='kpis',
        help_text="Contract-specific KPI"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional KPI configuration"
    )

    class Meta:
        db_table = 'kpis'
        verbose_name = 'KPI'
        verbose_name_plural = 'KPIs'
        ordering = ['type', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['type']),
            models.Index(fields=['client']),
            models.Index(fields=['contract']),
            models.Index(fields=['is_public']),
            models.Index(fields=['frequency']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit})"

    def __repr__(self):
        return f"<KPI: {self.name}>"
