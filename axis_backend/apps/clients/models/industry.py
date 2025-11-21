"""Industry model - handles industry classification with hierarchical support."""
from django.db import models

from axis_backend.models import BaseModel


class Industry(BaseModel):
    """
    Industry classification with support for hierarchical relationships.

    Responsibilities (Single Responsibility Principle):
    - Store industry classification data
    - Manage parent-child industry relationships
    - Provide hierarchical path navigation

    Design Notes:
    - Self-referential FK enables tree structure without additional tables
    - External ID supports integration with government/third-party systems
    - Metadata field allows extension without schema changes (Open/Closed)
    """

    name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Industry name"
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Standard classification code (NAICS, ISIC, etc.)"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Industry description and scope"
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        db_index=True,
        help_text="Parent industry in hierarchy"
    )
    external_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        help_text="Reference ID from external classification system"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional attributes (e.g., tags, categories)"
    )

    class Meta:
        db_table = 'industries'
        verbose_name = 'Industry'
        verbose_name_plural = 'Industries'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['code']),
            models.Index(fields=['parent']),
            models.Index(fields=['external_id']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<Industry: {self.name} ({self.id})>"

    @property
    def full_path(self) -> str:
        """
        Build complete hierarchical path from root to current industry.

        Example: 'Technology > Software > Cloud Services'
        Performance: O(depth) - avoid on large querysets, use select_related
        """
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name

    @property
    def depth(self) -> int:
        """Calculate depth level in hierarchy (root = 0)."""
        if self.parent is None:
            return 0
        return 1 + self.parent.depth

    @property
    def has_children(self) -> bool:
        """Check if industry has sub-industries."""
        return self.children.exists()

    def get_ancestors(self):
        """
        Retrieve all parent industries up to root.
        Returns QuerySet ordered from immediate parent to root.
        """
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors

    def get_descendants(self):
        """
        Retrieve all child industries recursively.
        Warning: Can be expensive on deep hierarchies.
        """
        descendants = list(self.children.all())
        for child in self.children.all():
            descendants.extend(child.get_descendants())
        return descendants
