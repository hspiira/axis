"""Client Contact serializers."""
from rest_framework import serializers
from apps.clients.models import ClientContact, Client


class ClientContactSerializer(serializers.ModelSerializer):
    """Serializer for Client Contact CRUD operations."""

    full_name = serializers.ReadOnlyField()
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = ClientContact
        fields = [
            'id',
            'client',
            'client_name',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'mobile',
            'role',
            'title',
            'department',
            'is_primary',
            'preferred_contact_method',
            'is_active',
            'notes',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'full_name', 'client_name', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validate contact data."""
        # Ensure at least one contact method
        if not any([attrs.get('email'), attrs.get('phone'), attrs.get('mobile')]):
            raise serializers.ValidationError(
                "Contact must have at least one contact method (email, phone, or mobile)."
            )

        # Check unique email per client
        client = attrs.get('client') or self.instance.client
        email = attrs.get('email')
        if email:
            query = ClientContact.objects.filter(client=client, email=email)
            if self.instance:
                query = query.exclude(id=self.instance.id)
            if query.exists():
                raise serializers.ValidationError({
                    'email': 'A contact with this email already exists for this client.'
                })

        return attrs


class ClientContactListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for contact lists."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = ClientContact
        fields = [
            'id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'role',
            'title',
            'is_primary',
            'is_active',
        ]


class ClientContactCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating contacts (client_id from URL)."""

    class Meta:
        model = ClientContact
        fields = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'mobile',
            'role',
            'title',
            'department',
            'is_primary',
            'preferred_contact_method',
            'is_active',
            'notes',
            'metadata',
        ]

    def validate(self, attrs):
        """Validate contact data."""
        # Ensure at least one contact method
        if not any([attrs.get('email'), attrs.get('phone'), attrs.get('mobile')]):
            raise serializers.ValidationError(
                "Contact must have at least one contact method (email, phone, or mobile)."
            )
        return attrs
