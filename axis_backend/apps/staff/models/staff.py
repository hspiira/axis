"""Staff model - client organization employees who receive EAP services."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import StaffRole, WorkStatus


class Staff(BaseModel):
    """
    Employee of client organization receiving EAP services.

    Responsibilities (Single Responsibility Principle):
    - Store employee demographic and employment data
    - Track employee status within client organization
    - Link employee to their dependents (beneficiaries)
    - Manage service eligibility and access

    Design Notes:
    - Staff belong to client organizations (employers)
    - One-to-one with Profile for personal information
    - Foreign key to User for portal/app access
    - Staff can have multiple Beneficiary dependents
    - Qualifications/specializations track employee role context
    """

    # === Core Relationships ===
    profile = models.OneToOneField(
        'authentication.Profile',
        on_delete=models.PROTECT,
        related_name='staff',
        help_text="Personal demographic information"
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='staff_profiles',
        db_index=True,
        help_text="User account for EAP portal access"
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        related_name='staff',
        db_index=True,
        help_text="Employer organization providing EAP benefits"
    )

    # === Employment Information ===
    role = models.CharField(
        max_length=20,
        choices=StaffRole.choices,
        db_index=True,
        help_text="Role within employer organization (for service allocation)"
    )
    start_date = models.DateField(
        db_index=True,
        help_text="Employment start date with client organization"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Employment end date (when no longer eligible for EAP)"
    )
    status = models.CharField(
        max_length=20,
        choices=WorkStatus.choices,
        default=WorkStatus.ACTIVE,
        db_index=True,
        help_text="Employment status (determines EAP eligibility)"
    )

    # === Service Context ===
    qualifications = models.JSONField(
        default=list,
        blank=True,
        help_text="Employee role qualifications (context for counseling)"
    )
    specializations = models.JSONField(
        default=list,
        blank=True,
        help_text="Work areas or departments (for targeted EAP programs)"
    )
    preferred_working_hours = models.JSONField(
        null=True,
        blank=True,
        help_text="Work schedule for session scheduling (e.g., {'monday': '9-17'})"
    )

    # === Emergency Contact ===
    emergency_contact_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Emergency contact person name"
    )
    emergency_contact_phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Emergency contact phone number"
    )
    emergency_contact_email = models.EmailField(
        null=True,
        blank=True,
        help_text="Emergency contact email address"
    )

    # === Additional Information ===
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional employee context (department, manager, etc.)"
    )

    class Meta:
        db_table = 'staff'
        verbose_name = 'Staff Member'
        verbose_name_plural = 'Staff Members'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['client']),
            models.Index(fields=['profile']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date']),
            models.Index(fields=['deleted_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__isnull=True) | models.Q(end_date__gte=models.F('start_date')),
                name='staff_end_date_after_start_date'
            )
        ]

    def __str__(self):
        return f"{self.profile.full_name} ({self.client.name})"

    def __repr__(self):
        return f"<Staff: {self.profile.full_name} @ {self.client.name}>"

    def clean(self):
        """Validate business rules."""
        super().clean()

        # End date must be after start date
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date must be after start date.")

        # Inactive staff should have end date
        if self.status in [WorkStatus.TERMINATED, WorkStatus.RESIGNED] and not self.end_date:
            raise ValidationError(
                f"Staff with status '{self.status}' must have an end date."
            )

    # === Eligibility Properties ===

    @property
    def is_eligible_for_services(self) -> bool:
        """Check if staff member is eligible for EAP services."""
        return (
            self.status == WorkStatus.ACTIVE and
            self.deleted_at is None and
            self.client.is_active
        )

    @property
    def is_active(self) -> bool:
        """Check if staff is currently employed."""
        return self.status == WorkStatus.ACTIVE and self.deleted_at is None

    @property
    def is_on_leave(self) -> bool:
        """Check if staff is on leave (may still be eligible)."""
        return self.status == WorkStatus.ON_LEAVE

    @property
    def is_terminated(self) -> bool:
        """Check if employment ended."""
        return self.status in [WorkStatus.TERMINATED, WorkStatus.RESIGNED]

    @property
    def employment_duration_days(self) -> int:
        """
        Calculate employment duration in days.

        Returns:
            int: Days employed (from start to end or today)
        """
        from django.utils import timezone
        end = self.end_date or timezone.now().date()
        return (end - self.start_date).days

    @property
    def has_emergency_contact(self) -> bool:
        """Check if emergency contact information is available."""
        return bool(
            self.emergency_contact_name and
            (self.emergency_contact_phone or self.emergency_contact_email)
        )

    # === Status Management ===

    def mark_inactive(self, end_date: models.DateField, reason: str = None) -> None:
        """
        Mark staff as no longer eligible (employment ended).

        Args:
            end_date: Last day of employment
            reason: Optional reason for separation
        """
        self.status = WorkStatus.INACTIVE
        self.end_date = end_date
        if reason:
            if self.metadata is None:
                self.metadata = {}
            self.metadata['separation_reason'] = reason
        self.save(update_fields=['status', 'end_date', 'metadata', 'updated_at'])

    def mark_on_leave(self, leave_type: str = None, expected_return: str = None) -> None:
        """
        Mark staff as on leave.

        Args:
            leave_type: Type of leave (medical, parental, etc.)
            expected_return: Expected return date
        """
        self.status = WorkStatus.ON_LEAVE
        if self.metadata is None:
            self.metadata = {}
        if leave_type:
            self.metadata['leave_type'] = leave_type
        if expected_return:
            self.metadata['expected_return'] = expected_return
        self.save(update_fields=['status', 'metadata', 'updated_at'])

    def reactivate(self) -> None:
        """Reactivate staff member (e.g., return from leave)."""
        self.status = WorkStatus.ACTIVE
        # Clear leave metadata
        if self.metadata and 'leave_type' in self.metadata:
            del self.metadata['leave_type']
        if self.metadata and 'expected_return' in self.metadata:
            del self.metadata['expected_return']
        self.save(update_fields=['status', 'metadata', 'updated_at'])

    # === Service Context Helpers ===

    def get_dependents(self):
        """
        Retrieve all beneficiaries (dependents) linked to this staff.

        Returns:
            QuerySet: Beneficiary objects who are dependents
        """
        return self.beneficiaries.filter(deleted_at__isnull=True)

    def get_active_sessions(self):
        """
        Retrieve active service sessions for this staff.

        Returns:
            QuerySet: ServiceSession objects
        """
        from apps.services_app.models import ServiceSession
        return ServiceSession.objects.filter(
            staff=self,
            deleted_at__isnull=True
        ).exclude(
            status__in=['COMPLETED', 'CANCELED']
        )

    def get_service_summary(self) -> dict:
        """
        Generate summary of EAP service usage.

        Returns:
            dict: Service utilization metrics
        """
        sessions = self.get_active_sessions()
        total_sessions = sessions.count()

        return {
            'staff_id': self.id,
            'name': self.profile.full_name,
            'employer': self.client.name,
            'eligible': self.is_eligible_for_services,
            'total_sessions': total_sessions,
            'dependent_count': self.get_dependents().count(),
        }
