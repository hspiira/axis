"""Client model - represents organizational clients and their business information."""
from django.db import models
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import BaseStatus, ContactMethod
from .industry import Industry


class Client(BaseModel):
    """
    Client organization entity with complete business profile.

    Responsibilities (Single Responsibility Principle):
    - Store organizational contact and business information
    - Manage client status and verification state
    - Maintain industry classification relationship

    Design Notes:
    - Industry relationship uses SET_NULL for data preservation
    - Status changes trigger metadata tracking for audit compliance
    - Metadata field enables feature addition without migrations (Open/Closed)
    - Separate billing address supports complex organizational structures
    """

    # === Core Information ===
    name = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Legal or operating name of organization"
    )
    email = models.EmailField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Primary organizational email address"
    )
    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Primary contact number"
    )
    website = models.URLField(
        max_length=255,
        null=True,
        blank=True,
        validators=[URLValidator()],
        help_text="Public website URL"
    )

    # === Location Information ===
    address = models.TextField(
        null=True,
        blank=True,
        help_text="Physical office address"
    )
    billing_address = models.TextField(
        null=True,
        blank=True,
        help_text="Invoicing address if different from physical"
    )
    timezone = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="IANA timezone identifier (e.g., 'Africa/Kampala')"
    )

    # === Financial Information ===
    tax_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Tax identification or registration number"
    )

    # === Primary Contact Person ===
    contact_person = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Full name of primary contact"
    )
    contact_email = models.EmailField(
        null=True,
        blank=True,
        help_text="Email of primary contact person"
    )
    contact_phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Phone of primary contact person"
    )

    # === Classification & Relationships ===
    industry = models.ForeignKey(
        Industry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clients',
        db_index=True,
        help_text="Business sector classification"
    )

    # === Status & Configuration ===
    status = models.CharField(
        max_length=20,
        choices=BaseStatus.choices,
        default=BaseStatus.ACTIVE,
        db_index=True,
        help_text="Current operational status"
    )
    preferred_contact_method = models.CharField(
        max_length=20,
        choices=ContactMethod.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Preferred communication channel"
    )
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Organization verification status"
    )

    # === Additional Data ===
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Internal observations and important details"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Flexible storage for custom attributes"
    )

    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['industry']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['preferred_contact_method']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<Client: {self.name} ({self.status})>"

    def clean(self):
        """Validate business rules before saving."""
        super().clean()

        # At least one contact method required for active clients
        if self.status == BaseStatus.ACTIVE:
            if not any([self.email, self.phone, self.contact_email, self.contact_phone]):
                raise ValidationError(
                    "Active clients must have at least one contact method (email or phone)."
                )

    # === Status Query Properties ===

    @property
    def is_active(self) -> bool:
        """Check if client is in active operational state."""
        return self.status == BaseStatus.ACTIVE and self.deleted_at is None

    @property
    def verified_status(self) -> bool:
        """Check verification status."""
        return self.is_verified

    # === State Transition Methods ===

    def verify(self, verified_by: str = None) -> None:
        """
        Mark client as verified organization.

        Args:
            verified_by: User ID or system identifier performing verification
        """
        self.is_verified = True
        if self.metadata is None:
            self.metadata = {}
        self.metadata['verified_at'] = str(models.functions.Now())
        if verified_by:
            self.metadata['verified_by'] = verified_by
        self.save(update_fields=['is_verified', 'metadata', 'updated_at'])

    def activate(self) -> None:
        """Transition client to active status."""
        old_status = self.status
        self.status = BaseStatus.ACTIVE
        self._track_status_change(old_status, BaseStatus.ACTIVE)
        self.save(update_fields=['status', 'metadata', 'updated_at'])

    def deactivate(self, reason: str = None) -> None:
        """
        Transition client to inactive status.

        Args:
            reason: Optional explanation for deactivation
        """
        old_status = self.status
        self.status = BaseStatus.INACTIVE
        if reason:
            if self.metadata is None:
                self.metadata = {}
            self.metadata['deactivation_reason'] = reason
        self._track_status_change(old_status, BaseStatus.INACTIVE, reason)
        self.save(update_fields=['status', 'metadata', 'updated_at'])

    def archive(self, reason: str = None) -> None:
        """
        Archive client for historical record keeping.

        Args:
            reason: Optional explanation for archival
        """
        old_status = self.status
        self.status = BaseStatus.ARCHIVED
        if reason:
            if self.metadata is None:
                self.metadata = {}
            self.metadata['archive_reason'] = reason
        self._track_status_change(old_status, BaseStatus.ARCHIVED, reason)
        self.save(update_fields=['status', 'metadata', 'updated_at'])

    # === Helper Methods ===

    def _track_status_change(self, from_status: str, to_status: str, reason: str = None) -> None:
        """
        Record status transition in metadata for audit trail.

        Args:
            from_status: Previous status value
            to_status: New status value
            reason: Optional explanation for change
        """
        if self.metadata is None:
            self.metadata = {}

        if 'status_history' not in self.metadata:
            self.metadata['status_history'] = []

        self.metadata['status_history'].append({
            'from': from_status,
            'to': to_status,
            'reason': reason,
            'changed_at': str(models.functions.Now())
        })

    def get_primary_contact(self) -> dict:
        """
        Retrieve primary contact information.

        Returns:
            dict: Contact person details or organizational contacts if person not specified
        """
        return {
            'name': self.contact_person or self.name,
            'email': self.contact_email or self.email,
            'phone': self.contact_phone or self.phone,
            'method': self.preferred_contact_method
        }
