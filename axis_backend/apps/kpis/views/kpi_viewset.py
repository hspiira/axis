"""ViewSet for KPI model."""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view

from axis_backend.views.base import BaseModelViewSet
from apps.kpis.models import KPI
from apps.kpis.services import KPIService
from apps.kpis.serializers import (
    KPIListSerializer,
    KPIDetailSerializer,
    KPICreateSerializer,
    KPIUpdateSerializer,
)


@extend_schema_view(
    list=extend_schema(summary="List KPIs", tags=["KPIs"]),
    retrieve=extend_schema(summary="Get KPI details", tags=["KPIs"]),
    create=extend_schema(summary="Create KPI", tags=["KPIs"]),
    update=extend_schema(summary="Update KPI", tags=["KPIs"]),
    partial_update=extend_schema(summary="Partially update KPI", tags=["KPIs"]),
    destroy=extend_schema(summary="Delete KPI", tags=["KPIs"]),
)
class KPIViewSet(BaseModelViewSet):
    """
    ViewSet for KPI CRUD operations.

    Provides standard CRUD endpoints plus custom actions for:
    - Public KPIs
    - Global KPIs
    - Toggle visibility
    """

    queryset = KPI.objects.all()
    permission_classes = [IsAuthenticated]
    service_class = KPIService
    list_serializer_class = KPIListSerializer
    detail_serializer_class = KPIDetailSerializer
    create_serializer_class = KPICreateSerializer
    update_serializer_class = KPIUpdateSerializer

    def create(self, request, *args, **kwargs):
        """Create new KPI."""
        serializer = self.create_serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            kpi = self.service.create_kpi(**serializer.validated_data)
            response_serializer = self.detail_serializer_class(kpi)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get public KPIs",
        tags=["KPIs"],
        responses={200: KPIListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get all public KPIs."""
        kpis = self.service.get_public_kpis()
        serializer = self.list_serializer_class(kpis, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get global KPIs",
        tags=["KPIs"],
        responses={200: KPIListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def global_kpis(self, request):
        """Get global KPIs (not client/contract specific)."""
        kpis = self.service.get_global_kpis()
        serializer = self.list_serializer_class(kpis, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Toggle KPI visibility",
        tags=["KPIs"],
        responses={200: KPIDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def toggle_visibility(self, request, pk=None):
        """Toggle KPI public/private visibility."""
        kpi = self.service.toggle_visibility(pk)
        serializer = self.detail_serializer_class(kpi)
        return Response(serializer.data)