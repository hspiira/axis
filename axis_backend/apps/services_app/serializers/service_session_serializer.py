"""Serializers for ServiceSession model."""
from rest_framework import serializers
from apps.services_app.models import ServiceSession
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)
from axis_backend.enums import SessionStatus


class ServiceSessionListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """Lightweight serializer for session lists."""

    service_name = serializers.CharField(source='service.name', read_only=True)
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    person_name = serializers.CharField(source='person.profile.full_name', read_only=True)

    class Meta:
        model = ServiceSession
        fields = [
            'id',
            'service_name',
            'provider_name',
            'person_name',
            'scheduled_at',
            'completed_at',
            'status',
            'duration',
            'is_group_session',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ServiceSessionDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """Comprehensive serializer for session details."""

    service = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()
    person = serializers.SerializerMethodField()

    class Meta:
        model = ServiceSession
        fields = [
            'id',
            'service',
            'provider',
            'person',
            'scheduled_at',
            'completed_at',
            'status',
            'notes',
            'feedback',
            'duration',
            'location',
            'cancellation_reason',
            'reschedule_count',
            'is_group_session',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'reschedule_count', 'created_at', 'updated_at']

    def get_service(self, obj):
        if obj.service:
            return {'id': obj.service.id, 'name': obj.service.name}
        return None

    def get_provider(self, obj):
        if obj.provider:
            return {'id': obj.provider.id, 'name': obj.provider.name}
        return None

    def get_person(self, obj):
        if obj.person:
            return {'id': obj.person.id, 'name': obj.person.profile.full_name}
        return None


class ServiceSessionCreateSerializer(BaseCreateSerializer):
    """Serializer for session creation."""

    service_id = serializers.CharField(write_only=True, help_text="Service ID")
    provider_id = serializers.CharField(write_only=True, help_text="Provider ID")
    person_id = serializers.CharField(write_only=True, help_text="Person ID (employee or dependent)")
    scheduled_at = serializers.DateTimeField(help_text="Session date and time")
    status = serializers.ChoiceField(choices=SessionStatus.choices, required=False, default=SessionStatus.SCHEDULED, help_text="Session status")
    location = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True, help_text="Session location")
    is_group_session = serializers.BooleanField(required=False, default=False, help_text="Group session flag")
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Session notes")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Session metadata")


class ServiceSessionUpdateSerializer(BaseUpdateSerializer):
    """Serializer for session updates."""

    scheduled_at = serializers.DateTimeField(required=False, help_text="Scheduled time")
    completed_at = serializers.DateTimeField(required=False, allow_null=True, help_text="Completion time")
    status = serializers.ChoiceField(choices=SessionStatus.choices, required=False, help_text="Status")
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Notes")
    feedback = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Feedback")
    duration = serializers.IntegerField(required=False, allow_null=True, help_text="Duration in minutes")
    location = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True, help_text="Location")
    cancellation_reason = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Cancellation reason")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Metadata")
