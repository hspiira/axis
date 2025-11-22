"""ViewSet for KPIAssignment model."""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import serializers as drf_serializers

from axis_backend.views.base import BaseModelViewSet
from apps.kpis.models import KPIAssignment
from apps.kpis.services import KPIAssignmentService
from apps.kpis.serializers import (
    KPIAssignmentListSerializer,
    KPIAssignmentDetailSerializer,
    KPIAssignmentCreateSerializer,
    KPIAssignmentUpdateSerializer,
)


@extend_schema_view(
    list=extend_schema(summary="List KPI assignments", tags=["KPI Assignments"]),
    retrieve=extend_schema(summary="Get KPI assignment details", tags=["KPI Assignments"]),
    create=extend_schema(summary="Create KPI assignment", tags=["KPI Assignments"]),
    update=extend_schema(summary="Update KPI assignment", tags=["KPI Assignments"]),
    partial_update=extend_schema(summary="Partially update KPI assignment", tags=["KPI Assignments"]),
    destroy=extend_schema(summary="Delete KPI assignment", tags=["KPI Assignments"]),
)
class KPIAssignmentViewSet(BaseModelViewSet):
    """
    ViewSet for KPIAssignment CRUD operations.

    Provides standard CRUD endpoints plus custom actions for:
    - Active assignments
    - Recording measurements
    - Status transitions (activate, complete, pause)
    """

    queryset = KPIAssignment.objects.all()
    permission_classes = [IsAuthenticated]
    service_class = KPIAssignmentService
    list_serializer_class = KPIAssignmentListSerializer
    detail_serializer_class = KPIAssignmentDetailSerializer
    create_serializer_class = KPIAssignmentCreateSerializer
    update_serializer_class = KPIAssignmentUpdateSerializer

    def create(self, request, *args, **kwargs):
        """Create new KPI assignment."""
        serializer = self.create_serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            assignment = self.service.create_assignment(**serializer.validated_data)
            response_serializer = self.detail_serializer_class(assignment)
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
        summary="Get active assignments",
        tags=["KPI Assignments"],
        responses={200: KPIAssignmentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get currently active assignments."""
        assignments = self.service.get_active_assignments()
        serializer = self.list_serializer_class(assignments, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Record measurement",
        tags=["KPI Assignments"],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'value': {'type': 'string'},
                    'period': {'type': 'string', 'nullable': True}
                },
                'required': ['value']
            }
        },
        responses={200: KPIAssignmentDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def record_measurement(self, request, pk=None):
        """Record a KPI measurement."""
        value = request.data.get('value')
        period = request.data.get('period')

        if not value:
            return Response(
                {'error': 'Measurement value is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            assignment = self.service.record_measurement(pk, value, period)
            serializer = self.detail_serializer_class(assignment)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Activate assignment",
        tags=["KPI Assignments"],
        responses={200: KPIAssignmentDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an assignment."""
        try:
            assignment = self.service.activate_assignment(pk)
            serializer = self.detail_serializer_class(assignment)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Complete assignment",
        tags=["KPI Assignments"],
        responses={200: KPIAssignmentDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark assignment as completed."""
        try:
            assignment = self.service.complete_assignment(pk)
            serializer = self.detail_serializer_class(assignment)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Pause assignment",
        tags=["KPI Assignments"],
        responses={200: KPIAssignmentDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause an assignment."""
        try:
            assignment = self.service.pause_assignment(pk)
            serializer = self.detail_serializer_class(assignment)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
