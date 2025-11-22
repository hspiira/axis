"""Serializers for Client model."""
from rest_framework import serializers
from apps.clients.models import Client
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)
from axis_backend.enums import BaseStatus, ContactMethod


class ClientListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """
    Lightweight serializer for client lists.

    Single Responsibility: List view data only
    Interface Segregation: Minimal fields for performance
    Extends: BaseListSerializer for common list patterns
    """

    industry_name = serializers.CharField(
        source='industry.name',
        read_only=True,
        allow_null=True
    )
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Client
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'industry_name',
            'status',
            'is_verified',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClientDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """
    Comprehensive serializer for client details.

    Single Responsibility: Detailed view data
    Extends: BaseDetailSerializer for common detail patterns
    Includes: All relationships and computed properties
    """

    industry = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    verified_status = serializers.BooleanField(read_only=True)
    primary_contact = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'website',
            'address',
            'billing_address',
            'timezone',
            'tax_id',
            'contact_person',
            'contact_email',
            'contact_phone',
            'industry',
            'status',
            'preferred_contact_method',
            'is_verified',
            'is_active',
            'verified_status',
            'notes',
            'metadata',
            'primary_contact',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'is_active',
            'verified_status',
            'created_at',
            'updated_at',
        ]

    def get_industry(self, obj):
        """Get industry details."""
        if obj.industry:
            return {
                'id': obj.industry.id,
                'name': obj.industry.name,
                'code': obj.industry.code,
            }
        return None

    def get_primary_contact(self, obj):
        """Get primary contact information."""
        return obj.get_primary_contact()


class ClientCreateSerializer(BaseCreateSerializer):
    """
    Serializer for client creation.

    Single Responsibility: Client creation validation
    Extends: BaseCreateSerializer for common creation patterns
    Validates: All required fields and business rules for client
    """

    name = serializers.CharField(
        max_length=255,
        help_text="Legal or operating name of organization"
    )
    email = serializers.EmailField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Primary organizational email address"
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Primary contact number"
    )
    website = serializers.URLField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Public website URL"
    )
    address = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Physical office address"
    )
    billing_address = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Invoicing address if different from physical"
    )
    timezone = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="IANA timezone identifier (e.g., 'Africa/Kampala')"
    )
    tax_id = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Tax identification or registration number"
    )
    contact_person = serializers.CharField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Full name of primary contact"
    )
    contact_email = serializers.EmailField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Email of primary contact person"
    )
    contact_phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Phone of primary contact person"
    )
    industry_id = serializers.CharField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Business sector classification"
    )
    status = serializers.ChoiceField(
        choices=BaseStatus.choices,
        required=False,
        default=BaseStatus.ACTIVE,
        help_text="Current operational status"
    )
    preferred_contact_method = serializers.ChoiceField(
        choices=ContactMethod.choices,
        required=False,
        allow_null=True,
        help_text="Preferred communication channel"
    )
    is_verified = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Organization verification status"
    )
    notes = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Internal observations and important details"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Flexible storage for custom attributes"
    )

    def validate_name(self, value):
        """
        Validate client name.

        Args:
            value: Client name

        Returns:
            Validated and stripped name

        Raises:
            serializers.ValidationError: If name is empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Client name cannot be empty")
        return value.strip()

    def validate(self, data):
        """
        Validate client data.

        Business Rules:
        - Active clients must have at least one contact method

        Args:
            data: Validated field data

        Returns:
            Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        # Call parent validation
        data = super().validate(data)

        # Validate active clients have contact method
        status = data.get('status', BaseStatus.ACTIVE)
        if status == BaseStatus.ACTIVE:
            has_contact = any([
                data.get('email'),
                data.get('phone'),
                data.get('contact_email'),
                data.get('contact_phone'),
            ])
            if not has_contact:
                raise serializers.ValidationError(
                    "Active clients must have at least one contact method (email or phone)"
                )

        return data


class ClientUpdateSerializer(BaseUpdateSerializer):
    """
    Serializer for client updates.

    Single Responsibility: Update validation
    Extends: BaseUpdateSerializer for common update patterns
    Cannot change: Core identifying information without proper validation
    """

    name = serializers.CharField(
        max_length=255,
        required=False,
        help_text="Legal or operating name"
    )
    email = serializers.EmailField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Primary email"
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Primary phone"
    )
    website = serializers.URLField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Website URL"
    )
    address = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Physical address"
    )
    billing_address = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Billing address"
    )
    timezone = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Timezone"
    )
    tax_id = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Tax ID"
    )
    contact_person = serializers.CharField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Contact person name"
    )
    contact_email = serializers.EmailField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Contact person email"
    )
    contact_phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Contact person phone"
    )
    industry_id = serializers.CharField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Industry classification"
    )
    status = serializers.ChoiceField(
        choices=BaseStatus.choices,
        required=False,
        help_text="Operational status"
    )
    preferred_contact_method = serializers.ChoiceField(
        choices=ContactMethod.choices,
        required=False,
        allow_null=True,
        help_text="Preferred contact method"
    )
    is_verified = serializers.BooleanField(
        required=False,
        help_text="Verification status"
    )
    notes = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Internal notes"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Custom attributes"
    )

    def validate_name(self, value):
        """
        Validate client name.

        Args:
            value: Client name

        Returns:
            Validated and stripped name

        Raises:
            serializers.ValidationError: If name is empty
        """
        if value is not None and (not value or not value.strip()):
            raise serializers.ValidationError("Client name cannot be empty")
        return value.strip() if value else value

    def validate(self, data):
        """
        Validate update data.

        Business Rules:
        - Active clients must maintain at least one contact method

        Args:
            data: Validated field data

        Returns:
            Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        # Call parent validation
        data = super().validate(data)

        # Get current instance if updating
        instance = getattr(self, 'instance', None)

        # If changing to active status, ensure contact methods exist
        if 'status' in data and data['status'] == BaseStatus.ACTIVE:
            # Build the expected state after update
            email = data.get('email', instance.email if instance else None)
            phone = data.get('phone', instance.phone if instance else None)
            contact_email = data.get('contact_email', instance.contact_email if instance else None)
            contact_phone = data.get('contact_phone', instance.contact_phone if instance else None)

            has_contact = any([email, phone, contact_email, contact_phone])
            if not has_contact:
                raise serializers.ValidationError(
                    "Active clients must have at least one contact method (email or phone)"
                )

        return data
