"""ViewSets for Client Tag CRUD operations."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from apps.clients.models import ClientTag
from apps.clients.serializers.tag_serializer import (
    ClientTagSerializer,
    ClientTagListSerializer,
)


class ClientTagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Client Tag CRUD operations.

    Endpoints:
    - GET /api/tags/ - List all tags with client counts
    - POST /api/tags/ - Create new tag
    - GET /api/tags/{id}/ - Retrieve tag details
    - PUT /api/tags/{id}/ - Update tag
    - PATCH /api/tags/{id}/ - Partial update tag
    - DELETE /api/tags/{id}/ - Delete tag (only non-system tags)
    - GET /api/tags/stats/ - Tag usage statistics
    """

    queryset = ClientTag.objects.all()
    serializer_class = ClientTagSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_system']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        """Use list serializer for list action."""
        if self.action == 'list':
            return ClientTagListSerializer
        return ClientTagSerializer

    def get_queryset(self):
        """Annotate queryset with client counts."""
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.annotate(
                client_count=Count('clients')
            )
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of system tags."""
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {'error': 'System tags cannot be deleted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get tag usage statistics."""
        tags = ClientTag.objects.annotate(
            client_count=Count('clients')
        ).order_by('-client_count')

        stats = {
            'total_tags': tags.count(),
            'system_tags': tags.filter(is_system=True).count(),
            'custom_tags': tags.filter(is_system=False).count(),
            'most_used': ClientTagListSerializer(tags[:5], many=True).data,
            'unused_tags': tags.filter(client_count=0).count(),
        }

        return Response(stats)
