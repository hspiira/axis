"""Repository for Person model data access."""
from typing import Optional, Dict, Any, List
from django.db.models import QuerySet, Q, Prefetch
from axis_backend.repositories.base import BaseRepository
from apps.persons.models import Person
from axis_backend.enums import PersonType, WorkStatus, BaseStatus


class PersonRepository(BaseRepository[Person]):
    """
    Repository for Person model data access.

    Responsibilities (Single Responsibility Principle):
    - Query building for persons (employees and dependents)
    - Relationship loading optimization
    - Search and filtering operations
    - Domain-specific data access methods

    Design Notes:
    - Uses select_related for ForeignKey optimization
    - Provides domain queries (employees, dependents, eligible)
    - Handles both employee and dependent filtering
    """

    model = Person

    def get_queryset(self) -> QuerySet[Person]:
        """
        Get optimized queryset with common relationships.

        Performance optimization:
        - select_related: ForeignKey relationships (1-to-1, many-to-1)
        - Reduces database queries from N+1 to 1

        Returns:
            Optimized QuerySet with related objects loaded
        """
        return super().get_queryset().select_related(
            'profile',
            'user',
            'client',
            'client__industry',
            'primary_employee',
            'primary_employee__profile',
            'guardian'
        )

    def _apply_search(self, queryset: QuerySet[Person], search: str) -> QuerySet[Person]:
        """
        Search across person-related fields.

        Search fields:
        - Profile: full_name, email, phone
        - User: email

        Args:
            queryset: Base queryset
            search: Search query string

        Returns:
            Filtered queryset matching search
        """
        if not search:
            return queryset

        return queryset.filter(
            Q(profile__full_name__icontains=search) |
            Q(profile__email__icontains=search) |
            Q(profile__phone__icontains=search) |
            Q(user__email__icontains=search)
        ).distinct()

    def _apply_filters(self, queryset: QuerySet[Person], filters: Dict[str, Any]) -> QuerySet[Person]:
        """
        Apply person-specific filters.

        Supported filters:
        - person_type: EMPLOYEE or DEPENDENT
        - status: BaseStatus choices
        - client_id: Filter by client (employees only)
        - employment_status: WorkStatus choices
        - employee_role: StaffRole choices
        - primary_employee_id: Filter by primary employee (dependents)
        - relationship_to_employee: RelationType choices
        - is_eligible: Filter by service eligibility
        - employment_start_date__gte/lte: Date range

        Args:
            queryset: Base queryset
            filters: Dictionary of filter parameters

        Returns:
            Filtered queryset
        """
        filter_kwargs = {}

        # Person type filter
        if 'person_type' in filters and filters['person_type']:
            filter_kwargs['person_type'] = filters['person_type']

        # Status filter
        if 'status' in filters and filters['status']:
            filter_kwargs['status'] = filters['status']

        # Client filter (for employees)
        if 'client_id' in filters and filters['client_id']:
            filter_kwargs['client_id'] = filters['client_id']

        # Employment status filter
        if 'employment_status' in filters and filters['employment_status']:
            filter_kwargs['employment_status'] = filters['employment_status']

        # Role filter
        if 'employee_role' in filters and filters['employee_role']:
            filter_kwargs['employee_role'] = filters['employee_role']

        # Primary employee filter (for dependents)
        if 'primary_employee_id' in filters and filters['primary_employee_id']:
            filter_kwargs['primary_employee_id'] = filters['primary_employee_id']

        # Relationship type filter
        if 'relationship_to_employee' in filters and filters['relationship_to_employee']:
            filter_kwargs['relationship_to_employee'] = filters['relationship_to_employee']

        # Date range filters
        if 'employment_start_date__gte' in filters and filters['employment_start_date__gte']:
            filter_kwargs['employment_start_date__gte'] = filters['employment_start_date__gte']

        if 'employment_start_date__lte' in filters and filters['employment_start_date__lte']:
            filter_kwargs['employment_start_date__lte'] = filters['employment_start_date__lte']

        queryset = queryset.filter(**filter_kwargs)

        # Special filter: is_eligible
        # This requires complex logic, handle separately
        if 'is_eligible' in filters and filters['is_eligible'] is not None:
            if filters['is_eligible']:
                queryset = self._filter_eligible(queryset)
            else:
                queryset = self._filter_not_eligible(queryset)

        return queryset

    def _filter_eligible(self, queryset: QuerySet[Person]) -> QuerySet[Person]:
        """
        Filter persons eligible for services.

        Eligibility rules:
        - Employees: Active status + Active employment + Active client
        - Dependents: Active status + Primary employee eligible

        Args:
            queryset: Base queryset

        Returns:
            Queryset of eligible persons
        """
        # Employees: active status + active employment + active client
        employees = Q(
            person_type=PersonType.EMPLOYEE,
            status=BaseStatus.ACTIVE,
            employment_status=WorkStatus.ACTIVE,
            client__status=BaseStatus.ACTIVE,
            deleted_at__isnull=True
        )

        # Dependents: active status + primary employee eligible
        dependents = Q(
            person_type=PersonType.DEPENDENT,
            status=BaseStatus.ACTIVE,
            primary_employee__status=BaseStatus.ACTIVE,
            primary_employee__employment_status=WorkStatus.ACTIVE,
            primary_employee__client__status=BaseStatus.ACTIVE,
            deleted_at__isnull=True
        )

        return queryset.filter(employees | dependents)

    def _filter_not_eligible(self, queryset: QuerySet[Person]) -> QuerySet[Person]:
        """
        Filter persons NOT eligible for services.

        Args:
            queryset: Base queryset

        Returns:
            Queryset of ineligible persons
        """
        # Get eligible IDs
        eligible_ids = self._filter_eligible(queryset).values_list('id', flat=True)

        # Exclude eligible persons
        return queryset.exclude(id__in=eligible_ids)

    # Domain-specific query methods

    def get_employees(
        self,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        employment_status: Optional[str] = None
    ) -> QuerySet[Person]:
        """
        Get all employees with optional filters.

        Args:
            client_id: Filter by client
            status: Filter by BaseStatus
            employment_status: Filter by WorkStatus

        Returns:
            QuerySet of employees
        """
        queryset = self.get_queryset().filter(person_type=PersonType.EMPLOYEE)

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if status:
            queryset = queryset.filter(status=status)
        if employment_status:
            queryset = queryset.filter(employment_status=employment_status)

        return queryset

    def get_dependents(
        self,
        employee_id: Optional[str] = None,
        relationship: Optional[str] = None,
        status: Optional[str] = None
    ) -> QuerySet[Person]:
        """
        Get all dependents with optional filters.

        Args:
            employee_id: Filter by primary employee
            relationship: Filter by RelationType
            status: Filter by BaseStatus

        Returns:
            QuerySet of dependents
        """
        queryset = self.get_queryset().filter(person_type=PersonType.DEPENDENT)

        if employee_id:
            queryset = queryset.filter(primary_employee_id=employee_id)
        if relationship:
            queryset = queryset.filter(relationship_to_employee=relationship)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get_eligible_for_services(self) -> QuerySet[Person]:
        """
        Get all persons eligible for EAP services.

        Applies complex eligibility logic for both employees and dependents.

        Returns:
            QuerySet of eligible persons
        """
        return self._filter_eligible(self.get_queryset())

    def get_family_unit(self, employee_id: str) -> QuerySet[Person]:
        """
        Get employee and all their dependents.

        Args:
            employee_id: Primary employee ID

        Returns:
            QuerySet containing employee and dependents
        """
        return self.get_queryset().filter(
            Q(id=employee_id) | Q(primary_employee_id=employee_id)
        )

    def get_minors(self) -> QuerySet[Person]:
        """
        Get all minor dependents (under 18 years old).

        Calculation based on profile.dob field.

        Returns:
            QuerySet of minors
        """
        from django.utils import timezone
        from datetime import timedelta

        # Calculate date 18 years ago
        eighteen_years_ago = timezone.now().date() - timedelta(days=365*18)

        return self.get_queryset().filter(
            person_type=PersonType.DEPENDENT,
            profile__dob__gt=eighteen_years_ago,
            profile__dob__isnull=False
        )

    def get_by_profile(self, profile_id: str) -> Optional[Person]:
        """
        Get person by profile ID.

        Args:
            profile_id: Profile ID

        Returns:
            Person instance or None
        """
        try:
            return self.get_queryset().get(profile_id=profile_id)
        except Person.DoesNotExist:
            return None

    def get_by_user(self, user_id: str) -> Optional[Person]:
        """
        Get person by user ID.

        Args:
            user_id: User ID

        Returns:
            Person instance or None
        """
        try:
            return self.get_queryset().get(user_id=user_id)
        except Person.DoesNotExist:
            return None

    def count_by_client(self, client_id: str) -> Dict[str, int]:
        """
        Count persons by client.

        Args:
            client_id: Client ID

        Returns:
            Dictionary with employee and dependent counts
        """
        employees = self.get_employees(client_id=client_id).count()

        # Dependents linked through primary employee
        dependents = self.get_queryset().filter(
            person_type=PersonType.DEPENDENT,
            primary_employee__client_id=client_id
        ).count()

        return {
            'employees': employees,
            'dependents': dependents,
            'total': employees + dependents
        }

    def get_active_employees(self, client_id: Optional[str] = None) -> QuerySet[Person]:
        """
        Get active employees.

        Args:
            client_id: Optional client filter

        Returns:
            QuerySet of active employees
        """
        return self.get_employees(
            client_id=client_id,
            status=BaseStatus.ACTIVE,
            employment_status=WorkStatus.ACTIVE
        )
