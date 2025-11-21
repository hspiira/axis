"""AuditLog model - high-level action audit trail."""
from django.db import models

from axis_backend.utils import generate_cuid
from axis_backend.enums import ActionType


class AuditLog(models.Model):
    """
    High-level audit log for user actions.

    Responsibilities:
    - Track all user actions in system
    - Record request metadata (IP, user agent)
    - Support security monitoring and compliance
    - Enable user activity reporting

    Design Notes:
    - Not using BaseModel (no soft delete needed)
    - Immutable records for compliance
    - Indexed for fast queries by user/action/time
    """

    id = models.CharField(
        primary_key=True,
        default=generate_cuid,
        editable=False,
        max_length=25
    )
    action = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        db_index=True,
        help_text="Action performed"
    )
    entity_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
        help_text="Type of entity affected (e.g., 'Client', 'Contract')"
    )
    entity_id = models.CharField(
        max_length=25,
        null=True,
        blank=True,
        db_index=True,
        help_text="ID of affected entity"
    )
    data = models.JSONField(
        null=True,
        blank=True,
        help_text="Additional action context and data"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address"
    )
    user_agent = models.TextField(
        null=True,
        blank=True,
        help_text="Client user agent string"
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        db_index=True,
        help_text="User who performed action"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When action occurred"
    )

    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"

    def __repr__(self):
        return f"<AuditLog: {self.action} on {self.entity_type}>"

    @classmethod
    def log_action(
        cls,
        action: str,
        user=None,
        entity_type: str = None,
        entity_id: str = None,
        data: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ) -> 'AuditLog':
        """
        Create an audit log entry.

        Args:
            action: Action type
            user: User performing action
            entity_type: Type of entity
            entity_id: Entity identifier
            data: Additional context
            ip_address: Client IP
            user_agent: Client user agent

        Returns:
            AuditLog: Created log entry
        """
        return cls.objects.create(
            action=action,
            user=user,
            entity_type=entity_type,
            entity_id=entity_id,
            data=data,
            ip_address=ip_address,
            user_agent=user_agent
        )
