"""ViewSet for Service model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.services_app.models import Service
from apps.services_app.services import ServiceService
from apps.services_app.serializers import (
    ServiceListSerializer,
    ServiceDetailSerializer,
    ServiceCreateSerializer,
    ServiceUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet
from axis_backend.permissions import IsAdminOrManager


@extend_schema_view(
    list=extend_schema(summary="List services", tags=["Services"]),
    retrieve=extend_schema(summary="Get service details", tags=["Services"]),
    create=extend_schema(summary="Create service", tags=["Services"]),
    update=extend_schema(summary="Update service", tags=["Services"]),
    partial_update=extend_schema(summary="Partially update service", tags=["Services"]),
    destroy=extend_schema(summary="Delete service", tags=["Services"]),
)
class ServiceViewSet(BaseModelViewSet):
    """ViewSet for Service CRUD operations."""

    queryset = Service.objects.all()
    permission_classes = [IsAuthenticated]
    service_class = ServiceService
    list_serializer_class = ServiceListSerializer
    detail_serializer_class = ServiceDetailSerializer
    create_serializer_class = ServiceCreateSerializer
    update_serializer_class = ServiceUpdateSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Permissions:
        - list, retrieve: IsAuthenticated (read-only for all)
        - create, update, partial_update, destroy, activate, deactivate: IsAdminOrManager
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'activate', 'deactivate']:
            return [IsAdminOrManager()]
        else:
            return [IsAuthenticated()]

    @extend_schema(
        summary="Get available services",
        tags=["Services"],
        responses={200: ServiceListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available services."""
        services = self.service.get_available_services()
        serializer = ServiceListSerializer(services, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get catalog services",
        tags=["Services"],
        responses={200: ServiceListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def catalog(self, request):
        """Get services available in public catalog."""
        services = self.service.get_catalog_services()
        serializer = ServiceListSerializer(services, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Search services",
        tags=["Services"],
        responses={200: ServiceListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search services with filters."""
        name = request.query_params.get('name')
        category_id = request.query_params.get('category_id')
        provider_id = request.query_params.get('provider_id')
        status = request.query_params.get('status')
        is_public = request.query_params.get('is_public')
        is_group = request.query_params.get('is_group')
        has_price = request.query_params.get('has_price')

        if is_public is not None:
            is_public = is_public.lower() in ('true', '1', 'yes')
        if is_group is not None:
            is_group = is_group.lower() in ('true', '1', 'yes')
        if has_price is not None:
            has_price = has_price.lower() in ('true', '1', 'yes')

        services = self.service.search_services(
            name=name,
            category_id=category_id,
            provider_id=provider_id,
            status=status,
            is_public=is_public,
            is_group=is_group,
            has_price=has_price
        )
        serializer = ServiceListSerializer(services, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Activate service",
        tags=["Services"],
        responses={200: ServiceDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a service."""
        service = self.service.activate_service(pk)
        serializer = ServiceDetailSerializer(service)
        return Response(serializer.data)

    @extend_schema(
        summary="Deactivate service",
        tags=["Services"],
        responses={200: ServiceDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a service."""
        service = self.service.deactivate_service(pk)
        serializer = ServiceDetailSerializer(service)
        return Response(serializer.data)
