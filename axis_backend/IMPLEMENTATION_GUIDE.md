# Alchemy Backend Implementation Guide

**Repository → Service → API Pattern with SOLID Principles**

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Layer Responsibilities](#layer-responsibilities)
3. [Implementation Steps](#implementation-steps)
4. [SOLID Principles Application](#solid-principles-application)
5. [Code Examples](#code-examples)
6. [Testing Strategy](#testing-strategy)
7. [Best Practices](#best-practices)

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│              API Layer (ViewSets)               │
│  - HTTP handling                                │
│  - Request validation (Serializers)             │
│  - Response formatting                          │
│  - Permissions & Authentication                 │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            Service Layer (Services)             │
│  - Business logic                               │
│  - Validation rules                             │
│  - Transaction management                       │
│  - Cross-entity operations                      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Repository Layer (Repositories)         │
│  - Data access abstraction                      │
│  - Query building                               │
│  - Database operations                          │
│  - ORM interactions                             │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Django ORM (Models)                   │
│  - Database schema                              │
│  - Model methods                                │
│  - Properties & validators                      │
└─────────────────────────────────────────────────┘
```

### Data Flow

**Request Flow:**
```
HTTP Request → ViewSet → Serializer → Service → Repository → Model → Database
```

**Response Flow:**
```
Database → Model → Repository → Service → Serializer → ViewSet → HTTP Response
```

---

## Layer Responsibilities

### 1. Repository Layer

**Purpose**: Abstract data access operations from business logic

**Responsibilities**:
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Query building with filters, pagination, sorting
- ✅ Data fetching with relationships (select_related, prefetch_related)
- ✅ Soft delete handling
- ✅ Search functionality
- ✅ Aggregations and statistics

**What Repository SHOULD NOT Do**:
- ❌ Business logic validation
- ❌ Authorization checks
- ❌ Cross-entity operations
- ❌ Transaction management across multiple entities
- ❌ Complex data transformations

### 2. Service Layer

**Purpose**: Encapsulate business logic and orchestrate operations

**Responsibilities**:
- ✅ Business rule validation
- ✅ Complex operations across multiple repositories
- ✅ Transaction coordination
- ✅ Event triggering (signals, tasks)
- ✅ Business-level transformations
- ✅ Domain-specific calculations

**What Service SHOULD NOT Do**:
- ❌ HTTP request/response handling
- ❌ Direct ORM queries
- ❌ Permission checks (done in ViewSet)
- ❌ Data serialization for API responses

### 3. API Layer (ViewSets + Serializers)

**Purpose**: Handle HTTP communication and API contracts

**Responsibilities**:
- ✅ HTTP method handling (GET, POST, PUT, PATCH, DELETE)
- ✅ Request validation (via serializers)
- ✅ Response formatting (via serializers)
- ✅ Authentication & permissions
- ✅ Pagination configuration
- ✅ API documentation (drf-spectacular)
- ✅ Rate limiting

**What API Layer SHOULD NOT Do**:
- ❌ Business logic
- ❌ Direct database queries
- ❌ Complex data transformations
- ❌ Transaction management

---

## Implementation Steps

### Phase 1: Repository Layer (Week 1-2)

#### Step 1.1: Create Base Repository

**File**: `axis_backend/repositories/base.py`

```python
from typing import Generic, TypeVar, List, Optional, Dict, Any
from django.db import models
from django.db.models import QuerySet, Q, Prefetch
from django.core.paginator import Paginator

T = TypeVar('T', bound=models.Model)

class BaseRepository(Generic[T]):
    """
    Abstract base repository for data access operations.

    Single Responsibility: Data access abstraction
    Open/Closed: Extend with specific repositories
    """

    model: type[T]

    def __init__(self):
        if not hasattr(self, 'model'):
            raise NotImplementedError("Repository must define 'model' attribute")

    def get_queryset(self) -> QuerySet[T]:
        """Get base queryset (excludes soft-deleted by default)."""
        return self.model.objects.all()

    def get_by_id(self, id: str) -> Optional[T]:
        """Retrieve single instance by ID."""
        try:
            return self.get_queryset().get(id=id)
        except self.model.DoesNotExist:
            return None

    def list(
        self,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        ordering: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        List instances with filtering, search, and pagination.

        Returns:
            Dict with 'results', 'count', 'page', 'page_size'
        """
        queryset = self.get_queryset()

        # Apply filters
        if filters:
            queryset = self._apply_filters(queryset, filters)

        # Apply search
        if search:
            queryset = self._apply_search(queryset, search)

        # Apply ordering
        if ordering:
            queryset = queryset.order_by(*ordering)

        # Paginate
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        return {
            'results': list(page_obj),
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages
        }

    def create(self, **data) -> T:
        """Create new instance."""
        return self.model.objects.create(**data)

    def update(self, instance: T, **data) -> T:
        """Update existing instance."""
        for key, value in data.items():
            setattr(instance, key, value)
        instance.save()
        return instance

    def delete(self, instance: T) -> None:
        """Delete instance (soft delete if supported)."""
        if hasattr(instance, 'deleted_at'):
            # Soft delete
            from django.utils import timezone
            instance.deleted_at = timezone.now()
            instance.save(update_fields=['deleted_at'])
        else:
            instance.delete()

    def bulk_create(self, instances: List[T]) -> List[T]:
        """Bulk create instances."""
        return self.model.objects.bulk_create(instances)

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count instances with optional filters."""
        queryset = self.get_queryset()
        if filters:
            queryset = self._apply_filters(queryset, filters)
        return queryset.count()

    def exists(self, filters: Dict[str, Any]) -> bool:
        """Check if instances exist matching filters."""
        return self.get_queryset().filter(**filters).exists()

    # Abstract methods to be implemented by subclasses
    def _apply_filters(self, queryset: QuerySet[T], filters: Dict[str, Any]) -> QuerySet[T]:
        """Apply model-specific filters."""
        return queryset.filter(**filters)

    def _apply_search(self, queryset: QuerySet[T], search: str) -> QuerySet[T]:
        """Apply model-specific search."""
        # Override in subclass with specific search fields
        return queryset
```

#### Step 1.2: Create Person Repository

**File**: `apps/persons/repositories.py`

```python
from typing import Optional, Dict, Any, List
from django.db.models import QuerySet, Q, Prefetch
from axis_backend.repositories.base import BaseRepository
from .models import Person
from axis_backend.enums import PersonType, WorkStatus

class PersonRepository(BaseRepository[Person]):
    """
    Repository for Person model data access.

    Responsibilities:
    - Query building for persons (employees and dependents)
    - Relationship loading optimization
    - Search and filtering operations
    """

    model = Person

    def get_queryset(self) -> QuerySet[Person]:
        """
        Get optimized queryset with common relationships.

        Performance optimization: select_related for ForeignKey,
        prefetch_related for reverse ForeignKey and ManyToMany
        """
        return super().get_queryset().select_related(
            'profile',
            'user',
            'client',
            'primary_employee',
            'guardian'
        )

    def _apply_search(self, queryset: QuerySet[Person], search: str) -> QuerySet[Person]:
        """
        Search across person-related fields.

        Search fields: full name, email, phone
        """
        return queryset.filter(
            Q(profile__full_name__icontains=search) |
            Q(profile__email__icontains=search) |
            Q(profile__phone__icontains=search) |
            Q(user__email__icontains=search)
        )

    def _apply_filters(self, queryset: QuerySet[Person], filters: Dict[str, Any]) -> QuerySet[Person]:
        """Apply person-specific filters."""
        filter_kwargs = {}

        # Person type filter
        if 'person_type' in filters:
            filter_kwargs['person_type'] = filters['person_type']

        # Status filter
        if 'status' in filters:
            filter_kwargs['status'] = filters['status']

        # Client filter (for employees)
        if 'client_id' in filters:
            filter_kwargs['client_id'] = filters['client_id']

        # Employment status filter
        if 'employment_status' in filters:
            filter_kwargs['employment_status'] = filters['employment_status']

        # Role filter
        if 'employee_role' in filters:
            filter_kwargs['employee_role'] = filters['employee_role']

        # Primary employee filter (for dependents)
        if 'primary_employee_id' in filters:
            filter_kwargs['primary_employee_id'] = filters['primary_employee_id']

        # Relationship type filter
        if 'relationship_to_employee' in filters:
            filter_kwargs['relationship_to_employee'] = filters['relationship_to_employee']

        # Date range filters
        if 'employment_start_date__gte' in filters:
            filter_kwargs['employment_start_date__gte'] = filters['employment_start_date__gte']
        if 'employment_start_date__lte' in filters:
            filter_kwargs['employment_start_date__lte'] = filters['employment_start_date__lte']

        return queryset.filter(**filter_kwargs)

    # Domain-specific queries

    def get_employees(
        self,
        client_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> QuerySet[Person]:
        """Get all employees with optional filters."""
        queryset = self.get_queryset().filter(person_type=PersonType.EMPLOYEE)

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if status:
            queryset = queryset.filter(employment_status=status)

        return queryset

    def get_dependents(
        self,
        employee_id: Optional[str] = None,
        relationship: Optional[str] = None
    ) -> QuerySet[Person]:
        """Get all dependents with optional filters."""
        queryset = self.get_queryset().filter(person_type=PersonType.DEPENDENT)

        if employee_id:
            queryset = queryset.filter(primary_employee_id=employee_id)
        if relationship:
            queryset = queryset.filter(relationship_to_employee=relationship)

        return queryset

    def get_eligible_for_services(self) -> QuerySet[Person]:
        """Get all persons eligible for EAP services."""
        # Employees: active status + active employment + active client
        employees = Q(
            person_type=PersonType.EMPLOYEE,
            status='ACTIVE',
            employment_status=WorkStatus.ACTIVE,
            client__status='ACTIVE',
            deleted_at__isnull=True
        )

        # Dependents: active status + primary employee eligible
        dependents = Q(
            person_type=PersonType.DEPENDENT,
            status='ACTIVE',
            primary_employee__status='ACTIVE',
            primary_employee__employment_status=WorkStatus.ACTIVE,
            primary_employee__client__status='ACTIVE',
            deleted_at__isnull=True
        )

        return self.get_queryset().filter(employees | dependents)

    def get_family_unit(self, employee_id: str) -> QuerySet[Person]:
        """Get employee and all their dependents."""
        return self.get_queryset().filter(
            Q(id=employee_id) | Q(primary_employee_id=employee_id)
        )

    def get_minors(self) -> QuerySet[Person]:
        """Get all minor dependents (under 18)."""
        from django.utils import timezone
        from datetime import timedelta

        eighteen_years_ago = timezone.now().date() - timedelta(days=365*18)

        return self.get_queryset().filter(
            person_type=PersonType.DEPENDENT,
            profile__dob__gt=eighteen_years_ago
        )
```

### Phase 2: Service Layer (Week 2-3)

#### Step 2.1: Create Base Service

**File**: `axis_backend/services/base.py`

```python
from typing import Generic, TypeVar, Optional, Dict, Any, List
from django.db import transaction
from django.core.exceptions import ValidationError

T = TypeVar('T')

class BaseService(Generic[T]):
    """
    Abstract base service for business logic.

    Single Responsibility: Business logic orchestration
    Open/Closed: Extend with specific services
    Dependency Inversion: Depends on repository abstraction
    """

    repository_class = None

    def __init__(self):
        if self.repository_class is None:
            raise NotImplementedError("Service must define 'repository_class'")
        self.repository = self.repository_class()

    def get(self, id: str) -> Optional[T]:
        """Retrieve single instance by ID."""
        return self.repository.get_by_id(id)

    def list(
        self,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        ordering: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """List instances with filters and pagination."""
        return self.repository.list(
            filters=filters,
            search=search,
            ordering=ordering,
            page=page,
            page_size=page_size
        )

    @transaction.atomic
    def create(self, data: Dict[str, Any]) -> T:
        """
        Create new instance with validation.

        Override in subclass to add business logic.
        """
        self._validate_create(data)
        instance = self.repository.create(**data)
        self._post_create(instance)
        return instance

    @transaction.atomic
    def update(self, id: str, data: Dict[str, Any]) -> T:
        """
        Update existing instance with validation.

        Override in subclass to add business logic.
        """
        instance = self.repository.get_by_id(id)
        if not instance:
            raise ValidationError(f"Instance with id {id} not found")

        self._validate_update(instance, data)
        updated_instance = self.repository.update(instance, **data)
        self._post_update(updated_instance)
        return updated_instance

    @transaction.atomic
    def delete(self, id: str) -> None:
        """
        Delete instance with validation.

        Override in subclass to add business logic.
        """
        instance = self.repository.get_by_id(id)
        if not instance:
            raise ValidationError(f"Instance with id {id} not found")

        self._validate_delete(instance)
        self.repository.delete(instance)
        self._post_delete(instance)

    # Validation hooks (override in subclasses)
    def _validate_create(self, data: Dict[str, Any]) -> None:
        """Validate data before creation."""
        pass

    def _validate_update(self, instance: T, data: Dict[str, Any]) -> None:
        """Validate data before update."""
        pass

    def _validate_delete(self, instance: T) -> None:
        """Validate before deletion."""
        pass

    # Post-operation hooks (override in subclasses)
    def _post_create(self, instance: T) -> None:
        """Execute logic after creation."""
        pass

    def _post_update(self, instance: T) -> None:
        """Execute logic after update."""
        pass

    def _post_delete(self, instance: T) -> None:
        """Execute logic after deletion."""
        pass
```

#### Step 2.2: Create Person Service

**File**: `apps/persons/services.py`

```python
from typing import Optional, Dict, Any
from django.core.exceptions import ValidationError
from django.db import transaction
from axis_backend.services.base import BaseService
from .repositories import PersonRepository
from .models import Person
from axis_backend.enums import PersonType, StaffRole, WorkStatus, RelationType

class PersonService(BaseService[Person]):
    """
    Service for Person business logic.

    Responsibilities:
    - Person creation validation
    - Eligibility checking
    - Family unit management
    - Business rule enforcement
    """

    repository_class = PersonRepository

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
        - Must have valid profile
        - Must have valid user
        - Must have valid client
        - Must have employment start date
        """
        # Validation
        if not profile_id or not user_id or not client_id:
            raise ValidationError("Employee must have profile, user, and client")

        if not employment_start_date:
            raise ValidationError("Employment start date is required")

        # Check if person already exists for this profile
        if self.repository.exists({'profile_id': profile_id}):
            raise ValidationError("Person with this profile already exists")

        # Create employee
        employee = Person.create_employee(
            profile_id=profile_id,
            user_id=user_id,
            client_id=client_id,
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
        - Must have valid profile
        - Must have valid primary employee
        - Must specify relationship
        - Minors must have guardian
        """
        # Validation
        if not profile_id or not user_id or not primary_employee_id:
            raise ValidationError("Dependent must have profile, user, and primary employee")

        if not relationship_to_employee:
            raise ValidationError("Relationship to employee is required")

        # Verify primary employee exists and is an employee
        primary_employee = self.repository.get_by_id(primary_employee_id)
        if not primary_employee or not primary_employee.is_employee:
            raise ValidationError("Primary employee must be a valid employee")

        # Check if person already exists for this profile
        if self.repository.exists({'profile_id': profile_id}):
            raise ValidationError("Person with this profile already exists")

        # Create dependent
        dependent = Person.create_dependent(
            profile_id=profile_id,
            user_id=user_id,
            primary_employee_id=primary_employee_id,
            relationship_to_employee=relationship_to_employee,
            guardian_id=guardian_id,
            **kwargs
        )

        # Trigger post-creation events
        self._trigger_dependent_created_event(dependent)

        return dependent

    def get_eligible_persons(self) -> Dict[str, Any]:
        """Get all persons eligible for services."""
        eligible = self.repository.get_eligible_for_services()
        return {
            'results': list(eligible),
            'count': eligible.count()
        }

    def get_family_members(self, employee_id: str) -> Dict[str, Any]:
        """Get employee and all dependents."""
        family = self.repository.get_family_unit(employee_id)
        return {
            'results': list(family),
            'count': family.count()
        }

    def activate_person(self, person_id: str) -> Person:
        """Activate person for service eligibility."""
        person = self.repository.get_by_id(person_id)
        if not person:
            raise ValidationError(f"Person {person_id} not found")

        person.activate()
        return person

    def deactivate_person(self, person_id: str, reason: Optional[str] = None) -> Person:
        """Deactivate person."""
        person = self.repository.get_by_id(person_id)
        if not person:
            raise ValidationError(f"Person {person_id} not found")

        person.deactivate(reason=reason)
        return person

    # Validation overrides
    def _validate_create(self, data: Dict[str, Any]) -> None:
        """Validate person creation data."""
        person_type = data.get('person_type')

        if person_type == PersonType.EMPLOYEE:
            if not data.get('client_id'):
                raise ValidationError("Employees must have a client")
            if not data.get('employment_start_date'):
                raise ValidationError("Employees must have employment start date")

        elif person_type == PersonType.DEPENDENT:
            if not data.get('primary_employee_id'):
                raise ValidationError("Dependents must have primary employee")
            if not data.get('relationship_to_employee'):
                raise ValidationError("Dependents must have relationship type")

    def _validate_update(self, instance: Person, data: Dict[str, Any]) -> None:
        """Validate person update data."""
        # Cannot change person type
        if 'person_type' in data and data['person_type'] != instance.person_type:
            raise ValidationError("Cannot change person type")

        # Validate type-specific constraints
        if instance.is_employee:
            if 'primary_employee_id' in data:
                raise ValidationError("Employees cannot have primary employee")

        if instance.is_dependent:
            if 'client_id' in data:
                raise ValidationError("Dependents cannot have direct client")

    def _validate_delete(self, instance: Person) -> None:
        """Validate person deletion."""
        # Check if employee has dependents
        if instance.is_employee:
            dependents_count = self.repository.get_dependents(employee_id=instance.id).count()
            if dependents_count > 0:
                raise ValidationError(
                    f"Cannot delete employee with {dependents_count} dependents. "
                    "Delete or reassign dependents first."
                )

    # Event triggers
    def _trigger_employee_created_event(self, employee: Person) -> None:
        """Trigger events after employee creation."""
        # Send welcome email, create default records, etc.
        pass

    def _trigger_dependent_created_event(self, dependent: Person) -> None:
        """Trigger events after dependent creation."""
        # Notify primary employee, etc.
        pass
```

### Phase 3: API Layer (Week 3-4)

#### Step 3.1: Create Serializers

**File**: `apps/persons/serializers.py`

```python
from rest_framework import serializers
from .models import Person
from apps.authentication.models import Profile, User
from apps.clients.models import Client
from axis_backend.enums import PersonType, StaffRole, WorkStatus, RelationType, BaseStatus

class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile model."""

    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'full_name', 'preferred_name', 'dob', 'age', 'gender',
            'phone', 'email', 'address', 'city', 'state', 'postal_code',
            'country', 'preferred_language', 'preferred_contact_method',
            'image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'age', 'created_at', 'updated_at']

class PersonListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for person lists.

    Interface Segregation: List views don't need full details
    """

    profile_name = serializers.CharField(source='profile.full_name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    is_eligible = serializers.BooleanField(source='is_eligible_for_services', read_only=True)

    class Meta:
        model = Person
        fields = [
            'id', 'person_type', 'profile_name', 'client_name',
            'employee_role', 'employment_status', 'status',
            'is_eligible', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class PersonDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for person details.

    Includes all relationships and computed properties
    """

    profile = ProfileSerializer(read_only=True)
    client = serializers.StringRelatedField(read_only=True)
    primary_employee = serializers.StringRelatedField(read_only=True)
    guardian = serializers.StringRelatedField(read_only=True)

    # Computed fields
    is_eligible = serializers.BooleanField(source='is_eligible_for_services', read_only=True)
    is_minor = serializers.BooleanField(read_only=True)
    requires_consent = serializers.BooleanField(source='requires_guardian_consent', read_only=True)
    employment_duration = serializers.IntegerField(source='employment_duration_days', read_only=True)

    class Meta:
        model = Person
        fields = [
            'id', 'person_type', 'profile', 'user', 'client', 'primary_employee',
            'guardian', 'employee_role', 'employment_start_date', 'employment_end_date',
            'employment_status', 'qualifications', 'specializations',
            'preferred_working_hours', 'relationship_to_employee',
            'is_employee_dependent', 'status', 'last_service_date',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_email', 'notes', 'metadata',
            'is_eligible', 'is_minor', 'requires_consent', 'employment_duration',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_eligible', 'is_minor', 'requires_consent',
            'employment_duration', 'created_at', 'updated_at'
        ]

class CreateEmployeeSerializer(serializers.Serializer):
    """
    Serializer for employee creation.

    Single Responsibility: Employee creation validation
    """

    profile_id = serializers.CharField()
    user_id = serializers.CharField()
    client_id = serializers.CharField()
    employee_role = serializers.ChoiceField(choices=StaffRole.choices)
    employment_start_date = serializers.DateField()
    employment_status = serializers.ChoiceField(
        choices=WorkStatus.choices,
        default=WorkStatus.ACTIVE
    )
    qualifications = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    specializations = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    preferred_working_hours = serializers.JSONField(required=False, allow_null=True)
    emergency_contact_name = serializers.CharField(required=False, allow_null=True)
    emergency_contact_phone = serializers.CharField(required=False, allow_null=True)
    emergency_contact_email = serializers.EmailField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)

class CreateDependentSerializer(serializers.Serializer):
    """
    Serializer for dependent creation.

    Single Responsibility: Dependent creation validation
    """

    profile_id = serializers.CharField()
    user_id = serializers.CharField()
    primary_employee_id = serializers.CharField()
    relationship_to_employee = serializers.ChoiceField(choices=RelationType.choices)
    guardian_id = serializers.CharField(required=False, allow_null=True)
    is_employee_dependent = serializers.BooleanField(default=False)
    emergency_contact_name = serializers.CharField(required=False, allow_null=True)
    emergency_contact_phone = serializers.CharField(required=False, allow_null=True)
    emergency_contact_email = serializers.EmailField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)

class PersonUpdateSerializer(serializers.ModelSerializer):
    """Serializer for person updates."""

    class Meta:
        model = Person
        fields = [
            'employee_role', 'employment_status', 'employment_end_date',
            'qualifications', 'specializations', 'preferred_working_hours',
            'relationship_to_employee', 'is_employee_dependent',
            'status', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_email', 'notes', 'metadata'
        ]
```

#### Step 3.2: Create ViewSets

**File**: `apps/persons/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Person
from .services import PersonService
from .serializers import (
    PersonListSerializer,
    PersonDetailSerializer,
    CreateEmployeeSerializer,
    CreateDependentSerializer,
    PersonUpdateSerializer
)
from axis_backend.permissions import IsAdminOrManager

@extend_schema_view(
    list=extend_schema(summary="List all persons"),
    retrieve=extend_schema(summary="Get person details"),
    create=extend_schema(summary="Create person"),
    update=extend_schema(summary="Update person"),
    partial_update=extend_schema(summary="Partially update person"),
    destroy=extend_schema(summary="Delete person")
)
class PersonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Person management.

    Responsibilities:
    - HTTP request/response handling
    - Authentication & permissions
    - Data serialization
    - API documentation

    Dependency Inversion: Depends on PersonService abstraction
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['person_type', 'status', 'employment_status', 'employee_role']
    search_fields = ['profile__full_name', 'profile__email', 'user__email']
    ordering_fields = ['created_at', 'employment_start_date', 'last_service_date']
    ordering = ['-created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = PersonService()

    def get_queryset(self):
        """
        Get queryset via service layer.

        Applies permissions and filters
        """
        return self.service.repository.get_queryset()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.

        Interface Segregation: Different serializers for different needs
        """
        if self.action == 'list':
            return PersonListSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PersonDetailSerializer
        elif self.action == 'create_employee':
            return CreateEmployeeSerializer
        elif self.action == 'create_dependent':
            return CreateDependentSerializer
        return PersonDetailSerializer

    @extend_schema(
        request=CreateEmployeeSerializer,
        responses={201: PersonDetailSerializer}
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrManager])
    def create_employee(self, request):
        """
        Create new employee.

        Business logic delegated to service layer
        """
        serializer = CreateEmployeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            employee = self.service.create_employee(**serializer.validated_data)
            return Response(
                PersonDetailSerializer(employee).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        request=CreateDependentSerializer,
        responses={201: PersonDetailSerializer}
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrManager])
    def create_dependent(self, request):
        """
        Create new dependent.

        Business logic delegated to service layer
        """
        serializer = CreateDependentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            dependent = self.service.create_dependent(**serializer.validated_data)
            return Response(
                PersonDetailSerializer(dependent).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(responses={200: PersonListSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def eligible(self, request):
        """Get all persons eligible for services."""
        result = self.service.get_eligible_persons()
        serializer = PersonListSerializer(result['results'], many=True)
        return Response({
            'count': result['count'],
            'results': serializer.data
        })

    @extend_schema(responses={200: PersonListSerializer(many=True)})
    @action(detail=True, methods=['get'])
    def family(self, request, pk=None):
        """Get employee and all dependents."""
        result = self.service.get_family_members(pk)
        serializer = PersonListSerializer(result['results'], many=True)
        return Response({
            'count': result['count'],
            'results': serializer.data
        })

    @extend_schema(responses={200: PersonDetailSerializer})
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrManager])
    def activate(self, request, pk=None):
        """Activate person."""
        person = self.service.activate_person(pk)
        return Response(PersonDetailSerializer(person).data)

    @extend_schema(responses={200: PersonDetailSerializer})
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrManager])
    def deactivate(self, request, pk=None):
        """Deactivate person."""
        reason = request.data.get('reason')
        person = self.service.deactivate_person(pk, reason=reason)
        return Response(PersonDetailSerializer(person).data)
```

#### Step 3.3: Configure URLs

**File**: `apps/persons/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonViewSet

router = DefaultRouter()
router.register(r'persons', PersonViewSet, basename='person')

urlpatterns = [
    path('', include(router.urls)),
]
```

**File**: `axis_backend/urls.py` (update)

```python
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API endpoints
    path('api/v1/', include('apps.persons.urls')),
    path('api/v1/', include('apps.authentication.urls')),
    path('api/v1/', include('apps.clients.urls')),
    # ... other apps
]
```

---

## SOLID Principles Application

### Single Responsibility Principle (SRP)

**Each layer has one reason to change:**

- **Repository**: Changes only when data access patterns change
- **Service**: Changes only when business rules change
- **ViewSet**: Changes only when API contracts change
- **Serializer**: Changes only when data validation/format changes

### Open/Closed Principle (OCP)

**Open for extension, closed for modification:**

```python
# Base classes are closed for modification
class BaseRepository(Generic[T]):
    # Core functionality that doesn't change
    pass

# Extended for specific needs without modifying base
class PersonRepository(BaseRepository[Person]):
    # Person-specific extensions
    def get_eligible_for_services(self): ...
```

### Liskov Substitution Principle (LSP)

**Subtypes must be substitutable:**

```python
# Any repository can be used wherever BaseRepository is expected
def process_with_repository(repo: BaseRepository[T]):
    repo.get_by_id(id)  # Works with any repository subclass
```

### Interface Segregation Principle (ISP)

**Clients shouldn't depend on unused interfaces:**

```python
# Different serializers for different needs
PersonListSerializer  # Lightweight for lists
PersonDetailSerializer  # Full details for retrieval
CreateEmployeeSerializer  # Only creation fields
```

### Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions:**

```python
# Service depends on repository interface, not implementation
class PersonService(BaseService[Person]):
    repository_class = PersonRepository  # Injection point

    def __init__(self):
        self.repository = self.repository_class()  # Abstraction
```

---

## Testing Strategy

### Repository Tests

**File**: `apps/persons/tests/test_repositories.py`

```python
from django.test import TestCase
from apps.persons.repositories import PersonRepository
from apps.persons.models import Person
from axis_backend.enums import PersonType

class PersonRepositoryTest(TestCase):
    def setUp(self):
        self.repo = PersonRepository()

    def test_get_employees(self):
        """Test filtering employees."""
        # Create test data
        employee = Person.create_employee(...)

        # Test
        employees = self.repo.get_employees()
        self.assertEqual(employees.count(), 1)
        self.assertEqual(employees.first().person_type, PersonType.EMPLOYEE)

    def test_search_by_name(self):
        """Test search functionality."""
        # Create person
        person = Person.create_employee(...)

        # Search
        result = self.repo.list(search='John')
        self.assertIn(person, result['results'])
```

### Service Tests

**File**: `apps/persons/tests/test_services.py`

```python
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.persons.services import PersonService

class PersonServiceTest(TestCase):
    def setUp(self):
        self.service = PersonService()

    def test_create_employee_validation(self):
        """Test employee creation validation."""
        with self.assertRaises(ValidationError):
            self.service.create_employee(
                profile_id=None,  # Invalid
                user_id='user-id',
                client_id='client-id',
                employee_role='MANAGER',
                employment_start_date='2024-01-01'
            )

    def test_create_dependent_requires_employee(self):
        """Test dependent requires valid employee."""
        with self.assertRaises(ValidationError):
            self.service.create_dependent(
                profile_id='profile-id',
                user_id='user-id',
                primary_employee_id='invalid',
                relationship_to_employee='CHILD'
            )
```

### API Tests

**File**: `apps/persons/tests/test_views.py`

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class PersonViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(...)
        self.client.force_authenticate(user=self.user)

    def test_list_persons(self):
        """Test listing persons."""
        response = self.client.get('/api/v1/persons/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_employee(self):
        """Test employee creation endpoint."""
        data = {
            'profile_id': 'profile-id',
            'user_id': 'user-id',
            'client_id': 'client-id',
            'employee_role': 'MANAGER',
            'employment_start_date': '2024-01-01'
        }
        response = self.client.post('/api/v1/persons/create_employee/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

---

## Best Practices

### 1. Repository Layer

✅ **DO**:
- Keep queries optimized with select_related/prefetch_related
- Use consistent naming (get_, list_, create_, update_, delete_)
- Return QuerySets for flexibility
- Handle soft deletes consistently

❌ **DON'T**:
- Put business logic in repositories
- Perform multiple database calls when one suffices
- Return serialized data (return models)

### 2. Service Layer

✅ **DO**:
- Use @transaction.atomic for multi-step operations
- Validate business rules before database operations
- Use hooks (_validate_*, _post_*) for extensibility
- Raise descriptive exceptions

❌ **DON'T**:
- Perform direct ORM queries
- Handle HTTP requests/responses
- Serialize data for API

### 3. API Layer

✅ **DO**:
- Use appropriate serializers per action
- Document endpoints with @extend_schema
- Delegate business logic to services
- Return consistent response formats

❌ **DON'T**:
- Put business logic in views
- Perform database queries directly
- Skip input validation

### 4. General

✅ **DO**:
- Write comprehensive docstrings
- Follow type hints
- Write tests for each layer
- Keep layers decoupled

❌ **DON'T**:
- Mix layer responsibilities
- Skip validation
- Ignore SOLID principles
- Duplicate code across layers

---

## Implementation Checklist

### Week 1-2: Repository Layer
- [ ] Create base repository
- [ ] Implement PersonRepository
- [ ] Implement ClientRepository
- [ ] Implement ServiceRepository
- [ ] Write repository tests (80% coverage)

### Week 2-3: Service Layer
- [ ] Create base service
- [ ] Implement PersonService
- [ ] Implement ClientService
- [ ] Implement ServiceSessionService
- [ ] Write service tests (80% coverage)

### Week 3-4: API Layer
- [ ] Create serializers for all models
- [ ] Implement ViewSets
- [ ] Configure URL routing
- [ ] Add permissions
- [ ] Write API tests (80% coverage)

### Week 4: Integration & Documentation
- [ ] Integration testing
- [ ] API documentation
- [ ] Performance optimization
- [ ] Security review
- [ ] Deploy to staging

---

**Next**: Start with PersonRepository implementation following this guide.
