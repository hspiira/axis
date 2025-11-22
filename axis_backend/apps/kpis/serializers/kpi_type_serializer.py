"""Serializers for KPIType model."""
from rest_framework import serializers
from apps.kpis.models import KPIType
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
)


class KPITypeListSerializer(BaseListSerializer):
    """Lightweight serializer for KPI type lists."""

    class Meta:
        model = KPIType
        fields = ['id', 'name', 'weight', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class KPITypeDetailSerializer(BaseDetailSerializer):
    """Comprehensive serializer for KPI type details."""

    class Meta:
        model = KPIType
        fields = [
            'id', 'name', 'description', 'weight', 'metadata',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']


class KPITypeCreateSerializer(BaseCreateSerializer):
    """Serializer for creating KPI types."""

    name = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    weight = serializers.IntegerField(required=False, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)


class KPITypeUpdateSerializer(BaseUpdateSerializer):
    """Serializer for updating KPI types."""

    name = serializers.CharField(max_length=100, required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    weight = serializers.IntegerField(required=False, allow_null=True)
    metadata = serializers.JSONField(required=False, allow_null=True)
