"""Serializers for Document model."""
from rest_framework import serializers
from apps.documents.models import Document
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin
)
from axis_backend.enums import DocumentType, DocumentStatus


class DocumentListSerializer(TimestampMixin, BaseListSerializer, NestedRelationshipMixin):

    uploaded_by_name = serializers.CharField(
        source='uploaded_by.email',
        read_only=True,
        allow_null=True
    )
    client_name = serializers.CharField(
        source='client.name',
        read_only=True,
        allow_null=True
    )
    contract_start_date = serializers.DateField(
        source='contract.start_date',
        read_only=True,
        allow_null=True
    )
    is_expired = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Document
        fields = (
            'id',
            'title',
            'type',
            'status',
            'version',
            'is_latest',
            'uploaded_by_name',
            'client_name',
            'contract_start_date',
            'expiry_date',
            'is_confidential',
            'is_expired',
            'is_active',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class DocumentDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """
    Comprehensive serializer for document details.

    Single Responsibility: Detailed view data
    Extends: BaseDetailSerializer for common detail patterns
    Includes: All relationships and computed properties
    """

    uploaded_by_email = serializers.CharField(
        source='uploaded_by.email',
        read_only=True,
        allow_null=True
    )
    client_name = serializers.CharField(
        source='client.name',
        read_only=True,
        allow_null=True
    )
    client_id = serializers.CharField(
        source='client.id',
        read_only=True,
        allow_null=True
    )
    contract_start_date = serializers.DateField(
        source='contract.start_date',
        read_only=True,
        allow_null=True
    )
    contract_id = serializers.CharField(
        source='contract.id',
        read_only=True,
        allow_null=True
    )
    previous_version_id = serializers.CharField(
        source='previous_version.id',
        read_only=True,
        allow_null=True
    )

    # Computed fields
    is_expired = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Document
        fields = (
            # IDs and basic info
            'id',
            'title',
            'description',
            'type',
            'url',
            'file_size',
            'file_type',
            # Versioning
            'version',
            'is_latest',
            'previous_version_id',
            # Status and access
            'status',
            'expiry_date',
            'is_confidential',
            'tags',
            # Relationships
            'uploaded_by_email',
            'client_name',
            'client_id',
            'contract_start_date',
            'contract_id',
            # Additional info
            'metadata',
            # Computed fields
            'is_expired',
            'is_active',
            # Timestamps
            'created_at',
            'updated_at',
            'deleted_at'
        )
        read_only_fields = (
            'id', 'version', 'is_latest', 'previous_version_id',
            'is_expired', 'is_active', 'created_at', 'updated_at', 'deleted_at'
        )


class DocumentCreateSerializer(BaseCreateSerializer):
    """
    Serializer for creating documents.

    Single Responsibility: Document creation validation
    Extends: BaseCreateSerializer for common creation patterns
    Validation: Business rules enforcement
    """

    # Required fields
    title = serializers.CharField(max_length=255)
    type = serializers.ChoiceField(choices=DocumentType.choices)
    url = serializers.URLField()
    uploaded_by_id = serializers.CharField(write_only=True)

    # Optional fields
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    file_size = serializers.IntegerField(required=False, allow_null=True)
    file_type = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    client_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    contract_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    is_confidential = serializers.BooleanField(required=False, default=False)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_null=True,
        default=list
    )
    metadata = serializers.JSONField(required=False, allow_null=True)

    def validate_type(self, value):
        """Validate document type is valid choice."""
        if value not in dict(DocumentType.choices):
            raise serializers.ValidationError(
                f"Invalid document type. Must be one of: {', '.join(dict(DocumentType.choices).keys())}"
            )
        return value

    def validate_file_size(self, value):
        """Validate file size is positive."""
        if value is not None and value < 0:
            raise serializers.ValidationError("File size must be positive")
        return value

    def validate_expiry_date(self, value):
        """Validate expiry date is in the future."""
        if value:
            from django.utils import timezone
            if value <= timezone.now().date():
                raise serializers.ValidationError("Expiry date must be in the future")
        return value

    def validate(self, attrs):
        """Cross-field validation."""
        # Validate contract belongs to client if both provided
        if attrs.get('contract_id') and attrs.get('client_id'):
            from apps.contracts.models import Contract
            try:
                contract = Contract.objects.get(id=attrs['contract_id'])
            except Contract.DoesNotExist:
                raise serializers.ValidationError({
                    'contract_id': 'Contract does not exist'
                })
            if str(contract.client_id) != attrs['client_id']:
                raise serializers.ValidationError({
                    'contract_id': 'Contract does not belong to specified client'
                })
            
        return attrs


class DocumentUpdateSerializer(BaseUpdateSerializer):
    """
    Serializer for updating documents.

    Single Responsibility: Document update validation
    Extends: BaseUpdateSerializer for common update patterns
    Validation: Business rules enforcement
    """

    # All fields optional for partial updates
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    type = serializers.ChoiceField(choices=DocumentType.choices, required=False)
    file_size = serializers.IntegerField(required=False, allow_null=True)
    file_type = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    is_confidential = serializers.BooleanField(required=False)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_null=True
    )
    metadata = serializers.JSONField(required=False, allow_null=True)

    def validate_file_size(self, value):
        """Validate file size is positive."""
        if value is not None and value < 0:
            raise serializers.ValidationError("File size must be positive")
        return value

    def validate_expiry_date(self, value):
        """Validate expiry date is in the future."""
        if value:
            from django.utils import timezone
            if value <= timezone.now().date():
                raise serializers.ValidationError("Expiry date must be in the future")
        return value

    def validate(self, attrs):
        """Prevent modification of version-related fields."""
        forbidden_fields = ['version', 'previous_version', 'is_latest', 'url']

        # Check both attrs and initial_data to catch fields not in serializer definition
        for field in forbidden_fields:
            if field in attrs or (hasattr(self, 'initial_data') and field in self.initial_data):
                raise serializers.ValidationError({
                    field: f'Cannot modify {field}. Use create_new_version endpoint for versioning.'
                })
        return attrs


class DocumentVersionSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for version history.

    Single Responsibility: Version information
    Used in: Version history endpoint
    """

    uploaded_by_email = serializers.CharField(
        source='uploaded_by.email',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Document
        fields = (
            'id',
            'version',
            'url',
            'status',
            'is_latest',
            'uploaded_by_email',
            'created_at',
            'updated_at'
        )
        read_only_fields = fields
