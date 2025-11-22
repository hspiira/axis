"""Serializers for KPI model."""
from rest_framework import serializers
from apps.kpis.models import KPI
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
)
from axis_backend.enums import Unit, Frequency


class KPIListSerializer(BaseListSerializer):
    """Lightweight serializer for KPI lists."""

    type_name = serializers.CharField(source='type.name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)

    class Meta:
        model = KPI
        fields = (
            'id', 'name', 'type_name', 'unit', 'unit_type',
            'frequency', 'is_public', 'client_name', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class KPIDetailSerializer(BaseDetailSerializer):
    """Comprehensive serializer for KPI details."""

    type_name = serializers.CharField(source='type.name', read_only=True)
    type_id = serializers.CharField(source='type.id', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    client_id = serializers.CharField(source='client.id', read_only=True, allow_null=True)
    contract_id = serializers.CharField(source='contract.id', read_only=True, allow_null=True)

    class Meta:
        model = KPI
        fields = (
            'id', 'name', 'description', 'type_id', 'type_name',
            'unit', 'unit_type', 'target_value', 'calculation_method',
            'frequency', 'is_public', 'client_id', 'client_name',
            'contract_id', 'metadata', 'created_at', 'updated_at', 'deleted_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'deleted_at')


class KPICreateSerializer(BaseCreateSerializer):
    """Serializer for creating KPIs."""

    name = serializers.CharField(max_length=255)
    type_id = serializers.CharField(write_only=True)
    unit = serializers.CharField(max_length=50)
    unit_type = serializers.ChoiceField(choices=Unit.choices)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    target_value = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    calculation_method = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    frequency = serializers.ChoiceField(choices=Frequency.choices, required=False, allow_null=True)
    is_public = serializers.BooleanField(required=False, default=True)
    client_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    contract_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)


class KPIUpdateSerializer(BaseUpdateSerializer):
    """Serializer for updating KPIs."""

    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    target_value = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    calculation_method = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    frequency = serializers.ChoiceField(choices=Frequency.choices, required=False, allow_null=True)
    is_public = serializers.BooleanField(required=False)
    metadata = serializers.JSONField(required=False, allow_null=True)
