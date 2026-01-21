"""Client Contact model - multiple contact persons per client."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import ContactMethod


class ClientContact(BaseModel):
    """
    Individual contact person associated with a client organization.

    Responsibilities:
    - Store contact person details (name, email, phone, role)
    - Support multiple contacts per client with role designation
    - Track primary/secondary contact relationships

    Examples: Primary Contact, Billing Contact, Technical Contact, Executive
    """

    # Contact Role Choices
    class ContactRole(models.TextChoices):
        PRIMARY = 'Primary', 'Primary Contact'
        BILLING = 'Billing', 'Billing Contact'
        TECHNICAL = 'Technical', 'Technical Contact'
        EXECUTIVE = 'Executive', 'Executive'
        LEGAL = 'Legal', 'Legal Contact'
        OTHER = 'Other', 'Other'

    client = models.ForeignKey(
        'Client',
        on_delete=models.CASCADE,
        related_name='contacts',
        db_index=True,
        help_text="Parent client organization"
    )

    # === Contact Information ===
    first_name = models.CharField(
        max_length=100,
        help_text="Contact person's first name"
    )
    last_name = models.CharField(
        max_length=100,
        help_text="Contact person's last name"
    )
    email = models.EmailField(
        db_index=True,
        help_text="Contact email address"
    )
    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Contact phone number"
    )
    mobile = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Mobile phone number"
    )

    # === Role & Position ===
    role = models.CharField(
        max_length=20,
        choices=ContactRole.choices,
        default=ContactRole.OTHER,
        db_index=True,
        help_text="Contact's role within organization"
    )
    title = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Job title (e.g., 'CEO', 'CFO', 'Project Manager')"
    )
    department = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Department or division"
    )

    # === Settings ===
    is_primary = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Designate as primary contact for client"
    )
    preferred_contact_method = models.CharField(
        max_length=20,
        choices=ContactMethod.choices,
        default=ContactMethod.EMAIL,
        help_text="Preferred communication channel"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Contact is currently reachable"
    )

    # === Additional Data ===
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Internal notes about this contact"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Flexible storage for custom attributes"
    )

    class Meta:
        db_table = 'client_contacts'
        verbose_name = 'Client Contact'
        verbose_name_plural = 'Client Contacts'
        ordering = ['-is_primary', 'last_name', 'first_name']
        indexes = [
            models.Index(fields=['client', 'is_primary']),
            models.Index(fields=['client', 'role']),
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
        ]
        constraints = [
            # Ensure unique email per client
            models.UniqueConstraint(
                fields=['client', 'email'],
                name='unique_contact_email_per_client'
            ),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.client.name})"

    def __repr__(self):
        return f"<ClientContact: {self.full_name} - {self.role}>"

    @property
    def full_name(self) -> str:
        """Get formatted full name."""
        return f"{self.first_name} {self.last_name}".strip()

    def clean(self):
        """Validate contact data before saving."""
        super().clean()

        # At least one contact method required
        if not any([self.email, self.phone, self.mobile]):
            raise ValidationError(
                "Contact must have at least one contact method (email, phone, or mobile)."
            )

    def save(self, *args, **kwargs):
        """Override save to handle primary contact logic."""
        # If setting as primary, unset other primary contacts for this client
        if self.is_primary and self.client_id:
            ClientContact.objects.filter(
                client_id=self.client_id,
                is_primary=True
            ).exclude(id=self.id).update(is_primary=False)

        super().save(*args, **kwargs)
