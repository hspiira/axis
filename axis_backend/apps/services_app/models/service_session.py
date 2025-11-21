"""ServiceSession model - actual service delivery sessions."""
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import SessionStatus


class ServiceSession(BaseModel):
    """
    Individual service delivery session.

    Responsibilities:
    - Track scheduled and completed sessions
    - Link sessions to persons (employees/dependents) and providers
    - Manage session lifecycle and outcomes
    """

    service = models.ForeignKey(
        'services_app.Service',
        on_delete=models.PROTECT,
        related_name='sessions',
        db_index=True,
        help_text="Service being provided"
    )
    provider = models.ForeignKey(
        'services_app.ServiceProvider',
        on_delete=models.PROTECT,
        related_name='sessions',
        db_index=True,
        help_text="Provider delivering service"
    )
    person = models.ForeignKey(
        'persons.Person',
        on_delete=models.PROTECT,
        related_name='service_sessions',
        db_index=True,
        help_text="Person (employee or dependent) receiving service"
    )
    scheduled_at = models.DateTimeField(
        db_index=True,
        help_text="Scheduled session date and time"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Actual completion timestamp"
    )
    status = models.CharField(
        max_length=20,
        choices=SessionStatus.choices,
        default=SessionStatus.SCHEDULED,
        db_index=True,
        help_text="Session status"
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Session notes (confidential)"
    )
    feedback = models.TextField(
        null=True,
        blank=True,
        help_text="Post-session feedback"
    )
    duration = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Actual session duration in minutes"
    )
    location = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Session location or platform"
    )
    cancellation_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Reason if canceled"
    )
    reschedule_count = models.IntegerField(
        default=0,
        help_text="Number of times rescheduled"
    )
    is_group_session = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this is a group session"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Session-specific data"
    )

    class Meta:
        db_table = 'service_sessions'
        verbose_name = 'Service Session'
        verbose_name_plural = 'Service Sessions'
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['provider']),
            models.Index(fields=['person']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_at']),
            models.Index(fields=['is_group_session']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.service.name} - {self.person.profile.full_name} ({self.scheduled_at.date()})"

    def clean(self):
        """Validate session eligibility."""
        super().clean()

        # Verify person is eligible for services
        if self.person and not self.person.is_eligible_for_services:
            raise ValidationError(
                f"{self.person.profile.full_name} is not currently eligible for EAP services."
            )

    def complete(self, duration: int = None, notes: str = None) -> None:
        """Mark session as completed and update person's service tracking."""
        from django.utils import timezone
        self.status = SessionStatus.COMPLETED
        self.completed_at = timezone.now()
        if duration:
            self.duration = duration
        if notes:
            self.notes = notes
        self.save(update_fields=['status', 'completed_at', 'duration', 'notes', 'updated_at'])

        # Update person's last service date
        if self.person:
            self.person.update_last_service_date(self.completed_at.date())

    def cancel(self, reason: str) -> None:
        """Cancel session."""
        self.status = SessionStatus.CANCELED
        self.cancellation_reason = reason
        self.save(update_fields=['status', 'cancellation_reason', 'updated_at'])

    def reschedule(self, new_datetime: models.DateTimeField) -> None:
        """Reschedule session."""
        self.status = SessionStatus.RESCHEDULED
        self.scheduled_at = new_datetime
        self.reschedule_count += 1
        self.save(update_fields=['status', 'scheduled_at', 'reschedule_count', 'updated_at'])
