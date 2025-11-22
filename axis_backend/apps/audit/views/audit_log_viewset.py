"""ViewSet for AuditLog model."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from axis_backend.utils.query_params import parse_positive_int
from apps.audit.models import AuditLog
from apps.audit.services import AuditLogService
from apps.audit.serializers import (
    AuditLogListSerializer,
    AuditLogDetailSerializer,
)


@extend_schema_view(
    list=extend_schema(summary="List audit logs", tags=["Audit"]),
    retrieve=extend_schema(summary="Get audit log details", tags=["Audit"]),
)
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for AuditLog read-only operations.

    Audit logs are immutable - they can only be created and read.
    Provides list and detail views plus custom search actions.
    """

    queryset = AuditLog.objects.all()
    permission_classes = [IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = AuditLogService()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list' or self.action in ['user_activity', 'recent']:
            return AuditLogListSerializer
        return AuditLogDetailSerializer

    @extend_schema(
        summary="Get user activity logs",
        tags=["Audit"],
        responses={200: AuditLogListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_activity(self, request, user_id=None):
        """Get all activity logs for a specific user."""
        logs = self.service.get_user_activity(user_id)
        serializer = AuditLogListSerializer(logs, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get recent audit logs",
        tags=["Audit"],
        responses={200: AuditLogListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent audit logs (last 7 days)."""
        days, error_response = parse_positive_int(
            request.query_params.get('days'),
            'days',
            default=7,
            min_value=1
        )
        if error_response:
            return error_response

        logs = self.service.get_recent_activity(days)
        serializer = AuditLogListSerializer(logs, many=True)
        return Response(serializer.data)
