"""Serializers for ServiceAssignment model."""
from rest_framework import serializers
from apps.services_app.models import ServiceAssignment
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)
from axis_backend.enums import AssignmentStatus, Frequency


class ServiceAssignmentListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """Lightweight serializer for assignment lists."""

    service_name = serializers.CharField(source='service.name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = ServiceAssignment
        fields = [
            'id',
            'service_name',
            'client_name',
            'status',
            'start_date',
            'end_date',
            'frequency',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ServiceAssignmentDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """Comprehensive serializer for assignment details."""

    service = serializers.SerializerMethodField()
    contract = serializers.SerializerMethodField()
    client = serializers.SerializerMethodField()

    class Meta:
        model = ServiceAssignment
        fields = [
            'id',
            'service',
            'contract',
            'client',
            'status',
            'start_date',
            'end_date',
            'frequency',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_service(self, obj):
        if obj.service:
            return {'id': obj.service.id, 'name': obj.service.name}
        return None

    def get_contract(self, obj):
        if obj.contract:
            return {'id': obj.contract.id, 'contract_number': str(obj.contract.id)[:8]}
        return None

    def get_client(self, obj):
        if obj.client:
            return {'id': obj.client.id, 'name': obj.client.name}
        return None


class ServiceAssignmentCreateSerializer(BaseCreateSerializer):
    """Serializer for assignment creation."""

    service_id = serializers.CharField(write_only=True, help_text="Service ID")
    contract_id = serializers.CharField(write_only=True, help_text="Contract ID")
    client_id = serializers.CharField(write_only=True, help_text="Client ID")
    status = serializers.ChoiceField(choices=AssignmentStatus.choices, required=False, default=AssignmentStatus.PENDING, help_text="Assignment status")
    start_date = serializers.DateField(help_text="Service start date")
    end_date = serializers.DateField(required=False, allow_null=True, help_text="Service end date")
    frequency = serializers.ChoiceField(choices=Frequency.choices, help_text="Service frequency")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Assignment metadata")


class ServiceAssignmentUpdateSerializer(BaseUpdateSerializer):
    """Serializer for assignment updates."""

    status = serializers.ChoiceField(choices=AssignmentStatus.choices, required=False, help_text="Status")
    start_date = serializers.DateField(required=False, help_text="Start date")
    end_date = serializers.DateField(required=False, allow_null=True, help_text="End date")
    frequency = serializers.ChoiceField(choices=Frequency.choices, required=False, help_text="Frequency")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Metadata")
