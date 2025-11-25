"""ViewSet for Contract model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.contracts.models import Contract
from apps.contracts.services import ContractService
from apps.contracts.serializers import (
    ContractListSerializer,
    ContractDetailSerializer,
    ContractCreateSerializer,
    ContractUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet
from axis_backend.permissions import (
    IsAdminOrManager,
    IsClientScopedOrAdmin,
    CanModifyObject
)


@extend_schema_view(
    list=extend_schema(summary="List contracts", tags=["Contracts"]),
    retrieve=extend_schema(summary="Get contract details", tags=["Contracts"]),
    create=extend_schema(summary="Create contract", tags=["Contracts"]),
    update=extend_schema(summary="Update contract", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update contract", tags=["Contracts"]),
    destroy=extend_schema(summary="Delete contract", tags=["Contracts"]),
)
class ContractViewSet(BaseModelViewSet):
    """
    ViewSet for Contract CRUD operations.

    Provides contract management with lifecycle and payment tracking.

    Security:
    - Object-level permissions enforce client-scoped access
    - Users can only access contracts for authorized clients
    - Admins/Managers have full access
    """

    queryset = Contract.objects.all()
    permission_classes = [IsAuthenticated, IsClientScopedOrAdmin]
    service_class = ContractService
    list_serializer_class = ContractListSerializer
    detail_serializer_class = ContractDetailSerializer
    create_serializer_class = ContractCreateSerializer
    update_serializer_class = ContractUpdateSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Permissions:
        - list, retrieve: IsAuthenticated + IsClientScopedOrAdmin
        - create, update, partial_update, destroy: + CanModifyObject
        - custom actions: IsAuthenticated + IsClientScopedOrAdmin
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Modifications require ownership or manage permissions
            return [IsAuthenticated(), IsClientScopedOrAdmin(), CanModifyObject()]
        else:
            # list, retrieve, custom actions use client-scoped permissions
            return [IsAuthenticated(), IsClientScopedOrAdmin()]

    @extend_schema(
        summary="Get active contracts",
        tags=["Contracts"],
        responses={200: ContractListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active contracts."""
        contracts = self.service.get_active_contracts()
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get contracts by client",
        tags=["Contracts"],
        responses={200: ContractListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='client/(?P<client_id>[^/.]+)')
    def by_client(self, request, client_id=None):
        """Get all contracts for a client."""
        contracts = self.service.get_client_contracts(client_id)
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get contracts expiring soon",
        tags=["Contracts"],
        responses={200: ContractListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get contracts expiring within specified days."""
        days = int(request.query_params.get('days', 30))
        contracts = self.service.get_expiring_soon(days)
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get contracts pending renewal",
        tags=["Contracts"],
        responses={200: ContractListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def pending_renewal(self, request):
        """Get contracts pending renewal."""
        contracts = self.service.get_pending_renewal()
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get contracts with overdue payments",
        tags=["Contracts"],
        responses={200: ContractListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def overdue_payments(self, request):
        """Get contracts with overdue payments."""
        contracts = self.service.get_overdue_payments()
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get contracts with billing due soon",
        tags=["Contracts"],
        responses={200: ContractListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def billing_due(self, request):
        """Get contracts with billing due soon."""
        days = int(request.query_params.get('days', 7))
        contracts = self.service.get_next_billing_due(days)
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Search contracts",
        tags=["Contracts"],
        responses={200: ContractListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search contracts with filters."""
        client_id = request.query_params.get('client_id')
        status = request.query_params.get('status')
        payment_status = request.query_params.get('payment_status')
        is_renewable = request.query_params.get('is_renewable')
        is_auto_renew = request.query_params.get('is_auto_renew')

        # Convert boolean strings if provided
        if is_renewable is not None:
            is_renewable = is_renewable.lower() in ('true', '1', 'yes')
        if is_auto_renew is not None:
            is_auto_renew = is_auto_renew.lower() in ('true', '1', 'yes')

        contracts = self.service.search_contracts(
            client_id=client_id,
            status=status,
            payment_status=payment_status,
            is_renewable=is_renewable,
            is_auto_renew=is_auto_renew
        )
        serializer = ContractListSerializer(contracts, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Activate contract",
        tags=["Contracts"],
        responses={200: ContractDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a contract."""
        contract = self.service.activate_contract(pk)
        serializer = ContractDetailSerializer(contract)
        return Response(serializer.data)

    @extend_schema(
        summary="Terminate contract",
        tags=["Contracts"],
        responses={200: ContractDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        """Terminate a contract."""
        reason = request.data.get('reason')
        contract = self.service.terminate_contract(pk, reason)
        serializer = ContractDetailSerializer(contract)
        return Response(serializer.data)

    @extend_schema(
        summary="Renew contract",
        tags=["Contracts"],
        responses={200: ContractDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Renew a contract."""
        new_end_date = request.data.get('new_end_date')
        new_billing_rate = request.data.get('new_billing_rate')
        contract = self.service.renew_contract(pk, new_end_date, new_billing_rate)
        serializer = ContractDetailSerializer(contract)
        return Response(serializer.data)

    @extend_schema(
        summary="Mark contract as expired",
        tags=["Contracts"],
        responses={200: ContractDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_expired(self, request, pk=None):
        """Mark contract as expired."""
        contract = self.service.mark_expired(pk)
        serializer = ContractDetailSerializer(contract)
        return Response(serializer.data)

    @extend_schema(
        summary="Mark payment as paid",
        tags=["Contracts"],
        responses={200: ContractDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark contract payment as paid."""
        contract = self.service.mark_paid(pk)
        serializer = ContractDetailSerializer(contract)
        return Response(serializer.data)

    @extend_schema(
        summary="Mark payment as overdue",
        tags=["Contracts"],
        responses={200: ContractDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_overdue(self, request, pk=None):
        """Mark contract payment as overdue."""
        contract = self.service.mark_overdue(pk)
        serializer = ContractDetailSerializer(contract)
        return Response(serializer.data)
