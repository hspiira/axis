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

from axis_backend.views.base import BaseModelViewSet
from axis_backend.permissions import IsAdminOrManager, IsOwnerOrAdmin, CanManagePersons
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

    # Permissions
    permission_classes = [IsAuthenticated]

    # Filtering and search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['person_type', 'status', 'employment_status', 'employee_role', 'client']
    search_fields = ['profile__full_name', 'profile__email', 'user__email', 'profile__phone']
    ordering_fields = ['created_at', 'employment_start_date', 'last_service_date', 'profile__full_name']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Different actions require different permission levels:
        - list, retrieve: IsAuthenticated (basic access)
        - create_employee, create_dependent: IsAdminOrManager (elevated)
        - update, partial_update, destroy: CanManagePersons (HR/manager)
        - activate, deactivate, update_employment_status: CanManagePersons (HR/manager)
        - eligible, family, by_client: IsAuthenticated (basic access)

        Returns:
            List of permission instances for current action
        """
        if self.action in ['create_employee', 'create_dependent']:
            permission_classes = [IsAdminOrManager]
        elif self.action in ['update', 'partial_update', 'destroy', 'activate', 'deactivate', 'update_employment_status']:
            permission_classes = [CanManagePersons]
        elif self.action in ['retrieve', 'family']:
            # Users can view their own record or family members
            permission_classes = [IsOwnerOrAdmin]
        else:
            # list, eligible, by_client - basic authenticated access
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

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
        Create new employee.

        Business logic delegated to PersonService.

        Args:
            request: HTTP request with employee data

        Returns:
            Response with created employee
        """
        serializer = CreateEmployeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            employee = self.service.create_employee(**serializer.validated_data)
            response_serializer = PersonDetailSerializer(employee)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
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
        Create new dependent.

        Business logic delegated to PersonService.

        Args:
            request: HTTP request with dependent data

        Returns:
            Response with created dependent
        """
        serializer = CreateDependentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            dependent = self.service.create_dependent(**serializer.validated_data)
            response_serializer = PersonDetailSerializer(dependent)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
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
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

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
        summary="Get employees by client",
        description="Get all employees for a specific client",
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
        Get employees for a specific client.

        Args:
            request: HTTP request
            client_id: Client ID

        Returns:
            Response with employees
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
