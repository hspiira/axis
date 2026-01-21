"""ViewSet for Client model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.clients.models import Client
from apps.clients.services import ClientService
from apps.clients.serializers import (
    ClientListSerializer,
    ClientDetailSerializer,
    ClientCreateSerializer,
    ClientUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet
from axis_backend.permissions import (
    IsAdminOrManager,
    IsClientScopedOrAdmin,
    CanModifyObject
)


@extend_schema_view(
    list=extend_schema(summary="List clients", tags=["Clients"]),
    retrieve=extend_schema(summary="Get client details", tags=["Clients"]),
    create=extend_schema(summary="Create client", tags=["Clients"]),
    update=extend_schema(summary="Update client", tags=["Clients"]),
    partial_update=extend_schema(summary="Partially update client", tags=["Clients"]),
    destroy=extend_schema(summary="Delete client", tags=["Clients"]),
)
class ClientViewSet(BaseModelViewSet):
    """
    ViewSet for Client CRUD operations.

    Provides client management with status transitions and verification.

    Security:
    - Object-level permissions enforce client-scoped access
    - Admins/Managers can manage all clients
    - Regular users limited to authorized clients only
    """

    queryset = Client.objects.all()
    permission_classes = [IsAuthenticated, IsClientScopedOrAdmin]
    service_class = ClientService
    list_serializer_class = ClientListSerializer
    detail_serializer_class = ClientDetailSerializer
    create_serializer_class = ClientCreateSerializer
    update_serializer_class = ClientUpdateSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Permissions:
        - list, retrieve: IsAuthenticated + IsClientScopedOrAdmin
        - create: IsAdminOrManager (only admins can create clients)
        - update, partial_update, destroy: IsAdminOrManager (only admins can modify)
        - custom actions: IsAuthenticated + IsClientScopedOrAdmin
        """
        if self.action == 'create':
            # Only admins/managers can create new clients
            return [IsAdminOrManager()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only admins/managers can modify/delete clients
            return [IsAdminOrManager()]
        else:
            # list, retrieve, custom actions use client-scoped permissions
            return [IsAuthenticated(), IsClientScopedOrAdmin()]

    @extend_schema(
        summary="Get active clients",
        tags=["Clients"],
        responses={200: ClientListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active clients."""
        clients = self.service.get_active_clients()
        serializer = ClientListSerializer(clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get verified clients",
        tags=["Clients"],
        responses={200: ClientListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def verified(self, request):
        """Get all verified clients."""
        clients = self.service.get_verified_clients()
        serializer = ClientListSerializer(clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get clients needing verification",
        tags=["Clients"],
        responses={200: ClientListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def needs_verification(self, request):
        """Get active clients that need verification."""
        clients = self.service.get_clients_needing_verification()
        serializer = ClientListSerializer(clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get recent clients",
        tags=["Clients"],
        responses={200: ClientListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently created clients."""
        days = int(request.query_params.get('days', 30))
        clients = self.service.get_recent_clients(days)
        serializer = ClientListSerializer(clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get clients by industry",
        tags=["Clients"],
        responses={200: ClientListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='industry/(?P<industry_id>[^/.]+)')
    def by_industry(self, request, industry_id=None):
        """Get clients in specific industry."""
        clients = self.service.get_clients_by_industry(industry_id)
        serializer = ClientListSerializer(clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Search clients",
        tags=["Clients"],
        responses={200: ClientListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search clients with filters."""
        name = request.query_params.get('name')
        email = request.query_params.get('email')
        status = request.query_params.get('status')
        industry_id = request.query_params.get('industry_id')
        is_verified = request.query_params.get('is_verified')
        contact_method = request.query_params.get('contact_method')

        # Convert is_verified to boolean if provided
        if is_verified is not None:
            is_verified = is_verified.lower() in ('true', '1', 'yes')

        clients = self.service.search_clients(
            name=name,
            email=email,
            status=status,
            industry_id=industry_id,
            is_verified=is_verified,
            contact_method=contact_method
        )
        serializer = ClientListSerializer(clients, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Activate client",
        tags=["Clients"],
        responses={200: ClientDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a client."""
        client = self.service.activate_client(pk)
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)

    @extend_schema(
        summary="Deactivate client",
        tags=["Clients"],
        responses={200: ClientDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a client."""
        reason = request.data.get('reason')
        client = self.service.deactivate_client(pk, reason)
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)

    @extend_schema(
        summary="Archive client",
        tags=["Clients"],
        responses={200: ClientDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a client."""
        reason = request.data.get('reason')
        client = self.service.archive_client(pk, reason)
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)

    @extend_schema(
        summary="Verify client",
        tags=["Clients"],
        responses={200: ClientDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a client."""
        verified_by = request.data.get('verified_by')
        client = self.service.verify_client(pk, verified_by)
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)
