"""Contract model - manages service agreements between clients and providers."""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

from axis_backend.models import BaseModel
from axis_backend.enums import ContractStatus, PaymentStatus


class Contract(BaseModel):
    """
    Service contract managing client-provider agreements and billing.

    Responsibilities (Single Responsibility Principle):
    - Store contract terms and dates
    - Track payment status and billing cycles
    - Manage contract lifecycle (active, expired, renewed, terminated)
    - Calculate billing periods

    Design Notes:
    - Separate payment status from contract status for flexibility
    - Auto-renewal flag enables automated contract management
    - Termination reason required for compliance and audit
    - Currency field supports international clients
    """

    # === Client Relationship ===
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,  # Prevent deletion of clients with contracts
        related_name='contracts',
        db_index=True,
        help_text="Client organization under contract"
    )

    # === Contract Period ===
    start_date = models.DateField(
        db_index=True,
        help_text="Contract effective start date"
    )
    end_date = models.DateField(
        db_index=True,
        help_text="Contract expiration date"
    )
    renewal_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when contract is eligible for renewal"
    )

    # === Financial Terms ===
    billing_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Contract value or billing rate"
    )
    currency = models.CharField(
        max_length=3,
        default='UGX',
        help_text="ISO 4217 currency code (e.g., 'UGX', 'USD')"
    )
    payment_frequency = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Billing cycle (e.g., 'Monthly', 'Quarterly')"
    )
    payment_terms = models.TextField(
        null=True,
        blank=True,
        help_text="Payment conditions and due date terms"
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
        help_text="Current payment state"
    )

    # === Billing Tracking ===
    last_billing_date = models.DateField(
        null=True,
        blank=True,
        help_text="Most recent billing date"
    )
    next_billing_date = models.DateField(
        null=True,
        blank=True,
        help_text="Upcoming billing date"
    )

    # === Renewal Configuration ===
    is_renewable = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Contract eligible for renewal"
    )
    is_auto_renew = models.BooleanField(
        default=False,
        help_text="Automatic renewal enabled"
    )

    # === Document & Signatures ===
    document_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Signed contract document location"
    )
    signed_by = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Authorized signatory name"
    )
    signed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Contract execution timestamp"
    )

    # === Status Management ===
    status = models.CharField(
        max_length=20,
        choices=ContractStatus.choices,
        default=ContractStatus.ACTIVE,
        db_index=True,
        help_text="Current contract lifecycle state"
    )
    termination_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Explanation if contract terminated early"
    )

    # === Additional Information ===
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Internal contract notes and observations"
    )

    class Meta:
        db_table = 'contracts'
        verbose_name = 'Contract'
        verbose_name_plural = 'Contracts'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['client']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['is_renewable']),
            models.Index(fields=['next_billing_date']),
            models.Index(fields=['deleted_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gte=models.F('start_date')),
                name='end_date_after_start_date'
            ),
            models.CheckConstraint(
                check=models.Q(billing_rate__gte=0),
                name='billing_rate_non_negative'
            ),
        ]

    def __str__(self):
        return f"Contract {self.id} - {self.client.name} ({self.start_date} to {self.end_date})"

    def __repr__(self):
        return f"<Contract: {self.client.name} ({self.status})>"

    def clean(self):
        """Validate contract business rules."""
        super().clean()

        # Validate date logic
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date must be after start date.")

        # Validate renewal date within contract period
        if self.renewal_date:
            if self.renewal_date < self.start_date or self.renewal_date > self.end_date:
                raise ValidationError("Renewal date must fall within contract period.")

        # Require termination reason for terminated contracts
        if self.status == ContractStatus.TERMINATED and not self.termination_reason:
            raise ValidationError("Termination reason is required for terminated contracts.")

        # Billing rate must be positive
        if self.billing_rate and self.billing_rate < Decimal('0'):
            raise ValidationError("Billing rate cannot be negative.")

    # === Status Query Properties ===

    @property
    def is_active(self) -> bool:
        """Check if contract is currently active and within valid period."""
        if self.status != ContractStatus.ACTIVE:
            return False
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date

    @property
    def is_expired(self) -> bool:
        """Check if contract has passed end date."""
        return timezone.now().date() > self.end_date

    @property
    def is_pending_renewal(self) -> bool:
        """Check if contract is approaching renewal date."""
        if not self.renewal_date or not self.is_renewable:
            return False
        today = timezone.now().date()
        return today >= self.renewal_date and not self.is_expired

    @property
    def days_remaining(self) -> int:
        """Calculate days until contract expiration."""
        today = timezone.now().date()
        return (self.end_date - today).days

    @property
    def is_payment_overdue(self) -> bool:
        """Check if payment is past due."""
        return self.payment_status == PaymentStatus.OVERDUE

    # === Lifecycle Management Methods ===

    def activate(self) -> None:
        """Transition contract to active status."""
        self.status = ContractStatus.ACTIVE
        self.save(update_fields=['status', 'updated_at'])

    def terminate(self, reason: str) -> None:
        """
        Terminate contract before expiration.

        Args:
            reason: Required explanation for early termination

        Raises:
            ValidationError: If reason not provided
        """
        if not reason:
            raise ValidationError("Termination reason is required.")

        self.status = ContractStatus.TERMINATED
        self.termination_reason = reason
        self.save(update_fields=['status', 'termination_reason', 'updated_at'])

    def renew(self, new_end_date: models.DateField, new_billing_rate: Decimal = None) -> None:
        """
        Renew contract with updated terms.

        Args:
            new_end_date: New contract expiration date
            new_billing_rate: Optional updated billing rate

        Raises:
            ValidationError: If new end date is before current end date
        """
        if new_end_date <= self.end_date:
            raise ValidationError("New end date must be after current end date.")

        self.status = ContractStatus.RENEWED
        self.end_date = new_end_date
        if new_billing_rate is not None:
            self.billing_rate = new_billing_rate
        self.renewal_date = None  # Clear renewal date after processing
        self.save(update_fields=['status', 'end_date', 'billing_rate', 'renewal_date', 'updated_at'])

    def mark_expired(self) -> None:
        """Mark contract as expired (typically automated job)."""
        self.status = ContractStatus.EXPIRED
        self.save(update_fields=['status', 'updated_at'])

    # === Payment Management Methods ===

    def mark_paid(self) -> None:
        """Record successful payment."""
        self.payment_status = PaymentStatus.PAID
        self.last_billing_date = timezone.now().date()
        self._calculate_next_billing_date()
        self.save(update_fields=['payment_status', 'last_billing_date', 'next_billing_date', 'updated_at'])

    def mark_overdue(self) -> None:
        """Flag payment as overdue."""
        self.payment_status = PaymentStatus.OVERDUE
        self.save(update_fields=['payment_status', 'updated_at'])

    def _calculate_next_billing_date(self) -> None:
        """
        Calculate next billing date based on payment frequency.

        Internal helper - updates next_billing_date field.
        """
        if not self.payment_frequency or not self.last_billing_date:
            return

        from dateutil.relativedelta import relativedelta

        frequency_map = {
            'Monthly': relativedelta(months=1),
            'Quarterly': relativedelta(months=3),
            'Annually': relativedelta(years=1),
            'Weekly': relativedelta(weeks=1),
        }

        delta = frequency_map.get(self.payment_frequency)
        if delta:
            self.next_billing_date = self.last_billing_date + delta
