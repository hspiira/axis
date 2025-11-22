"""Serializers for EntityChange model."""
from rest_framework import serializers
from apps.audit.models import EntityChange
from axis_backend.serializers.base import BaseListSerializer, BaseDetailSerializer


class EntityChangeListSerializer(BaseListSerializer):
    """Lightweight serializer for entity change lists."""

    class Meta:
        model = EntityChange
        fields = [
            'id', 'entity_type', 'entity_id', 'change_type',
            'changed_at', 'changed_by', 'is_active'
        ]
        read_only_fields = ['id', 'changed_at']


class EntityChangeDetailSerializer(BaseDetailSerializer):
    """Comprehensive serializer for entity change details."""

    field_changes_count = serializers.SerializerMethodField()

    class Meta:
        model = EntityChange
        fields = [
            'id', 'entity_type', 'entity_id', 'change_type',
            'changed_at', 'changed_by', 'change_reason',
            'old_data', 'new_data', 'metadata', 'is_active',
            'field_changes_count', 'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'changed_at', 'created_at', 'updated_at', 'deleted_at']

    def get_field_changes_count(self, obj) -> int:
        """Get count of field-level changes."""
        return obj.field_changes.filter(deleted_at__isnull=True).count()
