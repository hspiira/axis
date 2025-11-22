"""Serializers for KPIAssignment model."""
from rest_framework import serializers
from apps.kpis.models import KPIAssignment
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
)
from axis_backend.enums import AssignmentStatus, Frequency


class KPIAssignmentListSerializer(BaseListSerializer):
    """Lightweight serializer for KPI assignment lists."""

    kpi_name = serializers.CharField(source='kpi.name', read_only=True)
    contract_name = serializers.CharField(source='contract.name', read_only=True, allow_null=True)
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = KPIAssignment
        fields = [
            'id', 'kpi_name', 'contract_name', 'client_name',
            'status', 'frequency', 'start_date', 'end_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class KPIAssignmentDetailSerializer(BaseDetailSerializer):
    """Comprehensive serializer for KPI assignment details."""

    kpi_name = serializers.CharField(source='kpi.name', read_only=True)
    kpi_id = serializers.CharField(source='kpi.id', read_only=True)
    contract_id = serializers.CharField(source='contract.id', read_only=True)
    client_id = serializers.CharField(source='client.id', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    effective_target = serializers.CharField(read_only=True)

    class Meta:
        model = KPIAssignment
        fields = [
            'id', 'kpi_id', 'kpi_name', 'contract_id', 'client_id', 'client_name',
            'target_value', 'effective_target', 'frequency', 'status',
            'start_date', 'end_date', 'notes', 'metadata',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']


class KPIAssignmentCreateSerializer(BaseCreateSerializer):
    """Serializer for creating KPI assignments."""

    kpi_id = serializers.CharField(write_only=True)
    contract_id = serializers.CharField(write_only=True)
    client_id = serializers.CharField(write_only=True)
    frequency = serializers.ChoiceField(choices=Frequency.choices)
    status = serializers.ChoiceField(choices=AssignmentStatus.choices)
    start_date = serializers.DateField()
    target_value = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)


class KPIAssignmentUpdateSerializer(BaseUpdateSerializer):
    """Serializer for updating KPI assignments."""

    target_value = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    frequency = serializers.ChoiceField(choices=Frequency.choices, required=False)
    status = serializers.ChoiceField(choices=AssignmentStatus.choices, required=False)
    end_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)
