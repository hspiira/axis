"""Service for Person business logic."""
from typing import Optional, Dict, Any, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from axis_backend.services.base import BaseService
from apps.persons.repositories.person_repository import PersonRepository
from apps.persons.models import Person
from axis_backend.enums import PersonType, StaffRole, WorkStatus, RelationType, BaseStatus


class PersonService(BaseService[Person]):
    """
    Service for Person business logic.

    Responsibilities (Single Responsibility Principle):
    - Person creation validation
    - Eligibility checking
    - Family unit management
    - Business rule enforcement
    - Cross-entity coordination

    Design Notes:
    - All database access through PersonRepository
    - Transaction management for multi-step operations
    - Event triggers for external systems
    """

    repository_class = PersonRepository

    # Employee Operations

    @transaction.atomic
    def create_employee(
        self,
        profile_id: str,
        user_id: str,
        client_id: str,
        employee_role: str,
        employment_start_date,
        employment_status: str = WorkStatus.ACTIVE,
        **kwargs
    ) -> Person:
        """
        Create employee with business validation.

        Business Rules:
        - Must have valid profile, user, and client
        - Must have employment start date
        - Profile cannot already be linked to another person
        - Employment end date must be after start date (if provided)

        Args:
            profile_id: Profile ID
            user_id: User ID
            client_id: Client ID
            employee_role: StaffRole choice
            employment_start_date: Employment start date
            employment_status: WorkStatus choice (default: ACTIVE)
            **kwargs: Additional employee fields

        Returns:
            Created employee Person instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not profile_id or not user_id or not client_id:
            raise ValidationError({
                'error': 'Employee must have profile, user, and client'
            })

        if not employment_start_date:
            raise ValidationError({
                'employment_start_date': 'Employment start date is required for employees'
            })

        # Validate employment dates
        employment_end_date = kwargs.get('employment_end_date')
        if employment_end_date and employment_end_date < employment_start_date:
            raise ValidationError({
                'employment_end_date': 'Employment end date must be after start date'
            })

        # Check if person already exists for this profile
        if self.repository.exists({'profile_id': profile_id}):
            raise ValidationError({
                'profile_id': 'Person with this profile already exists'
            })

        # Validate and fetch profile
        from apps.authentication.models import Profile
        try:
            profile = Profile.objects.get(id=profile_id)
        except Profile.DoesNotExist:
            raise ValidationError({
                'profile_id': f'Profile with id {profile_id} does not exist'
            })

        # Validate and fetch user
        from apps.authentication.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({
                'user_id': f'User with id {user_id} does not exist'
            })

        # Validate and fetch client
        from apps.clients.models import Client
        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            raise ValidationError({
                'client_id': f'Client with id {client_id} does not exist'
            })

        # Create employee using factory method with objects (not IDs)
        employee = Person.create_employee(
            profile=profile,
            user=user,
            client=client,
            employee_role=employee_role,
            employment_start_date=employment_start_date,
            employment_status=employment_status,
            **kwargs
        )

        # Trigger post-creation events
        self._trigger_employee_created_event(employee)

        return employee

    @transaction.atomic
    def create_dependent(
        self,
        profile_id: str,
        user_id: str,
        primary_employee_id: str,
        relationship_to_employee: str,
        guardian_id: Optional[str] = None,
        **kwargs
    ) -> Person:
        """
        Create dependent with business validation.

        Business Rules:
        - Must have valid profile, user, and primary employee
        - Must specify relationship type
        - Minors (under 18) must have guardian
        - Primary employee must be an actual employee
        - Profile cannot already be linked to another person

        Args:
            profile_id: Profile ID
            user_id: User ID
            primary_employee_id: Primary employee Person ID
            relationship_to_employee: RelationType choice
            guardian_id: Guardian User ID (required for minors)
            **kwargs: Additional dependent fields

        Returns:
            Created dependent Person instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not profile_id or not user_id or not primary_employee_id:
            raise ValidationError({
                'error': 'Dependent must have profile, user, and primary employee'
            })

        if not relationship_to_employee:
            raise ValidationError({
                'relationship_to_employee': 'Relationship to employee is required for dependents'
            })

        # Verify primary employee exists and is an employee
        primary_employee = self.repository.get_by_id(primary_employee_id)
        if not primary_employee:
            raise ValidationError({
                'primary_employee_id': f'Primary employee with id {primary_employee_id} does not exist'
            })

        if not primary_employee.is_employee:
            raise ValidationError({
                'primary_employee_id': 'Primary employee must be of type EMPLOYEE'
            })

        # Check if person already exists for this profile
        if self.repository.exists({'profile_id': profile_id}):
            raise ValidationError({
                'profile_id': 'Person with this profile already exists'
            })

        # Validate and fetch profile
        from apps.authentication.models import Profile
        try:
            profile = Profile.objects.get(id=profile_id)
        except Profile.DoesNotExist:
            raise ValidationError({
                'profile_id': f'Profile with id {profile_id} does not exist'
            })

        # Validate and fetch user
        from apps.authentication.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({
                'user_id': f'User with id {user_id} does not exist'
            })

        # Check if minor and validate guardian
        guardian = None
        if relationship_to_employee == RelationType.CHILD:
            if profile.age and profile.age < 18:
                if not guardian_id:
                    raise ValidationError({
                        'guardian_id': 'Guardian is required for dependents under 18'
                    })

                # Validate and fetch guardian
                try:
                    guardian = User.objects.get(id=guardian_id)
                except User.DoesNotExist:
                    raise ValidationError({
                        'guardian_id': f'Guardian user with id {guardian_id} does not exist'
                    })

        # Create dependent using factory method with objects (not IDs)
        dependent = Person.create_dependent(
            profile=profile,
            user=user,
            primary_employee=primary_employee,
            relationship_to_employee=relationship_to_employee,
            guardian=guardian,
            **kwargs
        )

        # Trigger post-creation events
        self._trigger_dependent_created_event(dependent)

        return dependent

    # Query Operations

    def get_eligible_persons(
        self,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Get all persons eligible for EAP services.

        Args:
            filters: Optional additional filters
            page: Page number
            page_size: Items per page

        Returns:
            Dictionary with eligible persons and pagination
        """
        # Get base eligible queryset
        eligible_qs = self.repository.get_eligible_for_services()

        # Apply additional filters if provided
        if filters:
            eligible_qs = self.repository._apply_filters(eligible_qs, filters)

        # Paginate
        from django.core.paginator import Paginator
        paginator = Paginator(eligible_qs, page_size)
        page_obj = paginator.get_page(page)

        return {
            'results': list(page_obj),
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages
        }

    def get_family_members(self, employee_id: str) -> Dict[str, Any]:
        """
        Get employee and all dependents (family unit).

        Args:
            employee_id: Employee Person ID

        Returns:
            Dictionary with family members

        Raises:
            ValidationError: If employee not found or not an employee
        """
        # Validate employee exists
        employee = self.repository.get_by_id(employee_id)
        if not employee:
            raise ValidationError({
                'employee_id': f'Employee with id {employee_id} does not exist'
            })

        if not employee.is_employee:
            raise ValidationError({
                'employee_id': 'Person must be an employee to get family members'
            })

        # Get family unit
        family = self.repository.get_family_unit(employee_id)

        return {
            'employee': employee,
            'dependents': [p for p in family if p.is_dependent],
            'total_members': family.count()
        }

    def get_employees_by_client(
        self,
        client_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Get employees for a specific client.

        Args:
            client_id: Client ID
            status: Optional employment status filter
            page: Page number
            page_size: Items per page

        Returns:
            Dictionary with employees and pagination
        """
        employees = self.repository.get_employees(
            client_id=client_id,
            employment_status=status
        )

        # Paginate
        from django.core.paginator import Paginator
        paginator = Paginator(employees, page_size)
        page_obj = paginator.get_page(page)

        return {
            'results': list(page_obj),
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages
        }

    # Status Management Operations

    @transaction.atomic
    def activate_person(self, person_id: str) -> Person:
        """
        Activate person for service eligibility.

        Business Rules:
        - Updates status to ACTIVE
        - If employee, also updates employment_status to ACTIVE

        Args:
            person_id: Person ID

        Returns:
            Activated person

        Raises:
            ValidationError: If person not found
        """
        person = self.repository.get_by_id(person_id)
        if not person:
            raise ValidationError({
                'person_id': f'Person with id {person_id} not found'
            })

        # Use model method
        person.activate()

        # Trigger event
        self._trigger_person_activated_event(person)

        return person

    @transaction.atomic
    def deactivate_person(self, person_id: str, reason: Optional[str] = None) -> Person:
        """
        Deactivate person (no longer eligible for services).

        Business Rules:
        - Updates status to INACTIVE
        - If employee, also updates employment_status to INACTIVE
        - Records deactivation reason in metadata

        Args:
            person_id: Person ID
            reason: Optional deactivation reason

        Returns:
            Deactivated person

        Raises:
            ValidationError: If person not found
        """
        person = self.repository.get_by_id(person_id)
        if not person:
            raise ValidationError({
                'person_id': f'Person with id {person_id} not found'
            })

        # Use model method
        person.deactivate(reason=reason)

        # Trigger event
        self._trigger_person_deactivated_event(person, reason)

        return person

    @transaction.atomic
    def update_employment_status(
        self,
        person_id: str,
        employment_status: str,
        employment_end_date: Optional[Any] = None
    ) -> Person:
        """
        Update employee's employment status.

        Business Rules:
        - Can only update employment status for employees
        - If status is TERMINATED or RESIGNED, end date should be set

        Args:
            person_id: Person ID
            employment_status: New WorkStatus
            employment_end_date: Optional employment end date

        Returns:
            Updated person

        Raises:
            ValidationError: If person not found or not an employee
        """
        person = self.repository.get_by_id(person_id)
        if not person:
            raise ValidationError({
                'person_id': f'Person with id {person_id} not found'
            })

        if not person.is_employee:
            raise ValidationError({
                'person_id': 'Can only update employment status for employees'
            })

        # Validate and convert end date if provided
        if employment_end_date:
            # Convert string to date if necessary
            if isinstance(employment_end_date, str):
                from datetime import datetime
                try:
                    employment_end_date = datetime.strptime(employment_end_date, '%Y-%m-%d').date()
                except ValueError:
                    raise ValidationError({
                        'employment_end_date': 'Invalid date format. Expected YYYY-MM-DD'
                    })

            if employment_end_date < person.employment_start_date:
                raise ValidationError({
                    'employment_end_date': 'Employment end date must be after start date'
                })

        # Update
        update_data = {'employment_status': employment_status}
        if employment_end_date:
            update_data['employment_end_date'] = employment_end_date

        updated_person = self.repository.update(person, **update_data)

        return updated_person

    # Validation Overrides

    def _validate_create(self, data: Dict[str, Any]) -> None:
        """
        Validate person creation data.

        Args:
            data: Creation data

        Raises:
            ValidationError: If validation fails
        """
        person_type = data.get('person_type')

        if person_type == PersonType.EMPLOYEE:
            # Employee validation
            if not data.get('client_id'):
                raise ValidationError({'client_id': 'Employees must have a client'})
            if not data.get('employment_start_date'):
                raise ValidationError({'employment_start_date': 'Employees must have employment start date'})
            if not data.get('employee_role'):
                raise ValidationError({'employee_role': 'Employees must have a role'})

        elif person_type == PersonType.DEPENDENT:
            # Dependent validation
            if not data.get('primary_employee_id'):
                raise ValidationError({'primary_employee_id': 'Dependents must have primary employee'})
            if not data.get('relationship_to_employee'):
                raise ValidationError({'relationship_to_employee': 'Dependents must have relationship type'})

    def _validate_update(self, instance: Person, data: Dict[str, Any]) -> None:
        """
        Validate person update data.

        Args:
            instance: Person being updated
            data: Update data

        Raises:
            ValidationError: If validation fails
        """
        # Cannot change person type
        if 'person_type' in data and data['person_type'] != instance.person_type:
            raise ValidationError({'person_type': 'Cannot change person type'})

        # Validate type-specific constraints
        if instance.is_employee:
            if 'primary_employee_id' in data:
                raise ValidationError({'primary_employee_id': 'Employees cannot have primary employee'})
            if 'relationship_to_employee' in data:
                raise ValidationError({'relationship_to_employee': 'Employees cannot have relationship to employee'})

        if instance.is_dependent:
            if 'client_id' in data:
                raise ValidationError({'client_id': 'Dependents cannot have direct client'})
            if 'employee_role' in data:
                raise ValidationError({'employee_role': 'Dependents cannot have employee role'})

    def _validate_delete(self, instance: Person) -> None:
        """
        Validate person deletion.

        Business Rules:
        - Employees with active dependents cannot be deleted
        - Must reassign or delete dependents first

        Args:
            instance: Person being deleted

        Raises:
            ValidationError: If validation fails
        """
        # Check if employee has dependents
        if instance.is_employee:
            dependents_count = self.repository.get_dependents(
                employee_id=instance.id
            ).count()

            if dependents_count > 0:
                raise ValidationError({
                    'error': f'Cannot delete employee with {dependents_count} active dependents. '
                             'Delete or reassign dependents first.'
                })

        # Check if person has active service sessions
        active_sessions = instance.get_active_sessions()
        if active_sessions.exists():
            raise ValidationError({
                'error': f'Cannot delete person with {active_sessions.count()} active service sessions. '
                         'Complete or cancel sessions first.'
            })

    # Event Triggers (Post-operation Hooks)

    def _trigger_employee_created_event(self, employee: Person) -> None:
        """
        Trigger events after employee creation.

        Can be extended to:
        - Send welcome email
        - Create default service assignments
        - Notify HR system
        - Log audit trail

        Args:
            employee: Created employee
        """
        # TODO: Implement event triggers
        # Example: send_welcome_email.delay(employee.id)
        pass

    def _trigger_dependent_created_event(self, dependent: Person) -> None:
        """
        Trigger events after dependent creation.

        Can be extended to:
        - Notify primary employee
        - Create family plan
        - Update client statistics

        Args:
            dependent: Created dependent
        """
        # TODO: Implement event triggers
        # Example: notify_primary_employee.delay(dependent.id)
        pass

    def _trigger_person_activated_event(self, person: Person) -> None:
        """
        Trigger events after person activation.

        Args:
            person: Activated person
        """
        # TODO: Implement event triggers
        pass

    def _trigger_person_deactivated_event(self, person: Person, reason: Optional[str]) -> None:
        """
        Trigger events after person deactivation.

        Args:
            person: Deactivated person
            reason: Deactivation reason
        """
        # TODO: Implement event triggers
        pass

    def _post_create(self, instance: Person) -> None:
        """
        Execute logic after person creation.

        Args:
            instance: Created person
        """
        # Handled by specific create methods
        pass

    def _post_update(self, instance: Person) -> None:
        """
        Execute logic after person update.

        Args:
            instance: Updated person
        """
        # Can add update-specific logic here
        pass

    def _post_delete(self, instance: Person) -> None:
        """
        Execute logic after person deletion.

        Args:
            instance: Deleted person
        """
        # Can add deletion-specific logic here
        pass
