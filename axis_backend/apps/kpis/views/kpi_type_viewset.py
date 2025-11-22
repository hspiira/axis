"""ViewSet for KPIType model."""
from typing import Any
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view

from axis_backend.views.base import BaseModelViewSet
from apps.kpis.models import KPIType
from apps.kpis.services import KPITypeService
from apps.kpis.serializers import (
    KPITypeListSerializer,
    KPITypeDetailSerializer,
    KPITypeCreateSerializer,
    KPITypeUpdateSerializer,
)


@extend_schema_view(
    list=extend_schema(summary="List KPI types", tags=["KPI Types"]),
    retrieve=extend_schema(summary="Get KPI type details", tags=["KPI Types"]),
    create=extend_schema(summary="Create KPI type", tags=["KPI Types"]),
    update=extend_schema(summary="Update KPI type", tags=["KPI Types"]),
    partial_update=extend_schema(summary="Partially update KPI type", tags=["KPI Types"]),
    destroy=extend_schema(summary="Delete KPI type", tags=["KPI Types"]),
)
class KPITypeViewSet(BaseModelViewSet):
    """
    ViewSet for KPIType CRUD operations.

    Provides standard CRUD endpoints for KPI types.
    """

    queryset = KPIType.objects.all()
    permission_classes = [IsAuthenticated]
    service_class = KPITypeService
    list_serializer_class = KPITypeListSerializer
    detail_serializer_class = KPITypeDetailSerializer
    create_serializer_class = KPITypeCreateSerializer
    update_serializer_class = KPITypeUpdateSerializer

    def create(self, request, *args: Any, **kwargs: Any):
        """Create new KPI type."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            kpi_type = self.service.create_kpi_type(**serializer.validated_data)
            response_serializer = self.detail_serializer_class(kpi_type)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:  # noqa: BLE001
            # Delegate unexpected errors to standard handler (logs, proper status, etc.).
            return self.handle_exception(e)