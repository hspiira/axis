"""Person model - unified EAP service recipient (employees and dependents)."""
from django.db import models
from django.core.exceptions import ValidationError

from axis_backend.models import BaseModel
from axis_backend.enums import PersonType, StaffRole, WorkStatus, RelationType, BaseStatus


class Person(BaseModel):
    """
    Unified model for all people in the EAP system.

    Supports 4 Person Types:
    - PLATFORM_STAFF: EAP organization employees managing the platform
    - CLIENT_EMPLOYEE: Client company employees receiving EAP services
    - DEPENDENT: Family members of client employees
    - SERVICE_PROVIDER: External professionals providing services (therapists, counselors)

    Responsibilities (Single Responsibility Principle):
    - Store all person information with type-specific fields
    - Manage service eligibility across person types
    - Handle dual roles (e.g., staff who are also client employees)
    - Track relationships and dependencies
    - Support service provider scheduling and availability

    Design Notes:
    - Uses type discriminator pattern with person_type field
    - Supports dual roles via is_dual_role and secondary_person_type
    - Conditional validation ensures type-specific fields are correctly populated
    - Self-referential FK for dependent → client employee relationship
    - Eliminates duplication while maintaining type safety
    - Platform staff can also be client employees (EAP company as its own client)
    """

    # === Type Discriminator ===
    person_type = models.CharField(
        max_length=30,
        choices=PersonType.choices,
        db_index=True,
        help_text="Primary person type: PlatformStaff, ClientEmployee, Dependent, or ServiceProvider"
    )

    # === Dual Role Support ===
    is_dual_role = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Has multiple roles (e.g., platform staff + client employee)"
    )
    secondary_person_type = models.CharField(
        max_length=30,
        choices=PersonType.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Secondary role if dual role enabled"
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

    # === PLATFORM_STAFF Fields ===
    staff_organization = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='platform_staff',
        db_index=True,
        help_text="EAP organization (PLATFORM_STAFF only)"
    )
    staff_role = models.CharField(
        max_length=20,
        choices=StaffRole.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Role in EAP organization (PLATFORM_STAFF only)"
    )
    staff_department = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Department within EAP organization (PLATFORM_STAFF only)"
    )
    can_manage_clients = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Permission to manage client accounts (PLATFORM_STAFF only)"
    )
    can_manage_services = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Permission to configure services (PLATFORM_STAFF only)"
    )
    can_view_reports = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Permission to view analytics and reports (PLATFORM_STAFF only)"
    )

    # === CLIENT_EMPLOYEE Fields (formerly Employee) ===
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='client_employees',
        db_index=True,
        help_text="Employer organization (CLIENT_EMPLOYEE only)"
    )
    employee_role = models.CharField(
        max_length=20,
        choices=StaffRole.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Role within employer organization (CLIENT_EMPLOYEE only)"
    )
    employment_start_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Employment start date (CLIENT_EMPLOYEE only)"
    )
    employment_end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Employment end date (CLIENT_EMPLOYEE only)"
    )
    employment_status = models.CharField(
        max_length=20,
        choices=WorkStatus.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Employment status (CLIENT_EMPLOYEE only)"
    )
    employee_department = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Department within client organization (CLIENT_EMPLOYEE only)"
    )
    employee_id_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Employee ID from client organization (CLIENT_EMPLOYEE only)"
    )

    # === Dependent-Specific Fields ===
    primary_employee = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='dependents',
        db_index=True,
        limit_choices_to={'person_type': PersonType.CLIENT_EMPLOYEE},
        help_text="Primary client employee this dependent is linked to (DEPENDENT only)"
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

    # === SERVICE_PROVIDER Fields ===
    provider_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_index=True,
        help_text="Type of service (therapist, counselor, psychologist, etc.) (SERVICE_PROVIDER only)"
    )
    license_number = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
        help_text="Professional license number (SERVICE_PROVIDER only)"
    )
    license_expiry = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="License expiration date (SERVICE_PROVIDER only)"
    )
    license_issuing_authority = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Authority that issued the license (SERVICE_PROVIDER only)"
    )
    specializations = models.JSONField(
        default=list,
        blank=True,
        help_text="Areas of expertise (SERVICE_PROVIDER only)"
    )
    certifications = models.JSONField(
        default=list,
        blank=True,
        help_text="Professional certifications (SERVICE_PROVIDER only)"
    )
    languages_spoken = models.JSONField(
        default=list,
        blank=True,
        help_text="Languages spoken for sessions (SERVICE_PROVIDER only)"
    )
    availability_schedule = models.JSONField(
        null=True,
        blank=True,
        help_text="Available hours for sessions (SERVICE_PROVIDER only)"
    )
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Service rate per hour (SERVICE_PROVIDER only)"
    )
    currency = models.CharField(
        max_length=3,
        default='USD',
        null=True,
        blank=True,
        help_text="Currency for rates (SERVICE_PROVIDER only)"
    )
    accepts_insurance = models.BooleanField(
        default=False,
        help_text="Accepts insurance payments (SERVICE_PROVIDER only)"
    )
    insurance_providers = models.JSONField(
        default=list,
        blank=True,
        help_text="List of accepted insurance providers (SERVICE_PROVIDER only)"
    )
    max_clients = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum concurrent clients (SERVICE_PROVIDER only)"
    )
    current_client_count = models.IntegerField(
        default=0,
        help_text="Current number of active clients (SERVICE_PROVIDER only)"
    )
    is_accepting_new_clients = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Currently accepting new clients (SERVICE_PROVIDER only)"
    )
    years_of_experience = models.IntegerField(
        null=True,
        blank=True,
        help_text="Years of professional experience (SERVICE_PROVIDER only)"
    )
    education = models.JSONField(
        default=list,
        blank=True,
        help_text="Educational background (SERVICE_PROVIDER only)"
    )
    bio = models.TextField(
        null=True,
        blank=True,
        help_text="Professional biography (SERVICE_PROVIDER only)"
    )
    profile_photo_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Profile photo URL (SERVICE_PROVIDER only)"
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
            # Core type indexes
            models.Index(fields=['person_type']),
            models.Index(fields=['is_dual_role']),
            models.Index(fields=['secondary_person_type']),
            # Relationship indexes
            models.Index(fields=['user']),
            models.Index(fields=['profile']),
            models.Index(fields=['client']),
            models.Index(fields=['staff_organization']),
            models.Index(fields=['primary_employee']),
            models.Index(fields=['status']),
            # Platform staff indexes
            models.Index(fields=['staff_role']),
            models.Index(fields=['can_manage_clients']),
            models.Index(fields=['can_manage_services']),
            models.Index(fields=['can_view_reports']),
            # Client employee indexes
            models.Index(fields=['employee_role']),
            models.Index(fields=['employment_status']),
            models.Index(fields=['employment_start_date']),
            # Dependent indexes
            models.Index(fields=['relationship_to_employee']),
            # Service provider indexes
            models.Index(fields=['provider_type']),
            models.Index(fields=['license_number']),
            models.Index(fields=['license_expiry']),
            models.Index(fields=['is_accepting_new_clients']),
            # Shared indexes
            models.Index(fields=['last_service_date']),
            models.Index(fields=['deleted_at']),
            # Composite indexes for common queries
            models.Index(fields=['person_type', 'status']),
            models.Index(fields=['person_type', 'client']),
            models.Index(fields=['person_type', 'staff_organization']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(employment_end_date__isnull=True) |
                      models.Q(employment_end_date__gte=models.F('employment_start_date')),
                name='person_employment_end_after_start'
            ),
        ]

    def __str__(self):
        name = self.profile.full_name if self.profile else "Unknown"

        if self.person_type == PersonType.PLATFORM_STAFF:
            org = self.staff_organization.name if self.staff_organization else "Unknown Org"
            return f"{name} (Platform Staff @ {org})"
        elif self.person_type == PersonType.CLIENT_EMPLOYEE:
            org = self.client.name if self.client else "Unknown Client"
            return f"{name} (Employee @ {org})"
        elif self.person_type == PersonType.DEPENDENT:
            primary = self.primary_employee.profile.full_name if self.primary_employee and self.primary_employee.profile else "Unknown"
            return f"{name} (Dependent of {primary})"
        elif self.person_type == PersonType.SERVICE_PROVIDER:
            provider_type = self.provider_type or "Provider"
            return f"{name} ({provider_type})"
        else:
            # Legacy EMPLOYEE type
            org = self.client.name if self.client else "Unknown Client"
            return f"{name} (Employee @ {org})"

    def __repr__(self):
        name = self.profile.full_name if self.profile else "Unknown"
        dual = " [Dual Role]" if self.is_dual_role else ""
        return f"<Person: {self.person_type}{dual} - {name}>"

    def clean(self):
        """
        Validate type-specific business rules for all person types.

        Validates:
        - Required fields per person type
        - Mutually exclusive fields between types
        - Dual role compatibility
        - Business logic constraints
        """
        super().clean()

        # === Dual Role Validation ===
        if self.is_dual_role:
            if not self.secondary_person_type:
                raise ValidationError("Dual role requires secondary_person_type to be set.")
            if self.person_type == self.secondary_person_type:
                raise ValidationError("Primary and secondary person types must be different.")

            # Validate compatible dual role combinations
            valid_combinations = {
                PersonType.PLATFORM_STAFF: [PersonType.CLIENT_EMPLOYEE, PersonType.SERVICE_PROVIDER],
                PersonType.CLIENT_EMPLOYEE: [PersonType.PLATFORM_STAFF, PersonType.SERVICE_PROVIDER],
                PersonType.SERVICE_PROVIDER: [PersonType.PLATFORM_STAFF, PersonType.CLIENT_EMPLOYEE],
            }
            allowed_secondary = valid_combinations.get(self.person_type, [])
            if self.secondary_person_type not in allowed_secondary:
                raise ValidationError(
                    f"Invalid dual role combination: {self.person_type} + {self.secondary_person_type}. "
                    f"Allowed combinations for {self.person_type}: {', '.join(allowed_secondary)}"
                )

        # === PLATFORM_STAFF Validations ===
        if self.person_type == PersonType.PLATFORM_STAFF:
            if not self.staff_organization:
                raise ValidationError("Platform staff must have a staff_organization.")
            if not self.staff_role:
                raise ValidationError("Platform staff must have a staff_role.")

            # Platform staff should not have dependent or pure employee fields (unless dual role)
            if not self.is_dual_role or self.secondary_person_type != PersonType.CLIENT_EMPLOYEE:
                if self.client and self.client != self.staff_organization:
                    raise ValidationError("Platform staff cannot have a different client organization unless dual role.")
            if self.primary_employee:
                raise ValidationError("Platform staff cannot be dependents.")
            if self.relationship_to_employee:
                raise ValidationError("Platform staff cannot have relationship_to_employee.")

        # === CLIENT_EMPLOYEE Validations ===
        if self.person_type == PersonType.CLIENT_EMPLOYEE:
            if not self.client:
                raise ValidationError("Client employees must have a client (employer).")
            if not self.employment_start_date:
                raise ValidationError("Client employees must have an employment start date.")
            if not self.employment_status:
                raise ValidationError("Client employees must have an employment status.")

            # Should not have dependent or platform staff fields (unless dual role)
            if not self.is_dual_role or self.secondary_person_type != PersonType.PLATFORM_STAFF:
                if self.staff_organization and self.staff_organization != self.client:
                    raise ValidationError("Client employees cannot have different staff_organization unless dual role.")
            if self.primary_employee:
                raise ValidationError("Client employees cannot have a primary_employee.")
            if self.relationship_to_employee:
                raise ValidationError("Client employees cannot have a relationship_to_employee.")

            # Check end date logic
            if self.employment_end_date and self.employment_start_date:
                if self.employment_end_date < self.employment_start_date:
                    raise ValidationError("Employment end date must be after start date.")

        # === DEPENDENT Validations ===
        elif self.person_type == PersonType.DEPENDENT:
            if not self.primary_employee:
                raise ValidationError("Dependents must have a primary_employee.")
            if not self.relationship_to_employee:
                raise ValidationError("Dependents must specify relationship_to_employee.")

            # Dependents cannot have other type fields
            if self.client:
                raise ValidationError("Dependents cannot have a direct client relationship.")
            if self.staff_organization:
                raise ValidationError("Dependents cannot have a staff_organization.")
            if self.employment_start_date:
                raise ValidationError("Dependents cannot have employment_start_date.")
            if self.employment_status:
                raise ValidationError("Dependents cannot have employment_status.")
            if self.license_number:
                raise ValidationError("Dependents cannot be service providers.")

            # Guardian validation for minors
            if self.relationship_to_employee == RelationType.CHILD:
                if self.profile and hasattr(self.profile, 'age') and self.profile.age and self.profile.age < 18:
                    if not self.guardian:
                        raise ValidationError("Minor dependents (under 18) require a guardian.")

        # === SERVICE_PROVIDER Validations ===
        elif self.person_type == PersonType.SERVICE_PROVIDER:
            if not self.provider_type:
                raise ValidationError("Service providers must specify provider_type.")
            if not self.license_number:
                raise ValidationError("Service providers must have a license_number.")

            # Service providers should not have dependent fields
            if self.primary_employee:
                raise ValidationError("Service providers cannot be dependents.")
            if self.relationship_to_employee:
                raise ValidationError("Service providers cannot have relationship_to_employee.")

            # License expiry validation
            if self.license_expiry:
                from django.utils import timezone
                if self.license_expiry < timezone.now().date():
                    raise ValidationError("Service provider license has expired.")

            # Client capacity validation
            if self.max_clients and self.current_client_count > self.max_clients:
                raise ValidationError(f"Current client count ({self.current_client_count}) exceeds maximum ({self.max_clients}).")

    # === Type Check Properties ===

    @property
    def is_platform_staff(self) -> bool:
        """Check if person is platform staff (primary or secondary role)."""
        return (self.person_type == PersonType.PLATFORM_STAFF or
                self.secondary_person_type == PersonType.PLATFORM_STAFF)

    @property
    def is_client_employee(self) -> bool:
        """Check if person is client employee (primary or secondary role)."""
        return (self.person_type == PersonType.CLIENT_EMPLOYEE or
                self.secondary_person_type == PersonType.CLIENT_EMPLOYEE)

    @property
    def is_dependent(self) -> bool:
        """Check if person is a dependent."""
        return self.person_type == PersonType.DEPENDENT

    @property
    def is_service_provider(self) -> bool:
        """Check if person is service provider (primary or secondary role)."""
        return (self.person_type == PersonType.SERVICE_PROVIDER or
                self.secondary_person_type == PersonType.SERVICE_PROVIDER)

    @property
    def is_employee(self) -> bool:
        """Legacy property - check if person is client employee."""
        return self.is_client_employee

    # === Eligibility Properties ===

    @property
    def is_eligible_for_services(self) -> bool:
        """
        Check if person is eligible for EAP services.

        Rules by person type:
        - Platform Staff: Active status (can manage services)
        - Client Employee: Active employment + active client
        - Dependent: Active status + primary employee eligible
        - Service Provider: Active status + valid license + accepting clients
        """
        if self.status != BaseStatus.ACTIVE or self.deleted_at is not None:
            return False

        if self.is_platform_staff and self.person_type == PersonType.PLATFORM_STAFF:
            # Platform staff eligibility for managing services
            return self.staff_organization is not None

        if self.is_client_employee:
            # Client employee eligibility for receiving services
            return (
                self.employment_status == WorkStatus.ACTIVE and
                self.client and
                hasattr(self.client, 'is_active') and
                self.client.is_active
            )

        if self.is_dependent:
            # Dependent eligibility via primary employee
            return (
                self.primary_employee and
                self.primary_employee.is_eligible_for_services
            )

        if self.is_service_provider and self.person_type == PersonType.SERVICE_PROVIDER:
            # Service provider eligibility for providing services
            return (
                self.is_accepting_new_clients and
                (not self.license_expiry or self.license_expiry >= timezone.now().date() if timezone else True) and
                (not self.max_clients or self.current_client_count < self.max_clients)
            )

        return False

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
        """
        Get the primary client organization for this person.

        Returns the organization that defines this person's relationship with the EAP system:
        - Platform Staff: staff_organization
        - Client Employee: client (employer)
        - Dependent: primary employee's client
        - Service Provider: None (independent contractor)
        """
        if self.is_platform_staff and self.person_type == PersonType.PLATFORM_STAFF:
            return self.staff_organization
        elif self.is_client_employee:
            return self.client
        elif self.is_dependent and self.primary_employee:
            return self.primary_employee.client
        return None

    @property
    def effective_organizations(self):
        """
        Get all organizations this person is associated with.

        For dual role persons, returns multiple organizations.
        For single role persons, returns list with one organization.

        Returns:
            list: Client instances this person is associated with
        """
        orgs = []

        # Add organization from primary role
        if self.person_type == PersonType.PLATFORM_STAFF and self.staff_organization:
            orgs.append(self.staff_organization)
        elif self.person_type == PersonType.CLIENT_EMPLOYEE and self.client:
            orgs.append(self.client)
        elif self.person_type == PersonType.DEPENDENT and self.primary_employee:
            primary_client = self.primary_employee.client
            if primary_client:
                orgs.append(primary_client)

        # Add organization from secondary role if dual role
        if self.is_dual_role:
            if self.secondary_person_type == PersonType.PLATFORM_STAFF and self.staff_organization:
                if self.staff_organization not in orgs:
                    orgs.append(self.staff_organization)
            elif self.secondary_person_type == PersonType.CLIENT_EMPLOYEE and self.client:
                if self.client not in orgs:
                    orgs.append(self.client)

        return orgs

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
        Get all dependents for this person (client employees only).

        Returns:
            QuerySet: Person objects who are dependents
        """
        if not self.is_client_employee:
            return Person.objects.none()
        return self.dependents.filter(deleted_at__isnull=True)

    def get_family_unit(self):
        """
        Get complete family unit (client employee + all dependents).

        Returns:
            QuerySet: Person objects in family
        """
        if self.is_client_employee:
            from django.db.models import Q
            return Person.objects.filter(
                Q(id=self.id) | Q(primary_employee=self),
                deleted_at__isnull=True
            )
        elif self.is_dependent and self.primary_employee:
            return self.primary_employee.get_family_unit()
        else:
            return Person.objects.none()

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
        """
        Activate person for service eligibility.

        Sets status to ACTIVE and updates type-specific status fields:
        - Client Employees: employment_status = ACTIVE
        - Service Providers: is_accepting_new_clients = True
        """
        self.status = BaseStatus.ACTIVE

        # Update type-specific status fields
        if self.is_client_employee:
            self.employment_status = WorkStatus.ACTIVE

        if self.is_service_provider:
            self.is_accepting_new_clients = True

        self.save(update_fields=['status', 'employment_status', 'is_accepting_new_clients', 'updated_at'])

    def deactivate(self, reason: str = None) -> None:
        """
        Deactivate person (no longer eligible for services).

        Sets status to INACTIVE and updates type-specific status fields:
        - Client Employees: employment_status = INACTIVE
        - Service Providers: is_accepting_new_clients = False

        Args:
            reason: Optional explanation for deactivation
        """
        self.status = BaseStatus.INACTIVE

        # Update type-specific status fields
        if self.is_client_employee:
            self.employment_status = WorkStatus.INACTIVE

        if self.is_service_provider:
            self.is_accepting_new_clients = False

        # Store deactivation metadata
        if reason:
            if self.metadata is None:
                self.metadata = {}
            self.metadata['deactivation_reason'] = reason
            self.metadata['deactivated_at'] = str(models.functions.Now())

        self.save(update_fields=['status', 'employment_status', 'is_accepting_new_clients', 'metadata', 'updated_at'])

    # === Class Methods for Creation ===

    @classmethod
    def create_client_employee(
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
        Factory method to create a client employee.

        Args:
            profile: Profile instance
            user: User instance
            client: Client instance (employer organization)
            employee_role: Job role/title
            employment_start_date: Date employment began
            employment_status: WorkStatus choice (default: ACTIVE)
            **kwargs: Additional employee fields (employee_department, employee_id_number, etc.)

        Returns:
            Person: Created client employee instance
        """
        return cls.objects.create(
            person_type=PersonType.CLIENT_EMPLOYEE,
            profile=profile,
            user=user,
            client=client,
            employee_role=employee_role,
            employment_start_date=employment_start_date,
            employment_status=employment_status,
            status=BaseStatus.ACTIVE,
            **kwargs
        )

    @classmethod
    def create_platform_staff(
        cls,
        profile,
        user,
        staff_organization,
        staff_role: str,
        staff_department: str = None,
        can_manage_clients: bool = False,
        can_manage_services: bool = False,
        can_view_reports: bool = False,
        **kwargs
    ) -> 'Person':
        """
        Factory method to create platform staff.

        Args:
            profile: Profile instance
            user: User instance
            staff_organization: Client instance (EAP organization)
            staff_role: StaffRole choice (Admin, Manager, Staff, Volunteer)
            staff_department: Department within EAP organization
            can_manage_clients: Permission to manage client accounts
            can_manage_services: Permission to configure services
            can_view_reports: Permission to view analytics
            **kwargs: Additional staff fields

        Returns:
            Person: Created platform staff instance
        """
        return cls.objects.create(
            person_type=PersonType.PLATFORM_STAFF,
            profile=profile,
            user=user,
            staff_organization=staff_organization,
            staff_role=staff_role,
            staff_department=staff_department,
            can_manage_clients=can_manage_clients,
            can_manage_services=can_manage_services,
            can_view_reports=can_view_reports,
            status=BaseStatus.ACTIVE,
            **kwargs
        )

    @classmethod
    def create_service_provider(
        cls,
        profile,
        user,
        provider_type: str,
        license_number: str,
        specializations: list = None,
        hourly_rate=None,
        max_clients: int = None,
        **kwargs
    ) -> 'Person':
        """
        Factory method to create service provider.

        Args:
            profile: Profile instance
            user: User instance
            provider_type: ServiceProviderType choice (Counselor, Clinic, Hotline, Coach, Other)
            license_number: Professional license number (required)
            specializations: List of specialization areas
            hourly_rate: Service rate per hour (optional)
            max_clients: Maximum client capacity (optional)
            **kwargs: Additional provider fields (license_expiry, certifications, etc.)

        Returns:
            Person: Created service provider instance
        """
        return cls.objects.create(
            person_type=PersonType.SERVICE_PROVIDER,
            profile=profile,
            user=user,
            provider_type=provider_type,
            license_number=license_number,
            specializations=specializations or [],
            hourly_rate=hourly_rate,
            max_clients=max_clients,
            current_client_count=0,
            is_accepting_new_clients=True,
            status=BaseStatus.ACTIVE,
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
            primary_employee: Person instance (must be CLIENT_EMPLOYEE or legacy EMPLOYEE type)
            relationship_to_employee: RelationType choice
            guardian: User instance (required for minors)
            **kwargs: Additional dependent fields

        Returns:
            Person: Created dependent instance
        """
        # Validate primary employee is a client employee
        if not primary_employee.is_client_employee:
            raise ValidationError("primary_employee must be a client employee (CLIENT_EMPLOYEE or EMPLOYEE type)")

        return cls.objects.create(
            person_type=PersonType.DEPENDENT,
            profile=profile,
            user=user,
            primary_employee=primary_employee,
            relationship_to_employee=relationship_to_employee,
            guardian=guardian,
            status=BaseStatus.ACTIVE,
            **kwargs
        )

    # === Dual Role Management ===

    def add_secondary_role(
        self,
        secondary_type: str,
        **type_specific_fields
    ) -> None:
        """
        Add a secondary role to this person (enables dual role).

        Valid combinations:
        - PLATFORM_STAFF + CLIENT_EMPLOYEE
        - PLATFORM_STAFF + SERVICE_PROVIDER
        - CLIENT_EMPLOYEE + PLATFORM_STAFF
        - CLIENT_EMPLOYEE + SERVICE_PROVIDER
        - SERVICE_PROVIDER + PLATFORM_STAFF
        - SERVICE_PROVIDER + CLIENT_EMPLOYEE

        Args:
            secondary_type: PersonType choice for secondary role
            **type_specific_fields: Required fields for the secondary role type

        Raises:
            ValidationError: If combination is invalid or required fields missing
        """
        # Validate compatible combination
        valid_combinations = {
            PersonType.PLATFORM_STAFF: [PersonType.CLIENT_EMPLOYEE, PersonType.SERVICE_PROVIDER],
            PersonType.CLIENT_EMPLOYEE: [PersonType.PLATFORM_STAFF, PersonType.SERVICE_PROVIDER],
            PersonType.SERVICE_PROVIDER: [PersonType.PLATFORM_STAFF, PersonType.CLIENT_EMPLOYEE],
        }

        allowed_secondary = valid_combinations.get(self.person_type, [])
        if secondary_type not in allowed_secondary:
            raise ValidationError(
                f"Cannot add {secondary_type} as secondary role to {self.person_type}. "
                f"Allowed combinations: {', '.join(allowed_secondary)}"
            )

        # Cannot add dual role to dependents
        if self.person_type == PersonType.DEPENDENT:
            raise ValidationError("Dependents cannot have dual roles")

        # Already has this secondary role
        if self.is_dual_role and self.secondary_person_type == secondary_type:
            raise ValidationError(f"Already has {secondary_type} as secondary role")

        # Set secondary role type
        self.is_dual_role = True
        self.secondary_person_type = secondary_type

        # Set type-specific fields based on secondary role
        if secondary_type == PersonType.PLATFORM_STAFF:
            # Require staff_organization and staff_role
            if 'staff_organization' not in type_specific_fields:
                raise ValidationError("staff_organization is required for PLATFORM_STAFF role")
            if 'staff_role' not in type_specific_fields:
                raise ValidationError("staff_role is required for PLATFORM_STAFF role")

            self.staff_organization = type_specific_fields.pop('staff_organization')
            self.staff_role = type_specific_fields.pop('staff_role')
            self.staff_department = type_specific_fields.pop('staff_department', None)
            self.can_manage_clients = type_specific_fields.pop('can_manage_clients', False)
            self.can_manage_services = type_specific_fields.pop('can_manage_services', False)
            self.can_view_reports = type_specific_fields.pop('can_view_reports', False)

        elif secondary_type == PersonType.CLIENT_EMPLOYEE:
            # Require client and employment fields
            if 'client' not in type_specific_fields:
                raise ValidationError("client is required for CLIENT_EMPLOYEE role")
            if 'employment_start_date' not in type_specific_fields:
                raise ValidationError("employment_start_date is required for CLIENT_EMPLOYEE role")

            self.client = type_specific_fields.pop('client')
            self.employee_role = type_specific_fields.pop('employee_role', '')
            self.employment_start_date = type_specific_fields.pop('employment_start_date')
            self.employment_status = type_specific_fields.pop('employment_status', WorkStatus.ACTIVE)
            self.employee_department = type_specific_fields.pop('employee_department', None)
            self.employee_id_number = type_specific_fields.pop('employee_id_number', None)

        elif secondary_type == PersonType.SERVICE_PROVIDER:
            # Require provider type and license
            if 'provider_type' not in type_specific_fields:
                raise ValidationError("provider_type is required for SERVICE_PROVIDER role")
            if 'license_number' not in type_specific_fields:
                raise ValidationError("license_number is required for SERVICE_PROVIDER role")

            self.provider_type = type_specific_fields.pop('provider_type')
            self.license_number = type_specific_fields.pop('license_number')
            self.license_expiry = type_specific_fields.pop('license_expiry', None)
            self.specializations = type_specific_fields.pop('specializations', [])
            self.hourly_rate = type_specific_fields.pop('hourly_rate', None)
            self.max_clients = type_specific_fields.pop('max_clients', None)
            self.is_accepting_new_clients = type_specific_fields.pop('is_accepting_new_clients', True)

        # Save any remaining fields to metadata
        if type_specific_fields:
            if self.metadata is None:
                self.metadata = {}
            self.metadata[f'{secondary_type}_extra_fields'] = type_specific_fields

        # Run validation
        self.full_clean()
        self.save()

    def remove_secondary_role(self) -> None:
        """
        Remove secondary role and return to single role person.

        Clears secondary_person_type and is_dual_role flags.
        Does NOT clear the type-specific fields (they may still be valid for primary role).
        """
        if not self.is_dual_role:
            raise ValidationError("Person does not have a secondary role to remove")

        self.is_dual_role = False
        self.secondary_person_type = None
        self.save(update_fields=['is_dual_role', 'secondary_person_type', 'updated_at'])

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
