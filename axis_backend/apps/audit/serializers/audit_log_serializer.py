"""Serializers for AuditLog model."""
from rest_framework import serializers
from apps.audit.models import AuditLog


class AuditLogListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for audit log lists."""

    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'entity_type', 'entity_id',
            'user_email', 'timestamp'
        ]
        read_only_fields = fields


class AuditLogDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for audit log details."""

    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    user_id = serializers.CharField(source='user.id', read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'entity_type', 'entity_id',
            'data', 'ip_address', 'user_agent',
            'user_id', 'user_email', 'timestamp'
        ]
        read_only_fields = fields
