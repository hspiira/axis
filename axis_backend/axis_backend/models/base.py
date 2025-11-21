from django.db import models
from django.utils import timezone

from axis_backend.utils import generate_cuid

class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted records"""
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class BaseModel(models.Model):
    """Abstract base model with common fields for all models"""
    id = models.CharField(primary_key=True, default=generate_cuid, editable=False, max_length=25)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Include deleted records

    class Meta:
        abstract = True

    def soft_delete(self):
        """Soft delete this record"""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        """Restore a soft-deleted record"""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])