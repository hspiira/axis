"""KPIAssignment model - assigns KPIs to contracts with targets."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import AssignmentStatus, Frequency
from .kpi import KPI


class KPIAssignment(BaseModel):
    """
    Assignment of KPI to contract with specific targets.

    Responsibilities:
    - Link KPIs to contracts
    - Set contract-specific targets
    - Track KPI measurement periods
    - Manage assignment lifecycle
    """

    kpi = models.ForeignKey(
        KPI,
        on_delete=models.PROTECT,
        related_name='assignments',
        db_index=True,
        help_text="KPI being tracked"
    )
    contract = models.ForeignKey(
        'contracts.Contract',
        on_delete=models.PROTECT,
        related_name='kpi_assignments',
        db_index=True,
        help_text="Contract under which KPI is measured"
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        related_name='kpi_assignments',
        db_index=True,
        help_text="Client for whom KPI is tracked"
    )
    target_value = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Contract-specific target (overrides KPI default)"
    )
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        help_text="Measurement and reporting frequency"
    )
    status = models.CharField(
        max_length=20,
        choices=AssignmentStatus.choices,
        db_index=True,
        help_text="Assignment status"
    )
    start_date = models.DateField(
        db_index=True,
        help_text="KPI tracking start date"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="KPI tracking end date"
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Assignment notes and context"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Assignment-specific data and measurements"
    )

    class Meta:
        db_table = 'kpi_assignments'
        verbose_name = 'KPI Assignment'
        verbose_name_plural = 'KPI Assignments'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['kpi']),
            models.Index(fields=['contract']),
            models.Index(fields=['client']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.kpi.name} for {self.contract}"

    def __repr__(self):
        return f"<KPIAssignment: {self.kpi.name} ({self.status})>"

    def clean(self):
        super().clean()
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date must be after start date.")

    @property
    def effective_target(self) -> str:
        """Get effective target value (assignment-specific or KPI default)."""
        return self.target_value or self.kpi.target_value

    def record_measurement(self, value: str, period: str = None) -> None:
        """
        Record a KPI measurement.

        Args:
            value: Measured value
            period: Measurement period identifier
        """
        if self.metadata is None:
            self.metadata = {}
        if 'measurements' not in self.metadata:
            self.metadata['measurements'] = []

        from django.utils import timezone
        self.metadata['measurements'].append({
            'value': value,
            'period': period,
            'recorded_at': timezone.now().isoformat()
        })
        self.save(update_fields=['metadata', 'updated_at'])
