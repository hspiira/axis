"""Beneficiary model - dependents of staff members who receive EAP services."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import RelationType, BaseStatus, Language


class Beneficiary(BaseModel):
    """
    Dependent of staff member eligible for EAP services.

    Responsibilities (Single Responsibility Principle):
    - Store dependent demographic information
    - Track relationship to staff member
    - Manage service eligibility through staff link
    - Support guardian relationships for minors

    Design Notes:
    - One-to-one with Profile for personal information
    - Foreign key to Staff (primary relationship)
    - Optional foreign key to User for guardian portal access
    - Optional User link for adult dependents with their own access
    - Relationship type determines service scope and consent requirements
    """

    # === Core Relationships ===
    profile = models.OneToOneField(
        'authentication.Profile',
        on_delete=models.PROTECT,
        related_name='beneficiary',
        help_text="Personal demographic information"
    )
    staff = models.ForeignKey(
        'staff.Staff',
        on_delete=models.PROTECT,
        related_name='beneficiaries',
        db_index=True,
        help_text="Staff member (employee) to whom this beneficiary is related"
    )

    # === Relationship Information ===
    relation = models.CharField(
        max_length=20,
        choices=RelationType.choices,
        db_index=True,
        help_text="Relationship to staff member (spouse, child, parent, etc.)"
    )
    is_staff_link = models.BooleanField(
        default=False,
        help_text="Whether this is a direct staff-to-staff link (e.g., spouse also employed)"
    )

    # === Guardian & Access ===
    guardian = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='guardianships',
        help_text="Guardian user for minors (parent/guardian portal access)"
    )
    user_link = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='beneficiary_profiles',
        help_text="User account for adult beneficiaries with direct portal access"
    )

    # === Status & Eligibility ===
    status = models.CharField(
        max_length=20,
        choices=BaseStatus.choices,
        default=BaseStatus.ACTIVE,
        db_index=True,
        help_text="Beneficiary status (determines service eligibility)"
    )
    last_service_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Most recent service session date"
    )

    # === Preferences ===
    preferred_language = models.CharField(
        max_length=20,
        choices=Language.choices,
        null=True,
        blank=True,
        help_text="Preferred language for services"
    )

    # === Additional Information ===
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Internal notes about beneficiary (allergies, special needs, etc.)"
    )

    class Meta:
        db_table = 'beneficiaries'
        verbose_name = 'Beneficiary'
        verbose_name_plural = 'Beneficiaries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['staff']),
            models.Index(fields=['profile']),
            models.Index(fields=['relation']),
            models.Index(fields=['status']),
            models.Index(fields=['last_service_date']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.profile.full_name} ({self.relation} of {self.staff.profile.full_name})"

    def __repr__(self):
        return f"<Beneficiary: {self.profile.full_name} ({self.relation})>"

    def clean(self):
        """Validate business rules."""
        super().clean()

        # Guardian required for minors
        if self.relation == RelationType.CHILD and self.profile.age and self.profile.age < 18:
            if not self.guardian:
                raise ValidationError("Guardian is required for beneficiaries under 18.")

        # Cannot have both guardian and user_link
        if self.guardian and self.user_link:
            raise ValidationError("Beneficiary cannot have both guardian and direct user access.")

    # === Eligibility Properties ===

    @property
    def is_eligible_for_services(self) -> bool:
        """
        Check if beneficiary is eligible for EAP services.

        Eligibility depends on:
        - Own active status
        - Staff member's active employment
        - Client organization's active contract
        """
        return (
            self.status == BaseStatus.ACTIVE and
            self.deleted_at is None and
            self.staff.is_eligible_for_services
        )

    @property
    def is_active(self) -> bool:
        """Check if beneficiary is in active status."""
        return self.status == BaseStatus.ACTIVE and self.deleted_at is None

    @property
    def is_minor(self) -> bool:
        """Check if beneficiary is under 18."""
        if not self.profile.age:
            return False
        return self.profile.age < 18

    @property
    def requires_guardian_consent(self) -> bool:
        """Check if guardian consent is needed for services."""
        return self.is_minor and self.relation == RelationType.CHILD

    @property
    def has_portal_access(self) -> bool:
        """Check if beneficiary has direct portal access."""
        return bool(self.user_link)

    @property
    def guardian_email(self) -> str | None:
        """Get guardian email for notifications."""
        if self.guardian:
            return self.guardian.email
        # Fallback to staff email for minors
        if self.is_minor:
            return self.staff.user.email
        return None

    # === Service Tracking ===

    def update_last_service_date(self, service_date: models.DateField = None) -> None:
        """
        Update last service date after session.

        Args:
            service_date: Date of service (defaults to today)
        """
        from django.utils import timezone
        self.last_service_date = service_date or timezone.now().date()
        self.save(update_fields=['last_service_date', 'updated_at'])

    def get_active_sessions(self):
        """
        Retrieve active service sessions for this beneficiary.

        Returns:
            QuerySet: ServiceSession objects
        """
        from apps.services_app.models import ServiceSession
        return ServiceSession.objects.filter(
            beneficiary=self,
            deleted_at__isnull=True
        ).exclude(
            status__in=['COMPLETED', 'CANCELED']
        )

    def get_service_history(self):
        """
        Retrieve complete service history.

        Returns:
            QuerySet: All ServiceSession objects ordered by date
        """
        from apps.services_app.models import ServiceSession
        return ServiceSession.objects.filter(
            beneficiary=self,
            deleted_at__isnull=True
        ).order_by('-scheduled_at')

    # === Status Management ===

    def activate(self) -> None:
        """Activate beneficiary for service eligibility."""
        self.status = BaseStatus.ACTIVE
        self.save(update_fields=['status', 'updated_at'])

    def deactivate(self, reason: str = None) -> None:
        """
        Deactivate beneficiary (no longer eligible).

        Args:
            reason: Optional explanation for deactivation
        """
        self.status = BaseStatus.INACTIVE
        if reason:
            if not self.notes:
                self.notes = ''
            self.notes += f"\n[Deactivation: {reason}]"
        self.save(update_fields=['status', 'notes', 'updated_at'])

    # === Information Retrieval ===

    def get_primary_contact(self) -> dict:
        """
        Get primary contact information for this beneficiary.

        Returns:
            dict: Contact details (guardian for minors, self for adults)
        """
        if self.is_minor and self.guardian:
            return {
                'name': f"{self.profile.full_name} (via guardian)",
                'email': self.guardian.email,
                'phone': self.staff.profile.phone,
                'relationship': 'Guardian'
            }
        elif self.user_link:
            return {
                'name': self.profile.full_name,
                'email': self.user_link.email,
                'phone': self.profile.phone,
                'relationship': 'Self'
            }
        else:
            return {
                'name': self.profile.full_name,
                'email': self.staff.profile.email,
                'phone': self.staff.profile.phone,
                'relationship': f'{self.relation} of staff'
            }

    def get_eligibility_summary(self) -> dict:
        """
        Generate eligibility and service summary.

        Returns:
            dict: Eligibility details and service metrics
        """
        return {
            'beneficiary_id': self.id,
            'name': self.profile.full_name,
            'relation': self.relation,
            'staff_name': self.staff.profile.full_name,
            'employer': self.staff.client.name,
            'is_eligible': self.is_eligible_for_services,
            'is_minor': self.is_minor,
            'requires_consent': self.requires_guardian_consent,
            'last_service': self.last_service_date,
            'active_sessions': self.get_active_sessions().count(),
        }
