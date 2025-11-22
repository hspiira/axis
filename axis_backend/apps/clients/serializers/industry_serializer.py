"""Serializers for Industry model."""
from rest_framework import serializers
from apps.clients.models import Industry
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)


class IndustryListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """
    Lightweight serializer for industry lists.

    Single Responsibility: List view data only
    Interface Segregation: Minimal fields for performance
    Extends: BaseListSerializer for common list patterns
    """

    parent_name = serializers.CharField(
        source='parent.name',
        read_only=True,
        allow_null=True
    )
    client_count = serializers.SerializerMethodField()

    class Meta:
        model = Industry
        fields = [
            'id',
            'name',
            'code',
            'parent_name',
            'client_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_client_count(self, obj):
        """Get number of clients in this industry."""
        return obj.clients.count()


class IndustryDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """
    Comprehensive serializer for industry details.

    Single Responsibility: Detailed view data
    Extends: BaseDetailSerializer for common detail patterns
    Includes: All relationships and computed properties
    """

    parent = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    full_path = serializers.CharField(read_only=True)
    depth = serializers.IntegerField(read_only=True)
    has_children = serializers.BooleanField(read_only=True)
    client_count = serializers.SerializerMethodField()

    class Meta:
        model = Industry
        fields = [
            'id',
            'name',
            'code',
            'description',
            'parent',
            'external_id',
            'metadata',
            'full_path',
            'depth',
            'has_children',
            'children',
            'client_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'full_path',
            'depth',
            'has_children',
            'created_at',
            'updated_at',
        ]

    def get_parent(self, obj):
        """Get parent industry summary."""
        if obj.parent:
            return {
                'id': obj.parent.id,
                'name': obj.parent.name,
                'code': obj.parent.code,
            }
        return None

    def get_children(self, obj):
        """Get child industries summary."""
        return [
            {
                'id': child.id,
                'name': child.name,
                'code': child.code,
            }
            for child in obj.children.all()
        ]

    def get_client_count(self, obj):
        """Get number of clients in this industry."""
        return obj.clients.count()


class IndustryCreateSerializer(BaseCreateSerializer):
    """
    Serializer for industry creation.

    Single Responsibility: Industry creation validation
    Extends: BaseCreateSerializer for common creation patterns
    Validates: All required fields for industry
    """

    name = serializers.CharField(
        max_length=255,
        help_text="Industry name"
    )
    code = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Standard classification code (NAICS, ISIC, etc.)"
    )
    description = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Industry description and scope"
    )
    parent_id = serializers.CharField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Parent industry ID for hierarchy"
    )
    external_id = serializers.CharField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Reference ID from external classification system"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Additional attributes (e.g., tags, categories)"
    )

    def validate_name(self, value):
        """
        Validate industry name.

        Args:
            value: Industry name

        Returns:
            Validated and stripped name

        Raises:
            serializers.ValidationError: If name is empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Industry name cannot be empty")
        return value.strip()


class IndustryUpdateSerializer(BaseUpdateSerializer):
    """
    Serializer for industry updates.

    Single Responsibility: Update validation
    Extends: BaseUpdateSerializer for common update patterns
    Cannot change: Core relationships without validation
    """

    name = serializers.CharField(
        max_length=255,
        required=False,
        help_text="Industry name"
    )
    code = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Standard classification code"
    )
    description = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Industry description"
    )
    parent_id = serializers.CharField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Parent industry ID"
    )
    external_id = serializers.CharField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="External system reference"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Additional attributes"
    )

    def validate_name(self, value):
        """
        Validate industry name.

        Args:
            value: Industry name

        Returns:
            Validated and stripped name

        Raises:
            serializers.ValidationError: If name is empty
        """
        if value is not None and (not value or not value.strip()):
            raise serializers.ValidationError("Industry name cannot be empty")
        return value.strip() if value else value
