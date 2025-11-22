"""Serializers for Service model."""
from rest_framework import serializers
from apps.services_app.models import Service
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)
from axis_backend.enums import BaseStatus


class ServiceListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """Lightweight serializer for service lists."""

    category_name = serializers.CharField(source='category.name', read_only=True)
    provider_name = serializers.CharField(source='service_provider.name', read_only=True, allow_null=True)
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'category_name',
            'provider_name',
            'status',
            'duration',
            'capacity',
            'is_public',
            'price',
            'is_available',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ServiceDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """Comprehensive serializer for service details."""

    category = serializers.SerializerMethodField()
    service_provider = serializers.SerializerMethodField()
    is_available = serializers.BooleanField(read_only=True)
    is_group_service = serializers.BooleanField(read_only=True)

    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'description',
            'category',
            'status',
            'duration',
            'capacity',
            'prerequisites',
            'is_public',
            'price',
            'service_provider',
            'is_available',
            'is_group_service',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_available', 'is_group_service', 'created_at', 'updated_at']

    def get_category(self, obj):
        """Get category details."""
        if obj.category:
            return {
                'id': obj.category.id,
                'name': obj.category.name,
            }
        return None

    def get_service_provider(self, obj):
        """Get provider details."""
        if obj.service_provider:
            return {
                'id': obj.service_provider.id,
                'name': obj.service_provider.name,
                'type': obj.service_provider.type,
            }
        return None


class ServiceCreateSerializer(BaseCreateSerializer):
    """Serializer for service creation."""

    name = serializers.CharField(max_length=255, help_text="Service name")
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Service description")
    category_id = serializers.CharField(write_only=True, help_text="Service category ID")
    status = serializers.ChoiceField(choices=BaseStatus.choices, required=False, default=BaseStatus.ACTIVE, help_text="Service status")
    duration = serializers.IntegerField(required=False, allow_null=True, help_text="Session duration in minutes")
    capacity = serializers.IntegerField(required=False, allow_null=True, help_text="Maximum participants for group sessions")
    prerequisites = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Service prerequisites")
    is_public = serializers.BooleanField(required=False, default=True, help_text="Public catalog visibility")
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, help_text="Service cost")
    service_provider_id = serializers.CharField(required=False, allow_null=True, write_only=True, help_text="Default provider ID")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Service metadata")


class ServiceUpdateSerializer(BaseUpdateSerializer):
    """Serializer for service updates."""

    name = serializers.CharField(max_length=255, required=False, help_text="Service name")
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Service description")
    category_id = serializers.CharField(required=False, write_only=True, help_text="Category ID")
    status = serializers.ChoiceField(choices=BaseStatus.choices, required=False, help_text="Service status")
    duration = serializers.IntegerField(required=False, allow_null=True, help_text="Duration in minutes")
    capacity = serializers.IntegerField(required=False, allow_null=True, help_text="Maximum participants")
    prerequisites = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Prerequisites")
    is_public = serializers.BooleanField(required=False, help_text="Public visibility")
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, help_text="Service cost")
    service_provider_id = serializers.CharField(required=False, allow_null=True, write_only=True, help_text="Provider ID")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Metadata")
