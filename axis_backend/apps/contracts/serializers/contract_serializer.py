"""Serializers for Contract model."""
from rest_framework import serializers
from apps.contracts.models import Contract
from axis_backend.serializers.base import (
    BaseListSerializer,
    BaseDetailSerializer,
    BaseCreateSerializer,
    BaseUpdateSerializer,
    TimestampMixin,
    NestedRelationshipMixin,
)
from axis_backend.enums import ContractStatus, PaymentStatus


class ContractListSerializer(BaseListSerializer, NestedRelationshipMixin):
    """
    Lightweight serializer for contract lists.

    Single Responsibility: List view data only
    Interface Segregation: Minimal fields for performance
    Extends: BaseListSerializer for common list patterns
    """

    client_name = serializers.CharField(
        source='client.name',
        read_only=True
    )
    is_active = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id',
            'client_name',
            'start_date',
            'end_date',
            'billing_rate',
            'currency',
            'status',
            'payment_status',
            'is_active',
            'is_expired',
            'days_remaining',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContractDetailSerializer(BaseDetailSerializer, TimestampMixin, NestedRelationshipMixin):
    """
    Comprehensive serializer for contract details.

    Single Responsibility: Detailed view data
    Extends: BaseDetailSerializer for common detail patterns
    Includes: All relationships and computed properties
    """

    client = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_pending_renewal = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    is_payment_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id',
            'client',
            'start_date',
            'end_date',
            'renewal_date',
            'billing_rate',
            'currency',
            'payment_frequency',
            'payment_terms',
            'payment_status',
            'last_billing_date',
            'next_billing_date',
            'is_renewable',
            'is_auto_renew',
            'document_url',
            'signed_by',
            'signed_at',
            'status',
            'termination_reason',
            'notes',
            'is_active',
            'is_expired',
            'is_pending_renewal',
            'days_remaining',
            'is_payment_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'is_active',
            'is_expired',
            'is_pending_renewal',
            'days_remaining',
            'is_payment_overdue',
            'created_at',
            'updated_at',
        ]

    def get_client(self, obj):
        """Get client details."""
        if obj.client:
            return {
                'id': obj.client.id,
                'name': obj.client.name,
                'email': obj.client.email,
            }
        return None


class ContractCreateSerializer(BaseCreateSerializer):
    """
    Serializer for contract creation.

    Single Responsibility: Contract creation validation
    Extends: BaseCreateSerializer for common creation patterns
    Validates: All required fields and business rules for contract
    """

    client_id = serializers.CharField(
        help_text="Client organization ID"
    )
    start_date = serializers.DateField(
        help_text="Contract effective start date"
    )
    end_date = serializers.DateField(
        help_text="Contract expiration date"
    )
    billing_rate = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Contract value or billing rate"
    )
    currency = serializers.CharField(
        max_length=3,
        required=False,
        default='UGX',
        help_text="ISO 4217 currency code (e.g., 'UGX', 'USD')"
    )
    payment_frequency = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Billing cycle (e.g., 'Monthly', 'Quarterly')"
    )
    payment_terms = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Payment conditions and due date terms"
    )
    renewal_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Date when contract is eligible for renewal"
    )
    is_renewable = serializers.BooleanField(
        required=False,
        default=True,
        help_text="Contract eligible for renewal"
    )
    is_auto_renew = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Automatic renewal enabled"
    )
    document_url = serializers.URLField(
        max_length=500,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Signed contract document location"
    )
    signed_by = serializers.CharField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Authorized signatory name"
    )
    signed_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="Contract execution timestamp"
    )
    notes = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Internal contract notes and observations"
    )

    def validate(self, data):
        """
        Validate contract data.

        Business Rules:
        - End date must be after start date
        - Renewal date must fall within contract period
        - Billing rate must be non-negative

        Args:
            data: Validated field data

        Returns:
            Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        # Call parent validation
        data = super().validate(data)

        # Validate dates
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date'
            })

        # Validate renewal date
        if data.get('renewal_date'):
            if data['renewal_date'] < data['start_date'] or data['renewal_date'] > data['end_date']:
                raise serializers.ValidationError({
                    'renewal_date': 'Renewal date must fall within contract period'
                })

        return data


class ContractUpdateSerializer(BaseUpdateSerializer):
    """
    Serializer for contract updates.

    Single Responsibility: Update validation
    Extends: BaseUpdateSerializer for common update patterns
    Cannot change: Client relationship without proper authorization
    """

    start_date = serializers.DateField(
        required=False,
        help_text="Contract start date"
    )
    end_date = serializers.DateField(
        required=False,
        help_text="Contract end date"
    )
    billing_rate = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        help_text="Billing rate"
    )
    currency = serializers.CharField(
        max_length=3,
        required=False,
        help_text="Currency code"
    )
    payment_frequency = serializers.CharField(
        max_length=50,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Payment frequency"
    )
    payment_terms = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Payment terms"
    )
    renewal_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Renewal date"
    )
    is_renewable = serializers.BooleanField(
        required=False,
        help_text="Renewable flag"
    )
    is_auto_renew = serializers.BooleanField(
        required=False,
        help_text="Auto-renew flag"
    )
    document_url = serializers.URLField(
        max_length=500,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Document URL"
    )
    signed_by = serializers.CharField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Signatory name"
    )
    signed_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="Signature timestamp"
    )
    notes = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Internal notes"
    )

    def validate(self, data):
        """
        Validate update data.

        Business Rules:
        - End date must be after start date
        - Renewal date must fall within contract period

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

        # Validate dates if both are being updated or one is being updated
        if 'start_date' in data or 'end_date' in data:
            start_date = data.get('start_date', instance.start_date if instance else None)
            end_date = data.get('end_date', instance.end_date if instance else None)

            if start_date and end_date and end_date <= start_date:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date'
                })

        # Validate renewal date if present
        if 'renewal_date' in data and data['renewal_date']:
            start_date = data.get('start_date', instance.start_date if instance else None)
            end_date = data.get('end_date', instance.end_date if instance else None)

            if start_date and end_date:
                if data['renewal_date'] < start_date or data['renewal_date'] > end_date:
                    raise serializers.ValidationError({
                        'renewal_date': 'Renewal date must fall within contract period'
                    })

        return data
