"""Service model - specific EAP service offerings."""
from django.db import models
from django.core.validators import MinValueValidator

from axis_backend.models import BaseModel
from axis_backend.enums import BaseStatus
from .service_category import ServiceCategory


class Service(BaseModel):
    """
    Specific EAP service offering.

    Responsibilities (Single Responsibility Principle):
    - Define service details and configuration
    - Track service availability and capacity
    - Manage service pricing and eligibility
    - Link to service category and provider

    Design Notes:
    - Services belong to categories for organization
    - Optional provider assignment (can be assigned later)
    - Duration in minutes for scheduling
    - Capacity limits for group services
    - Public/private flag for service catalog visibility
    """

    name = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Service name (e.g., 'Individual Counseling', 'Legal Consultation')"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Detailed service description and scope"
    )

    # === Classification ===
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.PROTECT,
        related_name='services',
        db_index=True,
        help_text="Service category classification"
    )

    # === Service Configuration ===
    status = models.CharField(
        max_length=20,
        choices=BaseStatus.choices,
        default=BaseStatus.ACTIVE,
        db_index=True,
        help_text="Service availability status"
    )
    duration = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Typical session duration in minutes"
    )
    capacity = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Maximum participants (for group sessions)"
    )
    prerequisites = models.TextField(
        null=True,
        blank=True,
        help_text="Requirements or conditions for service access"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Visible in public service catalog"
    )

    # === Pricing (Optional) ===
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Service cost (if applicable)"
    )

    # === Provider Assignment ===
    service_provider = models.ForeignKey(
        'services_app.ServiceProvider',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='services',
        help_text="Default provider for this service"
    )

    # === Additional Information ===
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Service-specific attributes and configuration"
    )

    class Meta:
        db_table = 'services'
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['is_public']),
            models.Index(fields=['service_provider']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    def __repr__(self):
        return f"<Service: {self.name}>"

    @property
    def is_available(self) -> bool:
        """Check if service is active and available."""
        return self.status == BaseStatus.ACTIVE and self.deleted_at is None

    @property
    def is_group_service(self) -> bool:
        """Check if service supports multiple participants."""
        return self.capacity is not None and self.capacity > 1

    def activate(self) -> None:
        """Make service available."""
        self.status = BaseStatus.ACTIVE
        self.save(update_fields=['status', 'updated_at'])

    def deactivate(self) -> None:
        """Make service unavailable."""
        self.status = BaseStatus.INACTIVE
        self.save(update_fields=['status', 'updated_at'])
