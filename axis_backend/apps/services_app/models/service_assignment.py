"""ServiceAssignment model - assigns services to contracts."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import AssignmentStatus, Frequency


class ServiceAssignment(BaseModel):
    """
    Assignment of service to client contract.

    Responsibilities:
    - Link services to specific contracts
    - Define service delivery frequency
    - Track assignment lifecycle
    """

    service = models.ForeignKey(
        'services_app.Service',
        on_delete=models.PROTECT,
        related_name='assignments',
        db_index=True,
        help_text="Assigned service"
    )
    contract = models.ForeignKey(
        'contracts.Contract',
        on_delete=models.PROTECT,
        related_name='service_assignments',
        db_index=True,
        help_text="Contract under which service is provided"
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        related_name='service_assignments',
        db_index=True,
        help_text="Client receiving service"
    )
    status = models.CharField(
        max_length=20,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.PENDING,
        db_index=True,
        help_text="Assignment status"
    )
    start_date = models.DateField(
        db_index=True,
        help_text="Service availability start date"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Service availability end date"
    )
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        help_text="Expected service frequency"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Assignment-specific configuration"
    )

    class Meta:
        db_table = 'service_assignments'
        verbose_name = 'Service Assignment'
        verbose_name_plural = 'Service Assignments'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['contract']),
            models.Index(fields=['client']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.service.name} for {self.client.name}"

    def clean(self):
        super().clean()
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date must be after start date.")
