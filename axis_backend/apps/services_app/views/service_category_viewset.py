"""ViewSet for ServiceCategory model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.services_app.models import ServiceCategory
from apps.services_app.services import ServiceCategoryService
from apps.services_app.serializers import (
    ServiceCategoryListSerializer,
    ServiceCategoryDetailSerializer,
    ServiceCategoryCreateSerializer,
    ServiceCategoryUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet
from axis_backend.permissions import IsAdminOrManager


@extend_schema_view(
    list=extend_schema(summary="List service categories", tags=["Service Categories"]),
    retrieve=extend_schema(summary="Get category details", tags=["Service Categories"]),
    create=extend_schema(summary="Create category", tags=["Service Categories"]),
    update=extend_schema(summary="Update category", tags=["Service Categories"]),
    partial_update=extend_schema(summary="Partially update category", tags=["Service Categories"]),
    destroy=extend_schema(summary="Delete category", tags=["Service Categories"]),
)
class ServiceCategoryViewSet(BaseModelViewSet):
    """ViewSet for ServiceCategory CRUD operations."""

    queryset = ServiceCategory.objects.all()
    permission_classes = [IsAuthenticated]
    service_class = ServiceCategoryService
    list_serializer_class = ServiceCategoryListSerializer
    detail_serializer_class = ServiceCategoryDetailSerializer
    create_serializer_class = ServiceCategoryCreateSerializer
    update_serializer_class = ServiceCategoryUpdateSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Permissions:
        - list, retrieve: IsAuthenticated (read-only for all)
        - create, update, partial_update, destroy: IsAdminOrManager
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        else:
            return [IsAuthenticated()]

    @extend_schema(
        summary="Get categories with services",
        tags=["Service Categories"],
        responses={200: ServiceCategoryListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def with_services(self, request):
        """Get categories that have active services."""
        categories = self.service.repository.get_categories_with_services()
        serializer = ServiceCategoryListSerializer(categories, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Search categories",
        tags=["Service Categories"],
        responses={200: ServiceCategoryListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search categories with filters."""
        name = request.query_params.get('name')
        has_services = request.query_params.get('has_services')

        if has_services is not None:
            has_services = has_services.lower() in ('true', '1', 'yes')

        categories = self.service.search_categories(
            name=name,
            has_services=has_services
        )
        serializer = ServiceCategoryListSerializer(categories, many=True)
        return Response(serializer.data)
