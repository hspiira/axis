"""Serializers for Person model."""
from rest_framework import serializers
from apps.persons.models import Person
from apps.authentication.models import Profile
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin
)
from axis_backend.enums import (
    PersonType,
    StaffRole,
    WorkStatus,
    RelationType,
    BaseStatus
)


class ProfileNestedSerializer(serializers.ModelSerializer):
    """
    Nested serializer for Profile in Person responses.

    Interface Segregation: Only fields needed in person context
    """

    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'full_name', 'preferred_name', 'dob', 'age',
            'gender', 'phone', 'email', 'image'
        ]
        read_only_fields = ['id', 'age']


class PersonListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """
    Lightweight serializer for person lists.

    Single Responsibility: List view data only
    Interface Segregation: Minimal fields for performance
    Extends: BaseListSerializer for common list patterns
    """

    profile_name = serializers.CharField(source='profile.full_name', read_only=True)
    profile_email = serializers.CharField(source='profile.email', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    is_eligible = serializers.BooleanField(source='is_eligible_for_services', read_only=True)

    class Meta:
        model = Person
        fields = [
            'id',
            'person_type',
            'profile_name',
            'profile_email',
            'client_name',
            'employee_role',
            'employment_status',
            'relationship_to_employee',
            'status',
            'is_eligible',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PersonDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """
    Comprehensive serializer for person details.

    Single Responsibility: Detailed view data
    Extends: BaseDetailSerializer for common detail patterns
    Includes: All relationships and computed properties
    """

    profile = ProfileNestedSerializer(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    client_id = serializers.CharField(source='client.id', read_only=True, allow_null=True)
    primary_employee_name = serializers.CharField(
        source='primary_employee.profile.full_name',
        read_only=True,
        allow_null=True
    )
    primary_employee_id = serializers.CharField(
        source='primary_employee.id',
        read_only=True,
        allow_null=True
    )
    guardian_email = serializers.CharField(source='guardian.email', read_only=True, allow_null=True)

    # Computed fields
    is_employee = serializers.BooleanField(read_only=True)
    is_dependent = serializers.BooleanField(read_only=True)
    is_eligible = serializers.BooleanField(source='is_eligible_for_services', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_minor = serializers.BooleanField(read_only=True)
    requires_consent = serializers.BooleanField(source='requires_guardian_consent', read_only=True)
    employment_duration = serializers.IntegerField(source='employment_duration_days', read_only=True)
    effective_client_name = serializers.CharField(
        source='effective_client.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Person
        fields = [
            # IDs and type
            'id',
            'person_type',
            # Relationships
            'profile',
            'user_email',
            'client_name',
            'client_id',
            'primary_employee_name',
            'primary_employee_id',
            'guardian_email',
            # Employee fields
            'employee_role',
            'employment_start_date',
            'employment_end_date',
            'employment_status',
            'qualifications',
            'specializations',
            'preferred_working_hours',
            # Dependent fields
            'relationship_to_employee',
            'is_employee_dependent',
            # Shared fields
            'status',
            'last_service_date',
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_email',
            'notes',
            'metadata',
            # Computed fields
            'is_employee',
            'is_dependent',
            'is_eligible',
            'is_active',
            'is_minor',
            'requires_consent',
            'employment_duration',
            'effective_client_name',
            # Timestamps
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'is_employee',
            'is_dependent',
            'is_eligible',
            'is_active',
            'is_minor',
            'requires_consent',
            'employment_duration',
            'effective_client_name',
            'created_at',
            'updated_at'
        ]


class CreateEmployeeSerializer(BaseCreateSerializer):
    """
    Serializer for employee creation.

    Single Responsibility: Employee creation validation
    Extends: BaseCreateSerializer for common creation patterns
    Validates: All required fields for employee
    """

    profile_id = serializers.CharField(
        help_text="Profile ID"
    )
    user_id = serializers.CharField(
        help_text="User ID for authentication"
    )
    client_id = serializers.CharField(
        help_text="Client (employer) ID"
    )
    employee_role = serializers.ChoiceField(
        choices=StaffRole.choices,
        help_text="Employee role"
    )
    employment_start_date = serializers.DateField(
        help_text="Employment start date"
    )
    employment_end_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Employment end date (optional)"
    )
    employment_status = serializers.ChoiceField(
        choices=WorkStatus.choices,
        default=WorkStatus.ACTIVE,
        help_text="Employment status"
    )
    qualifications = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text="List of qualifications/certifications"
    )
    specializations = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text="List of specializations/departments"
    )
    preferred_working_hours = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Work schedule preferences"
    )
    emergency_contact_name = serializers.CharField(
        required=False,
        allow_null=True,
        max_length=255,
        help_text="Emergency contact name"
    )
    emergency_contact_phone = serializers.CharField(
        required=False,
        allow_null=True,
        max_length=20,
        help_text="Emergency contact phone"
    )
    emergency_contact_email = serializers.EmailField(
        required=False,
        allow_null=True,
        help_text="Emergency contact email"
    )
    notes = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Internal notes"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Additional flexible attributes"
    )

    def validate(self, data):
        """
        Validate employee creation data.

        Business Rules:
        - Employment end date must be after start date

        Args:
            data: Validated field data

        Returns:
            Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        # Call parent validation
        data = super().validate(data)

        # Validate employment dates
        if data.get('employment_end_date'):
            if data['employment_end_date'] < data['employment_start_date']:
                raise serializers.ValidationError({
                    'employment_end_date': 'Employment end date must be after start date'
                })

        return data


class CreateDependentSerializer(BaseCreateSerializer):
    """
    Serializer for dependent creation.

    Single Responsibility: Dependent creation validation
    Extends: BaseCreateSerializer for common creation patterns
    Validates: All required fields for dependent
    """

    profile_id = serializers.CharField(
        help_text="Profile ID"
    )
    user_id = serializers.CharField(
        help_text="User ID for authentication"
    )
    primary_employee_id = serializers.CharField(
        help_text="Primary employee (parent) ID"
    )
    relationship_to_employee = serializers.ChoiceField(
        choices=RelationType.choices,
        help_text="Relationship to primary employee"
    )
    guardian_id = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Guardian user ID (required for minors)"
    )
    is_employee_dependent = serializers.BooleanField(
        default=False,
        help_text="Whether dependent is also an employee (e.g., spouse)"
    )
    emergency_contact_name = serializers.CharField(
        required=False,
        allow_null=True,
        max_length=255,
        help_text="Emergency contact name"
    )
    emergency_contact_phone = serializers.CharField(
        required=False,
        allow_null=True,
        max_length=20,
        help_text="Emergency contact phone"
    )
    emergency_contact_email = serializers.EmailField(
        required=False,
        allow_null=True,
        help_text="Emergency contact email"
    )
    notes = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="Internal notes"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Additional flexible attributes"
    )


class PersonCreateSerializer(serializers.ModelSerializer):
    """
    Generic serializer for person creation (not type-specific).

    Note: Prefer CreateEmployeeSerializer or CreateDependentSerializer
    for type-specific creation with proper validation.
    """

    class Meta:
        model = Person
        fields = [
            'person_type',
            'profile',
            'user',
            'client',
            'primary_employee',
            'guardian',
            'employee_role',
            'employment_start_date',
            'employment_end_date',
            'employment_status',
            'qualifications',
            'specializations',
            'preferred_working_hours',
            'relationship_to_employee',
            'is_employee_dependent',
            'status',
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_email',
            'notes',
            'metadata',
        ]


class PersonUpdateSerializer(BaseUpdateSerializer):
    """
    Serializer for person updates.

    Single Responsibility: Update validation
    Extends: BaseUpdateSerializer for common update patterns
    Cannot change: person_type or core relationships
    """

    # Employee fields (can update if employee)
    employee_role = serializers.ChoiceField(
        choices=StaffRole.choices,
        required=False
    )
    employment_status = serializers.ChoiceField(
        choices=WorkStatus.choices,
        required=False
    )
    employment_end_date = serializers.DateField(
        required=False,
        allow_null=True
    )
    qualifications = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    specializations = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    preferred_working_hours = serializers.JSONField(
        required=False,
        allow_null=True
    )

    # Dependent fields (can update if dependent)
    relationship_to_employee = serializers.ChoiceField(
        choices=RelationType.choices,
        required=False
    )
    is_employee_dependent = serializers.BooleanField(required=False)

    # Shared fields
    status = serializers.ChoiceField(
        choices=BaseStatus.choices,
        required=False
    )
    emergency_contact_name = serializers.CharField(
        required=False,
        allow_null=True,
        max_length=255
    )
    emergency_contact_phone = serializers.CharField(
        required=False,
        allow_null=True,
        max_length=20
    )
    emergency_contact_email = serializers.EmailField(
        required=False,
        allow_null=True
    )
    notes = serializers.CharField(
        required=False,
        allow_null=True
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True
    )

    def validate(self, data):
        """
        Validate update data based on person type.

        Business Rules:
        - Employees cannot update dependent-specific fields
        - Dependents cannot update employee-specific fields

        Args:
            data: Validated field data

        Returns:
            Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        # Call parent validation
        data = super().validate(data)

        instance = self.instance

        if instance.is_employee:
            # Validate employee updates
            if 'relationship_to_employee' in data:
                raise serializers.ValidationError({
                    'relationship_to_employee': 'Cannot set relationship for employees'
                })

        if instance.is_dependent:
            # Validate dependent updates
            employee_fields = [
                'employee_role',
                'employment_status',
                'employment_end_date',
                'qualifications',
                'specializations',
                'preferred_working_hours'
            ]
            for field in employee_fields:
                if field in data:
                    raise serializers.ValidationError({
                        field: f'Cannot set {field} for dependents'
                    })

        return data
