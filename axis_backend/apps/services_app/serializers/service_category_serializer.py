"""Serializers for ServiceCategory model."""
from rest_framework import serializers
from apps.services_app.models import ServiceCategory
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)


class ServiceCategoryListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """
    Lightweight serializer for category lists.

    Single Responsibility: List view data only
    Interface Segregation: Minimal fields for performance
    Extends: BaseListSerializer for common list patterns
    """

    service_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ServiceCategory
        fields = [
            'id',
            'name',
            'description',
            'service_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ServiceCategoryDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """
    Comprehensive serializer for category details.

    Single Responsibility: Detailed view data
    Extends: BaseDetailSerializer for common detail patterns
    Includes: All relationships and computed properties
    """

    service_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ServiceCategory
        fields = [
            'id',
            'name',
            'description',
            'service_count',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'service_count',
            'created_at',
            'updated_at',
        ]


class ServiceCategoryCreateSerializer(BaseCreateSerializer):
    """
    Serializer for category creation.

    Single Responsibility: Category creation validation
    Extends: BaseCreateSerializer for common creation patterns
    Validates: All required fields and business rules
    """

    name = serializers.CharField(
        max_length=100,
        help_text="Category name (e.g., 'Counseling', 'Legal Assistance')"
    )
    description = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Category purpose and scope"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Additional category attributes"
    )

    def validate_name(self, value):
        """Validate category name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Category name cannot be empty")
        return value.strip()


class ServiceCategoryUpdateSerializer(BaseUpdateSerializer):
    """
    Serializer for category updates.

    Single Responsibility: Update validation
    Extends: BaseUpdateSerializer for common update patterns
    """

    name = serializers.CharField(
        max_length=100,
        required=False,
        help_text="Category name"
    )
    description = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Category description"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Category metadata"
    )

    def validate_name(self, value):
        """Validate category name."""
        if value is not None and (not value or not value.strip()):
            raise serializers.ValidationError("Category name cannot be empty")
        return value.strip() if value else value
