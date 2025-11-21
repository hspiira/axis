"""ServiceProvider model - external service providers and counselors."""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from axis_backend.models import BaseModel
from axis_backend.enums import ServiceProviderType, WorkStatus


class ServiceProvider(BaseModel):
    """
    External service provider (counselor, clinic, etc.).

    Responsibilities:
    - Store provider information and credentials
    - Track provider availability and verification
    - Manage provider ratings and feedback
    - Support service assignments
    """

    name = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Provider name or organization"
    )
    type = models.CharField(
        max_length=20,
        choices=ServiceProviderType.choices,
        db_index=True,
        help_text="Provider type classification"
    )
    contact_email = models.EmailField(
        null=True,
        blank=True,
        help_text="Primary contact email"
    )
    contact_phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Primary contact phone"
    )
    location = models.TextField(
        null=True,
        blank=True,
        help_text="Physical location or service area"
    )
    qualifications = models.JSONField(
        default=list,
        blank=True,
        help_text="Certifications and credentials"
    )
    specializations = models.JSONField(
        default=list,
        blank=True,
        help_text="Areas of expertise"
    )
    availability = models.JSONField(
        null=True,
        blank=True,
        help_text="Available hours and capacity"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        db_index=True,
        help_text="Average rating (0-5 scale)"
    )
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Provider verification status"
    )
    status = models.CharField(
        max_length=20,
        choices=WorkStatus.choices,
        default=WorkStatus.ACTIVE,
        db_index=True,
        help_text="Provider availability status"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional provider information"
    )

    class Meta:
        db_table = 'service_providers'
        verbose_name = 'Service Provider'
        verbose_name_plural = 'Service Providers'
        ordering = ['-rating', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['type']),
            models.Index(fields=['status']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['rating']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.type})"

    def __repr__(self):
        return f"<ServiceProvider: {self.name}>"

    @property
    def is_available(self) -> bool:
        """Check if provider is active and verified."""
        return (
            self.status == WorkStatus.ACTIVE and
            self.is_verified and
            self.deleted_at is None
        )

    def verify(self) -> None:
        """Mark provider as verified."""
        self.is_verified = True
        self.save(update_fields=['is_verified', 'updated_at'])

    def update_rating(self, new_rating: float) -> None:
        """Update provider rating."""
        self.rating = new_rating
        self.save(update_fields=['rating', 'updated_at'])
