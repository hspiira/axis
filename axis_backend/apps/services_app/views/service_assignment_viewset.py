"""ViewSet for ServiceAssignment model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.services_app.models import ServiceAssignment
from apps.services_app.services import ServiceAssignmentService
from apps.services_app.serializers import (
    ServiceAssignmentListSerializer,
    ServiceAssignmentDetailSerializer,
    ServiceAssignmentCreateSerializer,
    ServiceAssignmentUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet
from axis_backend.permissions import IsClientScopedOrAdmin, CanModifyObject


@extend_schema_view(
    list=extend_schema(summary="List service assignments", tags=["Service Assignments"]),
    retrieve=extend_schema(summary="Get assignment details", tags=["Service Assignments"]),
    create=extend_schema(summary="Create assignment", tags=["Service Assignments"]),
    update=extend_schema(summary="Update assignment", tags=["Service Assignments"]),
    partial_update=extend_schema(summary="Partially update assignment", tags=["Service Assignments"]),
    destroy=extend_schema(summary="Delete assignment", tags=["Service Assignments"]),
)
class ServiceAssignmentViewSet(BaseModelViewSet):
    """ViewSet for ServiceAssignment CRUD operations."""

    queryset = ServiceAssignment.objects.all()
    permission_classes = [IsAuthenticated, IsClientScopedOrAdmin]
    service_class = ServiceAssignmentService
    list_serializer_class = ServiceAssignmentListSerializer
    detail_serializer_class = ServiceAssignmentDetailSerializer
    create_serializer_class = ServiceAssignmentCreateSerializer
    update_serializer_class = ServiceAssignmentUpdateSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Permissions:
        - list, retrieve: IsAuthenticated + IsClientScopedOrAdmin
        - create, update, partial_update, destroy: + CanModifyObject
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsClientScopedOrAdmin(), CanModifyObject()]
        else:
            return [IsAuthenticated(), IsClientScopedOrAdmin()]

    @extend_schema(
        summary="Get current assignments",
        tags=["Service Assignments"],
        responses={200: ServiceAssignmentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get assignments currently in effect."""
        assignments = self.service.get_current_assignments()
        serializer = ServiceAssignmentListSerializer(assignments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get assignments by client",
        tags=["Service Assignments"],
        responses={200: ServiceAssignmentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='client/(?P<client_id>[^/.]+)')
    def by_client(self, request, client_id=None):
        """Get active assignments for a client."""
        assignments = self.service.get_client_active_assignments(client_id)
        serializer = ServiceAssignmentListSerializer(assignments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Search assignments",
        tags=["Service Assignments"],
        responses={200: ServiceAssignmentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search assignments with filters."""
        service_id = request.query_params.get('service_id')
        contract_id = request.query_params.get('contract_id')
        client_id = request.query_params.get('client_id')
        status = request.query_params.get('status')
        frequency = request.query_params.get('frequency')
        is_current = request.query_params.get('is_current')

        if is_current is not None:
            is_current = is_current.lower() in ('true', '1', 'yes')

        assignments = self.service.search_assignments(
            service_id=service_id,
            contract_id=contract_id,
            client_id=client_id,
            status=status,
            frequency=frequency,
            is_current=is_current
        )
        serializer = ServiceAssignmentListSerializer(assignments, many=True)
        return Response(serializer.data)
