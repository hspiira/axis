"""ViewSet for FieldChange model."""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from axis_backend.permissions import IsAdminOrManager
from apps.audit.models import FieldChange
from apps.audit.services import FieldChangeService
from apps.audit.serializers import (
    FieldChangeListSerializer,
    FieldChangeDetailSerializer,
)


@extend_schema_view(
    list=extend_schema(summary="List field changes", tags=["Audit"]),
    retrieve=extend_schema(summary="Get field change details", tags=["Audit"]),
)
class FieldChangeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for FieldChange read-only operations.

    Provides field-level change history tracking.
    """

    queryset = FieldChange.objects.all()
    permission_classes = [IsAdminOrManager]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = FieldChangeService()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list' or self.action == 'by_entity_change':
            return FieldChangeListSerializer
        return FieldChangeDetailSerializer

    @extend_schema(
        summary="Get field changes by entity change",
        tags=["Audit"],
        responses={200: FieldChangeListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='entity-change/(?P<entity_change_id>[^/.]+)')
    def by_entity_change(self, request, entity_change_id=None):
        """Get all field changes for an entity change."""
        changes = self.service.get_by_entity_change(entity_change_id)
        serializer = FieldChangeListSerializer(changes, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get field history",
        tags=["Audit"],
        responses={200: FieldChangeDetailSerializer(many=True)}
    )
    @action(
        detail=False,
        methods=['get'],
        url_path='field-history/(?P<entity_type>[^/.]+)/(?P<entity_id>[^/.]+)/(?P<field_name>[^/.]+)'
    )
    def field_history(self, request, entity_type=None, entity_id=None, field_name=None):
        """Get complete history for a specific field."""
        changes = self.service.get_field_history(entity_type, entity_id, field_name)
        serializer = FieldChangeDetailSerializer(changes, many=True)
        return Response(serializer.data)
