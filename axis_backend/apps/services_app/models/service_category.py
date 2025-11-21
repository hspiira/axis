"""ServiceCategory model - classification for EAP services."""
from django.db import models

from axis_backend.models import BaseModel


class ServiceCategory(BaseModel):
    """
    Service category for organizing EAP service types.

    Responsibilities (Single Responsibility Principle):
    - Classify services into logical groups
    - Enable service discovery and filtering
    - Support service catalog organization

    Design Notes:
    - Simple flat structure (no hierarchy needed for EAP)
    - Examples: Counseling, Legal, Financial, Wellness, Crisis
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Category name (e.g., 'Counseling', 'Legal Assistance')"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Category purpose and scope"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional category attributes"
    )

    class Meta:
        db_table = 'service_categories'
        verbose_name = 'Service Category'
        verbose_name_plural = 'Service Categories'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<ServiceCategory: {self.name}>"

    @property
    def service_count(self) -> int:
        """Count active services in this category."""
        return self.services.filter(deleted_at__isnull=True).count()
