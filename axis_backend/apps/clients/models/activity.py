"""Client Activity model - interaction and event timeline."""
from django.db import models

from axis_backend.models import BaseModel


class ClientActivity(BaseModel):
    """
    Activity/interaction timeline for client engagement tracking.

    Responsibilities:
    - Record all client interactions (calls, emails, meetings, notes)
    - Track status changes and important events
    - Provide audit trail for client relationship

    Design Notes:
    - Generic design supports multiple activity types
    - Metadata field enables type-specific data without schema changes
    """

    # Activity Type Choices
    class ActivityType(models.TextChoices):
        NOTE = 'Note', 'Note'
        CALL = 'Call', 'Phone Call'
        EMAIL = 'Email', 'Email'
        MEETING = 'Meeting', 'Meeting'
        STATUS_CHANGE = 'StatusChange', 'Status Change'
        CONTRACT_SIGNED = 'ContractSigned', 'Contract Signed'
        PAYMENT_RECEIVED = 'PaymentReceived', 'Payment Received'
        DOCUMENT_UPLOADED = 'DocumentUploaded', 'Document Uploaded'
        VERIFICATION = 'Verification', 'Verification Event'
        OTHER = 'Other', 'Other'

    client = models.ForeignKey(
        'Client',
        on_delete=models.CASCADE,
        related_name='activities',
        db_index=True,
        help_text="Client this activity relates to"
    )

    # === Activity Details ===
    activity_type = models.CharField(
        max_length=20,
        choices=ActivityType.choices,
        db_index=True,
        help_text="Type of activity or interaction"
    )
    title = models.CharField(
        max_length=255,
        help_text="Brief activity title or summary"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Detailed activity description or notes"
    )
    activity_date = models.DateTimeField(
        db_index=True,
        help_text="When this activity occurred"
    )

    # === Participants ===
    # TODO: Uncomment when staff app is created
    # staff_member = models.ForeignKey(
    #     'staff.Staff',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='client_activities',
    #     db_index=True,
    #     help_text="Staff member who performed or logged this activity"
    # )
    contact = models.ForeignKey(
        'ClientContact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities',
        help_text="Specific client contact involved (if applicable)"
    )

    # === Additional Data ===
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Type-specific data (call duration, email subject, etc.)"
    )

    class Meta:
        db_table = 'client_activities'
        verbose_name = 'Client Activity'
        verbose_name_plural = 'Client Activities'
        ordering = ['-activity_date', '-created_at']
        indexes = [
            models.Index(fields=['client', '-activity_date']),
            models.Index(fields=['client', 'activity_type']),
            models.Index(fields=['activity_type', '-activity_date']),
            # models.Index(fields=['staff_member', '-activity_date']),  # TODO: Uncomment when staff app exists
        ]

    def __str__(self):
        return f"{self.activity_type}: {self.title} ({self.client.name})"

    def __repr__(self):
        return f"<ClientActivity: {self.activity_type} - {self.title}>"
