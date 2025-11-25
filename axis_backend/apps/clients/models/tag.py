"""Client Tag model - flexible client categorization system."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel


class ClientTag(BaseModel):
    """
    Flexible tagging system for client categorization.

    Responsibilities:
    - Store tag definitions (name, color, description)
    - Enable flexible client segmentation beyond industry classification
    - Support multiple tags per client for rich categorization

    Examples: "VIP", "High-Risk", "Enterprise", "SMB", "Churned", "Hot-Lead"
    """

    name = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Tag label (e.g., 'VIP', 'Enterprise')"
    )
    slug = models.SlugField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="URL-friendly version of name"
    )
    color = models.CharField(
        max_length=7,
        default='#6B7280',
        help_text="Hex color code for visual identification (e.g., '#10B981')"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Purpose and usage guidance for this tag"
    )
    is_system = models.BooleanField(
        default=False,
        db_index=True,
        help_text="System-managed tag that cannot be deleted by users"
    )

    class Meta:
        db_table = 'client_tags'
        verbose_name = 'Client Tag'
        verbose_name_plural = 'Client Tags'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_system']),
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<ClientTag: {self.name} ({self.color})>"

    def clean(self):
        """Validate tag data before saving."""
        super().clean()

        # Validate hex color format
        if self.color and not self.color.startswith('#'):
            raise ValidationError({'color': 'Color must be a hex code starting with #'})

        if self.color and len(self.color) != 7:
            raise ValidationError({'color': 'Color must be 7 characters (#RRGGBB)'})

        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
