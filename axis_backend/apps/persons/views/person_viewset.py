"""ViewSet for Person model."""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.core.exceptions import ValidationError
from django.db import transaction

from axis_backend.views.base import BaseModelViewSet
from axis_backend.utils.query_params import parse_positive_int
from axis_backend.permissions import (
    IsAdminOrManager,
    IsOwnerOrAdmin,
    CanManagePersons,
    IsClientScopedOrAdmin,
    CanModifyObject
)
from apps.persons.services.person_service import PersonService
from apps.persons.serializers.person_serializer import (
    PersonListSerializer,
    PersonDetailSerializer,
    CreateEmployeeSerializer,
    CreateDependentSerializer,
    PersonUpdateSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List all persons",
        description="Get paginated list of persons (employees and dependents) with filtering and search",
        parameters=[
            OpenApiParameter('person_type', OpenApiTypes.STR, description='Filter by person type (EMPLOYEE/DEPENDENT)'),
            OpenApiParameter('status', OpenApiTypes.STR, description='Filter by status'),
            OpenApiParameter('employment_status', OpenApiTypes.STR, description='Filter by employment status'),
            OpenApiParameter('client_id', OpenApiTypes.STR, description='Filter by client ID'),
            OpenApiParameter('search', OpenApiTypes.STR, description='Search by name, email, phone'),
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Items per page'),
        ]
    ),
    retrieve=extend_schema(
        summary="Get person details",
        description="Get detailed information about a specific person"
    ),
    update=extend_schema(
        summary="Update person",
        description="Update person information (cannot change person type)"
    ),
    partial_update=extend_schema(
        summary="Partially update person",
        description="Partially update person information"
    ),
    destroy=extend_schema(
        summary="Delete person",
        description="Soft delete person (cannot delete employees with active dependents)"
    )
)
class PersonViewSet(BaseModelViewSet):
    """
    ViewSet for Person management.

    Responsibilities (Single Responsibility Principle):
    - HTTP request/response handling
    - Authentication & permissions
    - Data serialization
    - API documentation

    Design Notes:
    - Extends BaseModelViewSet for standard CRUD
    - Delegates all business logic to PersonService
    - Uses different serializers per action (Interface Segregation)
    - Custom actions for domain-specific operations
    """

    # Service and serializer configuration
    service_class = PersonService
    list_serializer_class = PersonListSerializer
    detail_serializer_class = PersonDetailSerializer
    update_serializer_class = PersonUpdateSerializer

    # Permissions (client-scoped + object-level)
    permission_classes = [IsAuthenticated, IsClientScopedOrAdmin]

    # Filtering and search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['person_type', 'status', 'employment_status', 'employee_role', 'client']
    search_fields = ['profile__full_name', 'profile__email', 'user__email', 'profile__phone']
    ordering_fields = ['created_at', 'employment_start_date', 'last_service_date', 'profile__full_name']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Layered permissions for sensitive personal data:
        1. IsAuthenticated - Must be logged in
        2. IsClientScopedOrAdmin - Can only access authorized clients
        3. Action-specific permissions for modifications

        Permission levels:
        - list, retrieve: IsAuthenticated + IsClientScopedOrAdmin
        - create_employee, create_dependent: + CanManagePersons
        - update, partial_update, destroy: + CanModifyObject
        - activate, deactivate, update_employment_status: + CanManagePersons
        - eligible, family, by_client: IsAuthenticated + IsClientScopedOrAdmin

        Returns:
            List of permission instances for current action
        """
        # Base permissions for all actions
        base_permissions = [IsAuthenticated(), IsClientScopedOrAdmin()]

        if self.action in ['create_employee', 'create_dependent']:
            # Only HR/Managers can create persons
            return [*base_permissions, CanManagePersons()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Modifications require ownership or manage permissions
            return [*base_permissions, CanModifyObject()]
        elif self.action in ['activate', 'deactivate', 'update_employment_status']:
            # Status changes require HR/Manager permissions
            return [*base_permissions, CanManagePersons()]
        elif self.action in ['retrieve', 'family']:
            # Users can view their own record or family members (ownership check)
            return [*base_permissions, IsOwnerOrAdmin()]
        else:
            # list, eligible, by_client use base client-scoped permissions
            return base_permissions

    # Custom Actions

    @extend_schema(
        summary="Create employee",
        description="Create new employee with validation",
        request=CreateEmployeeSerializer,
        responses={201: PersonDetailSerializer}
    )
    @action(detail=False, methods=['post'], url_path='create-employee')
    def create_employee(self, request):
        """
        Create new employee with profile and user account creation.

        Automatically creates:
        1. Profile from provided data
        2. User account (inactive by default, pending admin approval)
        3. Person record

        Args:
            request: HTTP request with employee and profile data

        Returns:
            Response with created employee
        """
        from apps.authentication.models import Profile, User
        from apps.persons.models import Person
        from axis_backend.enums import PersonType

        serializer = CreateEmployeeSerializer(data=request.data)

        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        print("VALIDATED DATA:", data)

        # Wrap all database operations in a transaction
        # If any operation fails, all changes will be rolled back
        try:
            with transaction.atomic():
                # Extract profile fields
                profile_data = {
                    'full_name': data.pop('full_name'),
                    'email': data.pop('email', None),
                    'phone': data.pop('phone', None),
                    'dob': data.pop('date_of_birth', None),
                    'gender': data.pop('gender', None),
                }

                # Handle address fields - Profile has address field but not city/country
                # Store full address in Profile.address, city/country in metadata
                address = data.pop('address', None)
                city = data.pop('city', None)
                country = data.pop('country', None)
                
                # Build full address string if any address components exist
                if address or city or country:
                    address_parts = []
                    if address:
                        address_parts.append(address)
                    if city:
                        address_parts.append(city)
                    if country:
                        address_parts.append(country)
                    profile_data['address'] = ', '.join(address_parts) if address_parts else None
                    
                    # Store city and country in metadata for structured access
                    if city or country:
                        profile_data['metadata'] = {}
                        if city:
                            profile_data['metadata']['city'] = city
                        if country:
                            profile_data['metadata']['country'] = country

                # Determine email for user account
                # Person model requires a user, so we must have one
                # If no email provided, create user with a placeholder email
                email = profile_data.get('email')
                if not email:
                    # Generate placeholder email from full_name and client_id
                    # This ensures we can create a user even without an email
                    client_id = data.get('client_id', 'unknown')
                    name_slug = profile_data['full_name'].lower().replace(' ', '.').replace("'", "")
                    email = f"{name_slug}.{client_id[:8]}@placeholder.local"
                
                # Check if user with this email already exists
                user = None
                profile = None
                try:
                    user = User.objects.get(email=email)
                    # User exists - check if it has a profile
                    if hasattr(user, 'profile') and user.profile:
                        # Profile exists - check if it's already linked to a Person
                        # Person.profile is OneToOne, so one profile = one person
                        if hasattr(user.profile, 'person') and user.profile.person:
                            # Profile is already linked to another Person
                            existing_person = user.profile.person
                            return Response(
                                {
                                    'error': f'User with email {email} already exists and is linked to another person (ID: {existing_person.id}, Type: {existing_person.person_type}). '
                                             'Each profile can only be linked to one person.'
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        else:
                            # Profile exists but not linked to Person - reuse it
                            profile = user.profile
                            # Update profile with new data (if provided)
                            for key, value in profile_data.items():
                                if value is not None and key != 'email':  # Don't overwrite email
                                    setattr(profile, key, value)
                            profile.save()
                    else:
                        # User exists but no profile - create new profile
                        profile = Profile.objects.create(**profile_data)
                        profile.user = user
                        profile.save()
                except User.DoesNotExist:
                    # User doesn't exist - create new user and profile
                    user = User.objects.create(
                        email=email,
                        username=email,  # Use email as username
                        is_active=False  # Inactive pending admin approval
                    )
                    # Create new profile
                    profile = Profile.objects.create(**profile_data)
                    # Link profile to user (profile has FK to user, not vice versa)
                    profile.user = user
                    profile.save()

                # Extract other fields
                client_id = data.pop('client_id')

                # Create person
                person = Person.objects.create(
                    person_type=PersonType.CLIENT_EMPLOYEE,
                    profile=profile,
                    user=user,  # Link user account (required field)
                    client_id=client_id,
                    **data
                )

                response_serializer = PersonDetailSerializer(person)
                return Response(
                    response_serializer.data,
                    status=status.HTTP_201_CREATED
                )
        except ValidationError as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e), 'type': type(e).__name__},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Create dependent",
        description="Create new dependent linked to an employee",
        request=CreateDependentSerializer,
        responses={201: PersonDetailSerializer}
    )
    @action(detail=False, methods=['post'], url_path='create-dependent')
    def create_dependent(self, request):
        """
        Create new dependent with profile and user account creation.

        Automatically creates:
        1. Profile from provided data
        2. User account (inactive by default, pending admin approval)
        3. Person record

        Args:
            request: HTTP request with dependent and profile data

        Returns:
            Response with created dependent
        """
        from apps.authentication.models import Profile, User
        from apps.persons.models import Person
        from axis_backend.enums import PersonType

        serializer = CreateDependentSerializer(data=request.data)

        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        print("VALIDATED DATA:", data)

        # Wrap all database operations in a transaction
        # If any operation fails, all changes will be rolled back
        try:
            with transaction.atomic():
                # Extract profile fields
                profile_data = {
                    'full_name': data.pop('full_name'),
                    'email': data.pop('email', None),
                    'phone': data.pop('phone', None),
                    'dob': data.pop('date_of_birth', None),
                    'gender': data.pop('gender', None),
                }

                # Determine email for user account
                # Person model requires a user, so we must have one
                # If no email provided, create user with a placeholder email
                email = profile_data.get('email')
                if not email:
                    # Generate placeholder email from full_name and primary_employee_id
                    # This ensures we can create a user even without an email
                    primary_employee_id = data.get('primary_employee_id', 'unknown')
                    name_slug = profile_data['full_name'].lower().replace(' ', '.').replace("'", "")
                    email = f"{name_slug}.{primary_employee_id[:8]}@placeholder.local"
                
                # Check if user with this email already exists
                user = None
                profile = None
                try:
                    user = User.objects.get(email=email)
                    # User exists - check if it has a profile
                    if hasattr(user, 'profile') and user.profile:
                        # Profile exists - check if it's already linked to a Person
                        # Person.profile is OneToOne, so one profile = one person
                        if hasattr(user.profile, 'person') and user.profile.person:
                            # Profile is already linked to another Person
                            existing_person = user.profile.person
                            return Response(
                                {
                                    'error': f'User with email {email} already exists and is linked to another person (ID: {existing_person.id}, Type: {existing_person.person_type}). '
                                             'Each profile can only be linked to one person.'
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        else:
                            # Profile exists but not linked to Person - reuse it
                            profile = user.profile
                            # Update profile with new data (if provided)
                            for key, value in profile_data.items():
                                if value is not None and key != 'email':  # Don't overwrite email
                                    setattr(profile, key, value)
                            profile.save()
                    else:
                        # User exists but no profile - create new profile
                        profile = Profile.objects.create(**profile_data)
                        profile.user = user
                        profile.save()
                except User.DoesNotExist:
                    # User doesn't exist - create new user and profile
                    user = User.objects.create(
                        email=email,
                        username=email,  # Use email as username
                        is_active=False  # Inactive pending admin approval
                    )
                    # Create new profile
                    profile = Profile.objects.create(**profile_data)
                    # Link profile to user (profile has FK to user, not vice versa)
                    profile.user = user
                    profile.save()

                # Extract other fields
                primary_employee_id = data.pop('primary_employee_id')
                relationship_to_employee = data.pop('relationship_to_employee')

                # Verify primary employee exists and is a client employee
                try:
                    primary_employee = Person.objects.get(id=primary_employee_id)
                    if not primary_employee.is_client_employee:
                        return Response(
                            {
                                'error': f'Primary employee with id {primary_employee_id} is not a client employee'
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Person.DoesNotExist:
                    return Response(
                        {
                            'error': f'Primary employee with id {primary_employee_id} does not exist'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create person
                person = Person.objects.create(
                    person_type=PersonType.DEPENDENT,
                    profile=profile,
                    user=user,  # Link user account (required field)
                    primary_employee=primary_employee,
                    relationship_to_employee=relationship_to_employee,
                    **data
                )

                response_serializer = PersonDetailSerializer(person)
                return Response(
                    response_serializer.data,
                    status=status.HTTP_201_CREATED
                )
        except ValidationError as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e), 'type': type(e).__name__},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get eligible persons",
        description="Get all persons eligible for EAP services",
        responses={200: PersonListSerializer(many=True)},
        parameters=[
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Items per page'),
        ]
    )
    @action(detail=False, methods=['get'])
    def eligible(self, request):
        """
        Get all persons eligible for services.

        Args:
            request: HTTP request

        Returns:
            Response with eligible persons
        """
        # Parse and validate pagination parameters
        page, error_response = parse_positive_int(
            request.query_params.get('page'),
            'page',
            default=1,
            min_value=1
        )
        if error_response:
            return error_response

        page_size, error_response = parse_positive_int(
            request.query_params.get('page_size'),
            'page_size',
            default=10,
            min_value=1
        )
        if error_response:
            return error_response

        result = self.service.get_eligible_persons(
            page=page,
            page_size=page_size
        )

        serializer = PersonListSerializer(result['results'], many=True)
        return Response({
            'results': serializer.data,
            'count': result['count'],
            'page': result['page'],
            'page_size': result['page_size'],
            'total_pages': result['total_pages']
        })

    @extend_schema(
        summary="Get family members",
        description="Get employee and all their dependents (family unit)",
        responses={200: PersonListSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def family(self, request, pk=None):
        """
        Get employee and all dependents.

        Args:
            request: HTTP request
            pk: Employee ID

        Returns:
            Response with family members
        """
        try:
            result = self.service.get_family_members(pk)

            return Response({
                'employee': PersonDetailSerializer(result['employee']).data,
                'dependents': PersonListSerializer(result['dependents'], many=True).data,
                'total_members': result['total_members']
            })
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get persons by client",
        description="Get all employees and dependents for a specific client",
        responses={200: PersonListSerializer(many=True)},
        parameters=[
            OpenApiParameter('status', OpenApiTypes.STR, description='Filter by employment status'),
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Items per page'),
        ]
    )
    @action(detail=False, methods=['get'], url_path='by-client/(?P<client_id>[^/.]+)')
    def by_client(self, request, client_id=None):
        """
        Get employees and dependents for a specific client.

        Args:
            request: HTTP request
            client_id: Client ID

        Returns:
            Response with employees and dependents
        """
        employment_status = request.query_params.get('status')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        result = self.service.get_employees_by_client(
            client_id=client_id,
            status=employment_status,
            page=page,
            page_size=page_size
        )

        serializer = PersonListSerializer(result['results'], many=True)
        return Response({
            'results': serializer.data,
            'count': result['count'],
            'page': result['page'],
            'page_size': result['page_size'],
            'total_pages': result['total_pages']
        })

    @extend_schema(
        summary="Activate person",
        description="Activate person for service eligibility",
        responses={200: PersonDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate person.

        Args:
            request: HTTP request
            pk: Person ID

        Returns:
            Response with activated person
        """
        try:
            person = self.service.activate_person(pk)
            return Response(PersonDetailSerializer(person).data)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Deactivate person",
        description="Deactivate person (no longer eligible for services)",
        request={'application/json': {'type': 'object', 'properties': {'reason': {'type': 'string'}}}},
        responses={200: PersonDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Deactivate person.

        Args:
            request: HTTP request with optional reason
            pk: Person ID

        Returns:
            Response with deactivated person
        """
        reason = request.data.get('reason')

        try:
            person = self.service.deactivate_person(pk, reason=reason)
            return Response(PersonDetailSerializer(person).data)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Update employment status",
        description="Update employee's employment status",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'employment_status': {'type': 'string'},
                    'employment_end_date': {'type': 'string', 'format': 'date'}
                },
                'required': ['employment_status']
            }
        },
        responses={200: PersonDetailSerializer}
    )
    @action(detail=True, methods=['post'], url_path='update-employment-status')
    def update_employment_status(self, request, pk=None):
        """
        Update employee's employment status.

        Args:
            request: HTTP request with status and optional end date
            pk: Person ID

        Returns:
            Response with updated person
        """
        employment_status = request.data.get('employment_status')
        employment_end_date = request.data.get('employment_end_date')

        if not employment_status:
            return Response(
                {'error': 'employment_status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            person = self.service.update_employment_status(
                pk,
                employment_status,
                employment_end_date
            )
            return Response(PersonDetailSerializer(person).data)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Override get_filters_from_request to handle custom filters

    def get_filters_from_request(self, request) -> dict:
        """
        Extract filters from request query parameters.

        Handles person-specific filters like is_eligible.

        Args:
            request: HTTP request

        Returns:
            Dictionary of filters
        """
        filters = super().get_filters_from_request(request)

        # Handle special filters
        is_eligible = request.query_params.get('is_eligible')
        if is_eligible is not None:
            filters['is_eligible'] = is_eligible.lower() == 'true'

        return filters
