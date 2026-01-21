"""Serializers for SessionFeedback model."""
from rest_framework import serializers
from apps.services_app.models import SessionFeedback
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)


class SessionFeedbackListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """Lightweight serializer for feedback lists."""

    session_info = serializers.CharField(source='session.__str__', read_only=True)

    class Meta:
        model = SessionFeedback
        fields = [
            'id',
            'session_info',
            'rating',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SessionFeedbackDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """Comprehensive serializer for feedback details."""

    session = serializers.SerializerMethodField()

    class Meta:
        model = SessionFeedback
        fields = [
            'id',
            'session',
            'rating',
            'comment',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_session(self, obj):
        if obj.session:
            return {
                'id': obj.session.id,
                'service_name': obj.session.service.name,
                'scheduled_at': obj.session.scheduled_at,
            }
        return None


class SessionFeedbackCreateSerializer(BaseCreateSerializer):
    """Serializer for feedback creation."""

    session_id = serializers.CharField(write_only=True, help_text="Session ID")
    rating = serializers.IntegerField(min_value=1, max_value=5, help_text="Rating (1-5)")
    comment = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Written feedback")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Additional feedback data")

    def validate_rating(self, value):
        """Validate rating range."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class SessionFeedbackUpdateSerializer(BaseUpdateSerializer):
    """Serializer for feedback updates."""

    rating = serializers.IntegerField(min_value=1, max_value=5, required=False, help_text="Rating (1-5)")
    comment = serializers.CharField(required=False, allow_null=True, allow_blank=True, help_text="Comment")
    metadata = serializers.JSONField(required=False, allow_null=True, help_text="Metadata")

    def validate_rating(self, value):
        """Validate rating range."""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
