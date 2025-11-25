"""ViewSets for Client Contact CRUD operations."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from apps.clients.models import ClientContact, Client
from apps.clients.serializers.contact_serializer import (
    ClientContactSerializer,
    ClientContactListSerializer,
    ClientContactCreateSerializer,
)


class ClientContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Client Contact CRUD operations.

    Nested under clients:
    - GET /api/clients/{client_id}/contacts/ - List all contacts for a client
    - POST /api/clients/{client_id}/contacts/ - Create new contact
    - GET /api/clients/{client_id}/contacts/{id}/ - Retrieve contact details
    - PUT /api/clients/{client_id}/contacts/{id}/ - Update contact
    - PATCH /api/clients/{client_id}/contacts/{id}/ - Partial update
    - DELETE /api/clients/{client_id}/contacts/{id}/ - Delete contact
    - POST /api/clients/{client_id}/contacts/{id}/set_primary/ - Set as primary
    """

    queryset = ClientContact.objects.all()
    serializer_class = ClientContactSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_primary', 'is_active', 'role']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'title', 'department']
    ordering_fields = ['first_name', 'last_name', 'created_at', 'is_primary']
    ordering = ['-is_primary', 'first_name']

    def get_queryset(self):
        """Filter contacts by client if client_id provided in URL."""
        queryset = super().get_queryset()
        client_id = self.kwargs.get('client_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return queryset

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == 'create':
            return ClientContactCreateSerializer
        if self.action == 'list':
            return ClientContactListSerializer
        return ClientContactSerializer

    def get_serializer_context(self):
        """Add client_id to serializer context."""
        context = super().get_serializer_context()
        client_id = self.kwargs.get('client_id')
        if client_id:
            context['client_id'] = client_id
        return context

    def perform_create(self, serializer):
        """Set client from URL when creating contact."""
        client_id = self.kwargs.get('client_id')
        if client_id:
            try:
                client = Client.objects.get(id=client_id)
                serializer.save(client=client)
            except Client.DoesNotExist:
                raise ValidationError({'client': 'Client not found'})
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def set_primary(self, request, client_id=None, pk=None):
        """Set this contact as the primary contact for the client."""
        contact = self.get_object()

        # Unset other primary contacts
        ClientContact.objects.filter(
            client=contact.client,
            is_primary=True
        ).exclude(id=contact.id).update(is_primary=False)

        # Set this contact as primary
        contact.is_primary = True
        contact.save()

        serializer = self.get_serializer(contact)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def primary(self, request, client_id=None):
        """Get the primary contact for the client."""
        try:
            contact = self.get_queryset().get(is_primary=True)
            serializer = self.get_serializer(contact)
            return Response(serializer.data)
        except ClientContact.DoesNotExist:
            return Response(
                {'detail': 'No primary contact found for this client'},
                status=status.HTTP_404_NOT_FOUND
            )
