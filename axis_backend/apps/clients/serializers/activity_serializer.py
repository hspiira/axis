"""Client Activity serializers."""
from rest_framework import serializers
from apps.clients.models import ClientActivity, Client, ClientContact


class ClientActivitySerializer(serializers.ModelSerializer):
    """Serializer for Client Activity CRUD operations."""

    client_name = serializers.CharField(source='client.name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    # staff_member_name = serializers.CharField(source='staff_member.full_name', read_only=True)  # TODO: Uncomment when staff app exists

    class Meta:
        model = ClientActivity
        fields = [
            'id',
            'client',
            'client_name',
            'activity_type',
            'title',
            'description',
            'activity_date',
            # 'staff_member',  # TODO: Uncomment when staff app exists
            # 'staff_member_name',  # TODO: Uncomment when staff app exists
            'contact',
            'contact_name',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'client_name', 'contact_name', 'created_at', 'updated_at']

    def get_contact_name(self, obj):
        """Get contact person's full name."""
        return obj.contact.full_name if obj.contact else None


class ClientActivityListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for activity lists."""

    contact_name = serializers.SerializerMethodField()

    class Meta:
        model = ClientActivity
        fields = [
            'id',
            'activity_type',
            'title',
            'activity_date',
            'contact_name',
            'created_at',
        ]

    def get_contact_name(self, obj):
        """Get contact person's full name."""
        return obj.contact.full_name if obj.contact else None


class ClientActivityCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating activities (client_id from URL)."""

    class Meta:
        model = ClientActivity
        fields = [
            'activity_type',
            'title',
            'description',
            'activity_date',
            # 'staff_member',  # TODO: Uncomment when staff app exists
            'contact',
            'metadata',
        ]

    def validate_contact(self, value):
        """Validate that contact belongs to the client."""
        if value:
            client_id = self.context.get('client_id')
            if client_id and value.client_id != client_id:
                raise serializers.ValidationError(
                    "Contact must belong to the same client."
                )
        return value
