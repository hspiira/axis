"""Person model - unified EAP service recipient (employees and dependents)."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import PersonType, StaffRole, WorkStatus, RelationType, BaseStatus


class Person(BaseModel):
    """
    Unified model for all EAP service recipients.

    Responsibilities (Single Responsibility Principle):
    - Store all EAP service recipient information
    - Handle both employees and their dependents
    - Manage service eligibility across recipient types
    - Track relationships and dependencies

    Design Notes:
    - Uses type discriminator (person_type) to distinguish employees vs dependents
    - Conditional validation based on person_type
    - Self-referential FK for dependent → employee relationship
    - Eliminates duplication between Staff and Beneficiary models
    - Open for extension (can add new person types without new tables)
    """

    # === Type Discriminator ===
    person_type = models.CharField(
        max_length=20,
        choices=PersonType.choices,
        db_index=True,
        help_text="Type of person: Employee or Dependent"
    )

    # === Core Relationships ===
    profile = models.OneToOneField(
        'authentication.Profile',
        on_delete=models.PROTECT,
        related_name='person',
        help_text="Personal demographic information"
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='persons',
        db_index=True,
        help_text="User account for portal/app access"
    )

    # === Employee-Specific Fields ===
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='employees',
        db_index=True,
        help_text="Employer organization (EMPLOYEE only)"
    )
    employee_role = models.CharField(
        max_length=20,
        choices=StaffRole.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Role within employer organization (EMPLOYEE only)"
    )
    employment_start_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Employment start date (EMPLOYEE only)"
    )
    employment_end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Employment end date (EMPLOYEE only)"
    )
    employment_status = models.CharField(
        max_length=20,
        choices=WorkStatus.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Employment status (EMPLOYEE only)"
    )
    qualifications = models.JSONField(
        default=list,
        blank=True,
        help_text="Certifications and role qualifications (EMPLOYEE only)"
    )
    specializations = models.JSONField(
        default=list,
        blank=True,
        help_text="Work areas or departments (EMPLOYEE only)"
    )
    preferred_working_hours = models.JSONField(
        null=True,
        blank=True,
        help_text="Work schedule for session scheduling (EMPLOYEE only)"
    )

    # === Dependent-Specific Fields ===
    primary_employee = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='dependents',
        db_index=True,
        limit_choices_to={'person_type': PersonType.EMPLOYEE},
        help_text="Primary employee this dependent is linked to (DEPENDENT only)"
    )
    relationship_to_employee = models.CharField(
        max_length=20,
        choices=RelationType.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Relationship to primary employee (DEPENDENT only)"
    )
    is_employee_dependent = models.BooleanField(
        default=False,
        help_text="Whether this dependent is also an employee (spouse working at same org)"
    )
    guardian = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='guardianships',
        help_text="Guardian user for minors (DEPENDENT only)"
    )

    # === Shared Fields ===
    status = models.CharField(
        max_length=20,
        choices=BaseStatus.choices,
        default=BaseStatus.ACTIVE,
        db_index=True,
        help_text="Current status (determines service eligibility)"
    )
    last_service_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Most recent service session date"
    )
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
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Internal notes and observations"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional flexible attributes"
    )

    class Meta:
        db_table = 'persons'
        verbose_name = 'Person'
        verbose_name_plural = 'Persons'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['person_type']),
            models.Index(fields=['user']),
            models.Index(fields=['profile']),
            models.Index(fields=['client']),
            models.Index(fields=['primary_employee']),
            models.Index(fields=['status']),
            models.Index(fields=['employee_role']),
            models.Index(fields=['employment_status']),
            models.Index(fields=['relationship_to_employee']),
            models.Index(fields=['employment_start_date']),
            models.Index(fields=['last_service_date']),
            models.Index(fields=['deleted_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(employment_end_date__isnull=True) |
                      models.Q(employment_end_date__gte=models.F('employment_start_date')),
                name='person_employment_end_after_start'
            ),
        ]

    def __str__(self):
        if self.person_type == PersonType.EMPLOYEE:
            return f"{self.profile.full_name} (Employee @ {self.client.name})"
        else:
            return f"{self.profile.full_name} (Dependent of {self.primary_employee.profile.full_name})"

    def __repr__(self):
        return f"<Person: {self.person_type} - {self.profile.full_name}>"

    def clean(self):
        """Validate type-specific business rules."""
        super().clean()

        if self.person_type == PersonType.EMPLOYEE:
            # Employee-specific validations
            if not self.client:
                raise ValidationError("Employees must have a client (employer).")
            if not self.employment_start_date:
                raise ValidationError("Employees must have an employment start date.")
            if not self.employment_status:
                raise ValidationError("Employees must have an employment status.")

            # Should not have dependent fields
            if self.primary_employee:
                raise ValidationError("Employees cannot have a primary_employee.")
            if self.relationship_to_employee:
                raise ValidationError("Employees cannot have a relationship_to_employee.")

            # Check end date logic
            if self.employment_end_date and self.employment_start_date:
                if self.employment_end_date < self.employment_start_date:
                    raise ValidationError("Employment end date must be after start date.")

        elif self.person_type == PersonType.DEPENDENT:
            # Dependent-specific validations
            if not self.primary_employee:
                raise ValidationError("Dependents must have a primary_employee.")
            if not self.relationship_to_employee:
                raise ValidationError("Dependents must specify relationship_to_employee.")

            # Should not have employee fields
            if self.client:
                raise ValidationError("Dependents cannot have a direct client relationship.")
            if self.employment_start_date:
                raise ValidationError("Dependents cannot have employment_start_date.")
            if self.employment_status:
                raise ValidationError("Dependents cannot have employment_status.")

            # Guardian validation for minors
            if self.relationship_to_employee == RelationType.CHILD:
                if self.profile.age and self.profile.age < 18 and not self.guardian:
                    raise ValidationError("Minor dependents (under 18) require a guardian.")

    # === Type Check Properties ===

    @property
    def is_employee(self) -> bool:
        """Check if person is an employee."""
        return self.person_type == PersonType.EMPLOYEE

    @property
    def is_dependent(self) -> bool:
        """Check if person is a dependent."""
        return self.person_type == PersonType.DEPENDENT

    # === Eligibility Properties ===

    @property
    def is_eligible_for_services(self) -> bool:
        """
        Check if person is eligible for EAP services.

        Employees: Active employment + active client
        Dependents: Active status + primary employee eligible + active client
        """
        if self.status != BaseStatus.ACTIVE or self.deleted_at is not None:
            return False

        if self.is_employee:
            return (
                self.employment_status == WorkStatus.ACTIVE and
                self.client and
                self.client.is_active
            )
        else:  # Dependent
            return (
                self.primary_employee and
                self.primary_employee.is_eligible_for_services
            )

    @property
    def is_active(self) -> bool:
        """Check if person is in active status."""
        return self.status == BaseStatus.ACTIVE and self.deleted_at is None

    @property
    def is_minor(self) -> bool:
        """Check if person is under 18."""
        if not self.profile.age:
            return False
        return self.profile.age < 18

    @property
    def requires_guardian_consent(self) -> bool:
        """Check if guardian consent needed for services."""
        return (
            self.is_dependent and
            self.is_minor and
            self.relationship_to_employee == RelationType.CHILD
        )

    @property
    def effective_client(self):
        """Get the client organization (direct for employees, via primary for dependents)."""
        if self.is_employee:
            return self.client
        elif self.primary_employee:
            return self.primary_employee.client
        return None

    @property
    def employment_duration_days(self) -> int | None:
        """Calculate employment duration in days (employees only)."""
        if not self.is_employee or not self.employment_start_date:
            return None
        from django.utils import timezone
        end = self.employment_end_date or timezone.now().date()
        return (end - self.employment_start_date).days

    # === Relationship Methods ===

    def get_all_dependents(self):
        """
        Get all dependents for this person (employees only).

        Returns:
            QuerySet: Person objects who are dependents
        """
        if not self.is_employee:
            return Person.objects.none()
        return self.dependents.filter(deleted_at__isnull=True)

    def get_family_unit(self):
        """
        Get complete family unit (employee + all dependents).

        Returns:
            QuerySet: Person objects in family
        """
        if self.is_employee:
            from django.db.models import Q
            return Person.objects.filter(
                Q(id=self.id) | Q(primary_employee=self),
                deleted_at__isnull=True
            )
        else:
            return self.primary_employee.get_family_unit() if self.primary_employee else Person.objects.none()

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
        Retrieve active service sessions.

        Returns:
            QuerySet: ServiceSession objects
        """
        from apps.services_app.models import ServiceSession
        return ServiceSession.objects.filter(
            person=self,
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
            person=self,
            deleted_at__isnull=True
        ).order_by('-scheduled_at')

    # === Status Management ===

    def activate(self) -> None:
        """Activate person for service eligibility."""
        self.status = BaseStatus.ACTIVE
        if self.is_employee:
            self.employment_status = WorkStatus.ACTIVE
        self.save(update_fields=['status', 'employment_status', 'updated_at'])

    def deactivate(self, reason: str = None) -> None:
        """
        Deactivate person (no longer eligible).

        Args:
            reason: Optional explanation for deactivation
        """
        self.status = BaseStatus.INACTIVE
        if self.is_employee:
            self.employment_status = WorkStatus.INACTIVE

        if reason:
            if self.metadata is None:
                self.metadata = {}
            self.metadata['deactivation_reason'] = reason
            self.metadata['deactivated_at'] = str(models.functions.Now())

        self.save(update_fields=['status', 'employment_status', 'metadata', 'updated_at'])

    # === Class Methods for Creation ===

    @classmethod
    def create_employee(
        cls,
        profile,
        user,
        client,
        employee_role: str,
        employment_start_date,
        employment_status: str = WorkStatus.ACTIVE,
        **kwargs
    ) -> 'Person':
        """
        Factory method to create an employee.

        Args:
            profile: Profile instance
            user: User instance
            client: Client instance (employer)
            employee_role: StaffRole choice
            employment_start_date: Date
            employment_status: WorkStatus choice
            **kwargs: Additional employee fields

        Returns:
            Person: Created employee instance
        """
        return cls.objects.create(
            person_type=PersonType.EMPLOYEE,
            profile=profile,
            user=user,
            client=client,
            employee_role=employee_role,
            employment_start_date=employment_start_date,
            employment_status=employment_status,
            **kwargs
        )

    @classmethod
    def create_dependent(
        cls,
        profile,
        user,
        primary_employee: 'Person',
        relationship_to_employee: str,
        guardian=None,
        **kwargs
    ) -> 'Person':
        """
        Factory method to create a dependent.

        Args:
            profile: Profile instance
            user: User instance
            primary_employee: Person instance (must be EMPLOYEE type)
            relationship_to_employee: RelationType choice
            guardian: User instance (required for minors)
            **kwargs: Additional dependent fields

        Returns:
            Person: Created dependent instance
        """
        if primary_employee.person_type != PersonType.EMPLOYEE:
            raise ValidationError("primary_employee must be of type EMPLOYEE")

        return cls.objects.create(
            person_type=PersonType.DEPENDENT,
            profile=profile,
            user=user,
            primary_employee=primary_employee,
            relationship_to_employee=relationship_to_employee,
            guardian=guardian,
            **kwargs
        )

    # === Information Retrieval ===

    def get_service_summary(self) -> dict:
        """
        Generate comprehensive service summary.

        Returns:
            dict: Service utilization and eligibility information
        """
        summary = {
            'person_id': self.id,
            'person_type': self.person_type,
            'name': self.profile.full_name,
            'is_eligible': self.is_eligible_for_services,
            'status': self.status,
            'last_service': self.last_service_date,
            'active_sessions': self.get_active_sessions().count(),
            'total_sessions': self.get_service_history().count(),
        }

        if self.is_employee:
            summary.update({
                'employer': self.client.name if self.client else None,
                'role': self.employee_role,
                'employment_status': self.employment_status,
                'dependent_count': self.get_all_dependents().count(),
            })
        else:
            summary.update({
                'relationship': self.relationship_to_employee,
                'primary_employee': self.primary_employee.profile.full_name if self.primary_employee else None,
                'employer': self.effective_client.name if self.effective_client else None,
                'is_minor': self.is_minor,
                'requires_consent': self.requires_guardian_consent,
            })

        return summary
