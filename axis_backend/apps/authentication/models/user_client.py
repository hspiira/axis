"""UserClient junction table for proper client authorization."""
from django.db import models
from axis_backend.models import BaseModel


class UserClient(BaseModel):
    """
    Association between User and Client for multi-tenancy authorization.

    Responsibilities:
    - Define which clients a user has access to
    - Enable proper client-scoped authorization
    - Replace metadata-based client authorization
    - Track authorization grants for audit

    Security Notes:
    - Users can only access data for clients in this table
    - Superusers and staff bypass this check
    - Prevents horizontal privilege escalation
    """

    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='client_authorizations',
        db_index=True,
        help_text="User being authorized"
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='user_authorizations',
        db_index=True,
        help_text="Client being authorized for"
    )
    granted_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When authorization was granted"
    )
    granted_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_authorizations_granted',
        help_text="Who granted this authorization"
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Reason or notes for this authorization"
    )

    class Meta:
        db_table = 'user_clients'
        verbose_name = 'User Client Authorization'
        verbose_name_plural = 'User Client Authorizations'
        ordering = ['user', 'client']
        indexes = [
            models.Index(fields=['user', 'client']),
            models.Index(fields=['user']),
            models.Index(fields=['client']),
            models.Index(fields=['deleted_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'client'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_user_client_active'
            )
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.client.name}"

    def __repr__(self):
        return f"<UserClient: {self.user.email} -> {self.client.name}>"
