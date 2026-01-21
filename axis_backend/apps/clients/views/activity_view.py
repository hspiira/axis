"""ViewSets for Client Activity CRUD operations."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from apps.clients.models import ClientActivity, Client
from apps.clients.serializers.activity_serializer import (
    ClientActivitySerializer,
    ClientActivityListSerializer,
    ClientActivityCreateSerializer,
)


class ClientActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Client Activity CRUD operations.

    Nested under clients:
    - GET /api/clients/{client_id}/activities/ - List all activities for a client
    - POST /api/clients/{client_id}/activities/ - Create new activity
    - GET /api/clients/{client_id}/activities/{id}/ - Retrieve activity details
    - PUT /api/clients/{client_id}/activities/{id}/ - Update activity
    - PATCH /api/clients/{client_id}/activities/{id}/ - Partial update
    - DELETE /api/clients/{client_id}/activities/{id}/ - Delete activity
    - GET /api/clients/{client_id}/activities/timeline/ - Activity timeline view
    - GET /api/clients/{client_id}/activities/stats/ - Activity statistics
    """

    queryset = ClientActivity.objects.all()
    serializer_class = ClientActivitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activity_type', 'contact']
    search_fields = ['title', 'description']
    ordering_fields = ['activity_date', 'created_at']
    ordering = ['-activity_date']

    def get_queryset(self):
        """Filter activities by client if client_id provided in URL."""
        queryset = super().get_queryset()
        client_id = self.kwargs.get('client_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return queryset.select_related('client', 'contact')

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == 'create':
            return ClientActivityCreateSerializer
        if self.action == 'list':
            return ClientActivityListSerializer
        return ClientActivitySerializer

    def get_serializer_context(self):
        """Add client_id to serializer context."""
        context = super().get_serializer_context()
        client_id = self.kwargs.get('client_id')
        if client_id:
            context['client_id'] = client_id
        return context

    def perform_create(self, serializer):
        """Set client from URL and update last_contact_date when creating activity."""
        client_id = self.kwargs.get('client_id')
        if client_id:
            try:
                client = Client.objects.get(id=client_id)
                activity = serializer.save(client=client)

                # Update client's last_contact_date
                if not client.last_contact_date or activity.activity_date > client.last_contact_date:
                    client.last_contact_date = activity.activity_date
                    client.save(update_fields=['last_contact_date'])
            except Client.DoesNotExist:
                raise ValidationError({'client': 'Client not found'})
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def timeline(self, request, client_id=None):
        """
        Get activities in timeline format, grouped by date.
        Returns activities grouped by day for easy timeline display.
        """
        activities = self.get_queryset()

        # Apply filters if provided
        activity_type = request.query_params.get('activity_type')
        if activity_type:
            activities = activities.filter(activity_type=activity_type)

        # Get date range (default: last 90 days)
        days = int(request.query_params.get('days', 90))
        start_date = timezone.now() - timedelta(days=days)
        activities = activities.filter(activity_date__gte=start_date)

        serializer = ClientActivityListSerializer(activities, many=True)
        return Response({
            'count': activities.count(),
            'date_range': {
                'start': start_date.isoformat(),
                'end': timezone.now().isoformat(),
            },
            'activities': serializer.data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request, client_id=None):
        """Get activity statistics for the client."""
        activities = self.get_queryset()

        # Get date range (default: last 90 days)
        days = int(request.query_params.get('days', 90))
        start_date = timezone.now() - timedelta(days=days)
        recent_activities = activities.filter(activity_date__gte=start_date)

        # Activity type breakdown
        type_breakdown = recent_activities.values('activity_type').annotate(
            count=Count('id')
        ).order_by('-count')

        # Contact engagement
        contact_breakdown = recent_activities.values(
            'contact__first_name', 'contact__last_name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        stats = {
            'total_activities': activities.count(),
            'recent_activities': recent_activities.count(),
            'date_range': {
                'start': start_date.isoformat(),
                'end': timezone.now().isoformat(),
            },
            'by_type': list(type_breakdown),
            'top_contacts': list(contact_breakdown),
            'last_activity': activities.first().activity_date.isoformat() if activities.exists() else None,
        }

        return Response(stats)
