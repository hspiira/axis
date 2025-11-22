"""ViewSet for EntityChange model."""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from axis_backend.utils.query_params import parse_positive_int
from apps.audit.models import EntityChange
from apps.audit.services import EntityChangeService
from apps.audit.serializers import (
    EntityChangeListSerializer,
    EntityChangeDetailSerializer,
)


@extend_schema_view(
    list=extend_schema(summary="List entity changes", tags=["Audit"]),
    retrieve=extend_schema(summary="Get entity change details", tags=["Audit"]),
)
class EntityChangeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for EntityChange read-only operations.

    Provides change history tracking and querying.
    """

    queryset = EntityChange.objects.all()
    permission_classes = [IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = EntityChangeService()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list' or self.action in ['recent', 'by_user']:
            return EntityChangeListSerializer
        return EntityChangeDetailSerializer

    @extend_schema(
        summary="Get entity change history",
        tags=["Audit"],
        responses={200: EntityChangeDetailSerializer(many=True)}
    )
    @action(
        detail=False,
        methods=['get'],
        url_path='entity/(?P<entity_type>[^/.]+)/(?P<entity_id>[^/.]+)'
    )
    def entity_history(self, request, entity_type=None, entity_id=None):
        """Get complete change history for an entity."""
        changes = self.service.get_entity_history(entity_type, entity_id)
        serializer = EntityChangeDetailSerializer(changes, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get recent entity changes",
        tags=["Audit"],
        responses={200: EntityChangeListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent entity changes."""
        days, error_response = parse_positive_int(
            request.query_params.get('days'),
            'days',
            default=7,
            min_value=1
        )
        if error_response:
            return error_response

        changes = self.service.get_recent_changes(days)
        serializer = EntityChangeListSerializer(changes, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get changes by user",
        tags=["Audit"],
        responses={200: EntityChangeListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def by_user(self, request, user_id=None):
        """Get all changes made by a user."""
        changes = self.service.get_by_user(user_id)
        serializer = EntityChangeListSerializer(changes, many=True)
        return Response(serializer.data)
