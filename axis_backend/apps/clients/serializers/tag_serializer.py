"""Client Tag serializers."""
from rest_framework import serializers
from apps.clients.models import ClientTag


class ClientTagSerializer(serializers.ModelSerializer):
    """Serializer for Client Tag CRUD operations."""

    client_count = serializers.SerializerMethodField()

    class Meta:
        model = ClientTag
        fields = [
            'id',
            'name',
            'slug',
            'color',
            'description',
            'is_system',
            'client_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'client_count']

    def get_client_count(self, obj):
        """Get number of clients with this tag."""
        return obj.clients.count()

    def validate_name(self, value):
        """Validate tag name uniqueness (case-insensitive)."""
        if self.instance:
            # Update case - exclude current instance
            if ClientTag.objects.exclude(id=self.instance.id).filter(name__iexact=value).exists():
                raise serializers.ValidationError("A tag with this name already exists.")
        else:
            # Create case
            if ClientTag.objects.filter(name__iexact=value).exists():
                raise serializers.ValidationError("A tag with this name already exists.")
        return value

    def validate(self, attrs):
        """Prevent deletion/modification of system tags."""
        if self.instance and self.instance.is_system:
            if 'name' in attrs or 'slug' in attrs:
                raise serializers.ValidationError("System tags cannot be renamed.")
        return attrs


class ClientTagListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for tag lists."""

    class Meta:
        model = ClientTag
        fields = ['id', 'name', 'slug', 'color']
