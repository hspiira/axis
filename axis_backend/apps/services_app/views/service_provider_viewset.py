"""ViewSet for ServiceProvider model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.services_app.models import ServiceProvider
from apps.services_app.services import ServiceProviderService
from apps.services_app.serializers import (
    ServiceProviderListSerializer,
    ServiceProviderDetailSerializer,
    ServiceProviderCreateSerializer,
    ServiceProviderUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet


@extend_schema_view(
    list=extend_schema(summary="List service providers", tags=["Service Providers"]),
    retrieve=extend_schema(summary="Get provider details", tags=["Service Providers"]),
    create=extend_schema(summary="Create provider", tags=["Service Providers"]),
    update=extend_schema(summary="Update provider", tags=["Service Providers"]),
    partial_update=extend_schema(summary="Partially update provider", tags=["Service Providers"]),
    destroy=extend_schema(summary="Delete provider", tags=["Service Providers"]),
)
class ServiceProviderViewSet(BaseModelViewSet):
    """ViewSet for ServiceProvider CRUD operations."""

    queryset = ServiceProvider.objects.all()
    permission_classes = [IsAuthenticated]
    service_class = ServiceProviderService
    list_serializer_class = ServiceProviderListSerializer
    detail_serializer_class = ServiceProviderDetailSerializer
    create_serializer_class = ServiceProviderCreateSerializer
    update_serializer_class = ServiceProviderUpdateSerializer

    @extend_schema(
        summary="Get available providers",
        tags=["Service Providers"],
        responses={200: ServiceProviderListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get providers that are active and verified."""
        providers = self.service.get_available_providers()
        serializer = ServiceProviderListSerializer(providers, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Verify provider",
        tags=["Service Providers"],
        responses={200: ServiceProviderDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Mark provider as verified."""
        provider = self.service.verify_provider(pk)
        serializer = ServiceProviderDetailSerializer(provider)
        return Response(serializer.data)

    @extend_schema(
        summary="Update provider rating",
        tags=["Service Providers"],
        responses={200: ServiceProviderDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def update_rating(self, request, pk=None):
        """Update provider rating."""
        new_rating = float(request.data.get('rating', 0))
        provider = self.service.update_provider_rating(pk, new_rating)
        serializer = ServiceProviderDetailSerializer(provider)
        return Response(serializer.data)

    @extend_schema(
        summary="Search providers",
        tags=["Service Providers"],
        responses={200: ServiceProviderListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search providers with filters."""
        name = request.query_params.get('name')
        provider_type = request.query_params.get('type')
        status = request.query_params.get('status')
        is_verified = request.query_params.get('is_verified')
        location = request.query_params.get('location')
        min_rating = request.query_params.get('min_rating')

        if is_verified is not None:
            is_verified = is_verified.lower() in ('true', '1', 'yes')
        if min_rating:
            min_rating = float(min_rating)

        providers = self.service.search_providers(
            name=name,
            provider_type=provider_type,
            status=status,
            is_verified=is_verified,
            location=location,
            min_rating=min_rating
        )
        serializer = ServiceProviderListSerializer(providers, many=True)
        return Response(serializer.data)
