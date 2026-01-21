"""Serializers for ServiceProvider model."""
from rest_framework import serializers
from apps.services_app.models import ServiceProvider
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)
from axis_backend.enums import ServiceProviderType, WorkStatus


class ServiceProviderListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """Lightweight serializer for provider lists."""

    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = ServiceProvider
        fields = [
            'id',
            'name',
            'type',
            'contact_email',
            'contact_phone',
            'location',
            'rating',
            'is_verified',
            'status',
            'is_available',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ServiceProviderDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """Comprehensive serializer for provider details."""

    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = ServiceProvider
        fields = [
            'id',
            'name',
            'type',
            'contact_email',
            'contact_phone',
            'location',
            'qualifications',
            'specializations',
            'availability',
            'rating',
            'is_verified',
            'status',
            'is_available',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_available', 'created_at', 'updated_at']


class ServiceProviderCreateSerializer(BaseCreateSerializer):
    """Serializer for provider creation."""

    name = serializers.CharField(max_length=255, help_text="Provider name or organization")
    type = serializers.ChoiceField(choices=ServiceProviderType.choices, help_text="Provider type")
    contact_email = serializers.EmailField(required=False, allow_null=True, help_text="Contact email")
    contact_phone = serializers.CharField(max_length=20, required=False, allow_null=True, help_text="Contact phone")
    location = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Service location")
    qualifications = serializers.JSONField(required=False, default=list, help_text="Certifications and credentials")
    specializations = serializers.JSONField(required=False, default=list, help_text="Areas of expertise")
    availability = serializers.JSONField(required=False, allow_null=True, help_text="Available hours")
    rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False, allow_null=True, help_text="Rating (0-5)")
    is_verified = serializers.BooleanField(required=False, default=False, help_text="Verification status")
    status = serializers.ChoiceField(choices=WorkStatus.choices, required=False, default=WorkStatus.ACTIVE, help_text="Provider status")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Additional information")


class ServiceProviderUpdateSerializer(BaseUpdateSerializer):
    """Serializer for provider updates."""

    name = serializers.CharField(max_length=255, required=False, help_text="Provider name")
    type = serializers.ChoiceField(choices=ServiceProviderType.choices, required=False, help_text="Provider type")
    contact_email = serializers.EmailField(required=False, allow_null=True, help_text="Contact email")
    contact_phone = serializers.CharField(max_length=20, required=False, allow_null=True, help_text="Contact phone")
    location = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Location")
    qualifications = serializers.JSONField(required=False, help_text="Qualifications")
    specializations = serializers.JSONField(required=False, help_text="Specializations")
    availability = serializers.JSONField(required=False, allow_null=True, help_text="Availability")
    rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False, allow_null=True, help_text="Rating")
    is_verified = serializers.BooleanField(required=False, help_text="Verification status")
    status = serializers.ChoiceField(choices=WorkStatus.choices, required=False, help_text="Status")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Metadata")
