"""Base serializers for common patterns."""
from rest_framework import serializers
from typing import List, Optional


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Base serializer for all model serializers.

    Responsibilities (Single Responsibility Principle):
    - Common field configuration
    - Standard read-only fields
    - Timestamp formatting

    Design Notes (SOLID):
    - Open/Closed: Extend without modification
    - Provides consistent behavior across all serializers
    """

    class Meta:
        abstract = True
        # Default read-only fields for all models
        read_only_fields = ['id', 'created_at', 'updated_at']


class BaseListSerializer(BaseModelSerializer):
    """
    Base serializer for list views.

    Responsibilities (Single Responsibility Principle):
    - Minimal fields for list performance
    - Essential display information only

    Design Notes:
    - Interface Segregation: List views don't need full detail
    - Optimized for performance with fewer fields
    - Override 'fields' in Meta to specify list fields
    """

    class Meta(BaseModelSerializer.Meta):
        abstract = True
        # Subclasses should define minimal fields
        # Example: fields = ['id', 'name', 'status', 'created_at']


class BaseDetailSerializer(BaseModelSerializer):
    """
    Base serializer for detail views.

    Responsibilities (Single Responsibility Principle):
    - Complete object representation
    - All relationships and computed fields
    - Full data for single object view

    Design Notes:
    - Interface Segregation: Detail views need comprehensive data
    - Includes nested serializers for relationships
    - Override to add computed/read-only fields
    """

    class Meta(BaseModelSerializer.Meta):
        abstract = True
        # Subclasses should define all fields
        # Example: fields = '__all__' or explicit list


class BaseCreateSerializer(serializers.Serializer):
    """
    Base serializer for creation operations.

    Responsibilities (Single Responsibility Principle):
    - Input validation for creation
    - Required field enforcement
    - Business rule validation

    Design Notes:
    - Uses Serializer (not ModelSerializer) for explicit control
    - Define only fields needed for creation
    - Implement validate() for business rules
    """

    def validate(self, data):
        """
        Validate creation data.

        Override in subclass to add business validation.

        Args:
            data: Validated field data

        Returns:
            Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        return data

    def create(self, validated_data):
        """
        Create instance.

        This should NOT be used directly - delegate to service layer.
        Override only if absolutely necessary.

        Args:
            validated_data: Validated data

        Returns:
            Created instance
        """
        raise NotImplementedError(
            "Create logic should be in service layer, not serializer. "
            "Use serializer.validated_data in view and pass to service."
        )


class BaseUpdateSerializer(serializers.Serializer):
    """
    Base serializer for update operations.

    Responsibilities (Single Responsibility Principle):
    - Input validation for updates
    - Partial update support
    - Update-specific business rules

    Design Notes:
    - Uses Serializer (not ModelSerializer) for explicit control
    - All fields optional by default (partial updates)
    - Implement validate() for update-specific rules
    """

    def validate(self, data):
        """
        Validate update data.

        Override in subclass to add business validation.
        Access self.instance for current state validation.

        Args:
            data: Validated field data

        Returns:
            Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        return data

    def update(self, instance, validated_data):
        """
        Update instance.

        This should NOT be used directly - delegate to service layer.
        Override only if absolutely necessary.

        Args:
            instance: Instance to update
            validated_data: Validated data

        Returns:
            Updated instance
        """
        raise NotImplementedError(
            "Update logic should be in service layer, not serializer. "
            "Use serializer.validated_data in view and pass to service."
        )


class TimestampMixin:
    """
    Mixin for consistent timestamp formatting.

    Add to serializers that need formatted timestamps.
    """

    created_at = serializers.DateTimeField(
        format='%Y-%m-%dT%H:%M:%S.%fZ',
        read_only=True
    )
    updated_at = serializers.DateTimeField(
        format='%Y-%m-%dT%H:%M:%S.%fZ',
        read_only=True
    )


class SoftDeleteMixin:
    """
    Mixin for soft-deleted models.

    Add to serializers for models with soft delete.
    """

    deleted_at = serializers.DateTimeField(
        format='%Y-%m-%dT%H:%M:%S.%fZ',
        read_only=True,
        allow_null=True
    )
    is_deleted = serializers.SerializerMethodField()

    def get_is_deleted(self, obj) -> bool:
        """Check if object is soft-deleted."""
        return obj.deleted_at is not None


class NestedRelationshipMixin:
    """
    Base mixin for nested relationship serialization.

    Provides common patterns for serializing related objects.
    """

    @staticmethod
    def get_nested_id_name(obj, relationship_path: str) -> Optional[dict]:
        """
        Get ID and name from nested relationship.

        Args:
            obj: Model instance
            relationship_path: Dot-separated path (e.g., 'client.industry')

        Returns:
            Dict with 'id' and 'name', or None if relationship is null
        """
        current = obj
        for attr in relationship_path.split('.'):
            current = getattr(current, attr, None)
            if current is None:
                return None

        return {
            'id': str(current.id) if hasattr(current, 'id') else None,
            'name': str(current) if current else None
        }


class ComputedFieldsMixin:
    """
    Mixin for common computed fields.

    Add to serializers that need computed/derived fields.
    """

    def get_display_name(self, obj) -> str:
        """Get display name using model's __str__."""
        return str(obj)

    def get_status_display(self, obj) -> Optional[str]:
        """Get human-readable status if model has get_status_display."""
        if hasattr(obj, 'get_status_display'):
            return obj.get_status_display()
        return None


class ValidationMessagesMixin:
    """
    Mixin for consistent validation error messages.

    Provides standard error messages.
    """

    default_error_messages = {
        'required': 'This field is required.',
        'null': 'This field cannot be null.',
        'blank': 'This field cannot be blank.',
        'invalid': 'Invalid value provided.',
        'unique': 'This value must be unique.',
        'does_not_exist': 'Related object does not exist.',
        'incorrect_type': 'Incorrect data type provided.',
    }

    def format_validation_error(self, field: str, message: str) -> dict:
        """
        Format validation error consistently.

        Args:
            field: Field name
            message: Error message

        Returns:
            Formatted error dict
        """
        return {field: [message]}
