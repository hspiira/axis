"""Serializers for FieldChange model."""
from rest_framework import serializers
from apps.audit.models import FieldChange
from axis_backend.serializers.base import BaseListSerializer, BaseDetailSerializer


class FieldChangeListSerializer(BaseListSerializer):
    """Lightweight serializer for field change lists."""

    entity_type = serializers.CharField(source='entity_change.entity_type', read_only=True)
    entity_id = serializers.CharField(source='entity_change.entity_id', read_only=True)

    class Meta:
        model = FieldChange
        fields = [
            'id', 'entity_type', 'entity_id', 'field_name',
            'change_type', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FieldChangeDetailSerializer(BaseDetailSerializer):
    """Comprehensive serializer for field change details."""

    entity_type = serializers.CharField(source='entity_change.entity_type', read_only=True)
    entity_id = serializers.CharField(source='entity_change.entity_id', read_only=True)
    entity_change_id = serializers.CharField(source='entity_change.id', read_only=True)
    has_changed = serializers.BooleanField(read_only=True)

    class Meta:
        model = FieldChange
        fields = [
            'id', 'entity_change_id', 'entity_type', 'entity_id',
            'field_name', 'old_value', 'new_value', 'change_type',
            'has_changed', 'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']
