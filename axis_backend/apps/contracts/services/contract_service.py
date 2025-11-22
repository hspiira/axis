"""Service for Contract business logic."""
from typing import Optional, List, Dict, Any
from datetime import date
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from axis_backend.enums import ContractStatus, PaymentStatus
from apps.contracts.models import Contract
from apps.contracts.repositories import ContractRepository
from apps.clients.models import Client


class ContractService(BaseService[Contract]):
    """
    Service for Contract business logic.

    Responsibilities:
    - Contract creation and management
    - Lifecycle transitions (activate, terminate, renew)
    - Payment tracking and billing
    """

    repository_class = ContractRepository

    # Create Operations

    @transaction.atomic
    def create_contract(
        self,
        client_id: str,
        start_date: date,
        end_date: date,
        billing_rate: Decimal,
        currency: str = 'UGX',
        payment_frequency: Optional[str] = None,
        payment_terms: Optional[str] = None,
        renewal_date: Optional[date] = None,
        is_renewable: bool = True,
        is_auto_renew: bool = False,
        document_url: Optional[str] = None,
        signed_by: Optional[str] = None,
        signed_at: Optional[date] = None,
        notes: Optional[str] = None,
        **kwargs
    ) -> Contract:
        """
        Create a new contract.

        Args:
            client_id: Client ID (required)
            start_date: Contract start date (required)
            end_date: Contract end date (required)
            billing_rate: Contract value or billing rate (required)
            currency: ISO 4217 currency code
            payment_frequency: Billing cycle
            payment_terms: Payment conditions
            renewal_date: Date eligible for renewal
            is_renewable: Renewal eligibility
            is_auto_renew: Auto-renewal enabled
            document_url: Signed contract document location
            signed_by: Signatory name
            signed_at: Signature timestamp
            notes: Internal notes
            **kwargs: Additional fields

        Returns:
            Created Contract instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate client exists
        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            raise ValidationError(f"Client with ID '{client_id}' does not exist")

        # Validate dates
        if end_date <= start_date:
            raise ValidationError("End date must be after start date")

        if renewal_date:
            if renewal_date < start_date or renewal_date > end_date:
                raise ValidationError("Renewal date must fall within contract period")

        # Validate billing rate
        if billing_rate < Decimal('0'):
            raise ValidationError("Billing rate cannot be negative")

        # Create contract
        contract_data = {
            'client': client,
            'start_date': start_date,
            'end_date': end_date,
            'billing_rate': billing_rate,
            'currency': currency,
            'payment_frequency': payment_frequency,
            'payment_terms': payment_terms,
            'renewal_date': renewal_date,
            'is_renewable': is_renewable,
            'is_auto_renew': is_auto_renew,
            'document_url': document_url,
            'signed_by': signed_by,
            'signed_at': signed_at,
            'notes': notes,
            **kwargs
        }

        return self.repository.create(**contract_data)

    # Update Operations

    @transaction.atomic
    def update_contract(
        self,
        contract_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        billing_rate: Optional[Decimal] = None,
        currency: Optional[str] = None,
        payment_frequency: Optional[str] = None,
        payment_terms: Optional[str] = None,
        renewal_date: Optional[date] = None,
        is_renewable: Optional[bool] = None,
        is_auto_renew: Optional[bool] = None,
        document_url: Optional[str] = None,
        signed_by: Optional[str] = None,
        signed_at: Optional[date] = None,
        notes: Optional[str] = None,
        **kwargs
    ) -> Contract:
        """
        Update an existing contract.

        Args:
            contract_id: Contract ID to update
            (other args same as create_contract)

        Returns:
            Updated Contract instance

        Raises:
            ValidationError: If validation fails
        """
        contract = self.repository.get_by_id(contract_id)
        if not contract:
            raise ValidationError(f"Contract with ID '{contract_id}' not found")

        update_data = {}

        # Validate and prepare date updates
        if start_date is not None or end_date is not None:
            new_start = start_date if start_date is not None else contract.start_date
            new_end = end_date if end_date is not None else contract.end_date

            if new_end <= new_start:
                raise ValidationError("End date must be after start date")

            if start_date is not None:
                update_data['start_date'] = start_date
            if end_date is not None:
                update_data['end_date'] = end_date

        # Validate renewal date
        if renewal_date is not None:
            contract_start = start_date if start_date is not None else contract.start_date
            contract_end = end_date if end_date is not None else contract.end_date

            if renewal_date < contract_start or renewal_date > contract_end:
                raise ValidationError("Renewal date must fall within contract period")
            update_data['renewal_date'] = renewal_date

        # Validate billing rate
        if billing_rate is not None:
            if billing_rate < Decimal('0'):
                raise ValidationError("Billing rate cannot be negative")
            update_data['billing_rate'] = billing_rate

        # Add other fields
        if currency is not None:
            update_data['currency'] = currency
        if payment_frequency is not None:
            update_data['payment_frequency'] = payment_frequency
        if payment_terms is not None:
            update_data['payment_terms'] = payment_terms
        if is_renewable is not None:
            update_data['is_renewable'] = is_renewable
        if is_auto_renew is not None:
            update_data['is_auto_renew'] = is_auto_renew
        if document_url is not None:
            update_data['document_url'] = document_url
        if signed_by is not None:
            update_data['signed_by'] = signed_by
        if signed_at is not None:
            update_data['signed_at'] = signed_at
        if notes is not None:
            update_data['notes'] = notes

        update_data.update(kwargs)

        return self.repository.update(contract_id, **update_data)

    # Lifecycle Management

    @transaction.atomic
    def activate_contract(self, contract_id: str) -> Contract:
        """
        Activate a contract.

        Args:
            contract_id: Contract ID to activate

        Returns:
            Updated Contract instance

        Raises:
            ValidationError: If validation fails
        """
        contract = self.repository.get_by_id(contract_id)
        if not contract:
            raise ValidationError(f"Contract with ID '{contract_id}' not found")

        contract.activate()
        return contract

    @transaction.atomic
    def terminate_contract(self, contract_id: str, reason: str) -> Contract:
        """
        Terminate a contract.

        Args:
            contract_id: Contract ID to terminate
            reason: Termination reason (required)

        Returns:
            Updated Contract instance

        Raises:
            ValidationError: If validation fails
        """
        contract = self.repository.get_by_id(contract_id)
        if not contract:
            raise ValidationError(f"Contract with ID '{contract_id}' not found")

        if not reason:
            raise ValidationError("Termination reason is required")

        contract.terminate(reason)
        return contract

    @transaction.atomic
    def renew_contract(
        self,
        contract_id: str,
        new_end_date: date,
        new_billing_rate: Optional[Decimal] = None
    ) -> Contract:
        """
        Renew a contract.

        Args:
            contract_id: Contract ID to renew
            new_end_date: New expiration date
            new_billing_rate: Optional updated billing rate

        Returns:
            Updated Contract instance

        Raises:
            ValidationError: If validation fails
        """
        contract = self.repository.get_by_id(contract_id)
        if not contract:
            raise ValidationError(f"Contract with ID '{contract_id}' not found")

        if new_end_date <= contract.end_date:
            raise ValidationError("New end date must be after current end date")

        if new_billing_rate is not None and new_billing_rate < Decimal('0'):
            raise ValidationError("Billing rate cannot be negative")

        contract.renew(new_end_date, new_billing_rate)
        return contract

    @transaction.atomic
    def mark_expired(self, contract_id: str) -> Contract:
        """
        Mark contract as expired.

        Args:
            contract_id: Contract ID to mark as expired

        Returns:
            Updated Contract instance

        Raises:
            ValidationError: If validation fails
        """
        contract = self.repository.get_by_id(contract_id)
        if not contract:
            raise ValidationError(f"Contract with ID '{contract_id}' not found")

        contract.mark_expired()
        return contract

    # Payment Management

    @transaction.atomic
    def mark_paid(self, contract_id: str) -> Contract:
        """
        Mark contract payment as paid.

        Args:
            contract_id: Contract ID

        Returns:
            Updated Contract instance

        Raises:
            ValidationError: If validation fails
        """
        contract = self.repository.get_by_id(contract_id)
        if not contract:
            raise ValidationError(f"Contract with ID '{contract_id}' not found")

        contract.mark_paid()
        return contract

    @transaction.atomic
    def mark_overdue(self, contract_id: str) -> Contract:
        """
        Mark contract payment as overdue.

        Args:
            contract_id: Contract ID

        Returns:
            Updated Contract instance

        Raises:
            ValidationError: If validation fails
        """
        contract = self.repository.get_by_id(contract_id)
        if not contract:
            raise ValidationError(f"Contract with ID '{contract_id}' not found")

        contract.mark_overdue()
        return contract

    # Query Methods

    def get_client_contracts(self, client_id: str) -> List[Contract]:
        """Get all contracts for a client."""
        return list(self.repository.find_by_client(client_id))

    def get_active_contracts(self) -> List[Contract]:
        """Get all active contracts."""
        return list(self.repository.get_active_contracts())

    def get_expiring_soon(self, days: int = 30) -> List[Contract]:
        """Get contracts expiring within specified days."""
        return list(self.repository.get_expiring_soon(days))

    def get_pending_renewal(self) -> List[Contract]:
        """Get contracts pending renewal."""
        return list(self.repository.get_pending_renewal())

    def get_overdue_payments(self) -> List[Contract]:
        """Get contracts with overdue payments."""
        return list(self.repository.get_overdue_payment_contracts())

    def get_next_billing_due(self, days: int = 7) -> List[Contract]:
        """Get contracts with billing due soon."""
        return list(self.repository.get_next_billing_due(days))

    def search_contracts(
        self,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        is_renewable: Optional[bool] = None,
        is_auto_renew: Optional[bool] = None,
        start_date_from: Optional[date] = None,
        start_date_to: Optional[date] = None,
        end_date_from: Optional[date] = None,
        end_date_to: Optional[date] = None
    ) -> List[Contract]:
        """Search contracts with filters."""
        return list(self.repository.search_contracts(
            client_id=client_id,
            status=status,
            payment_status=payment_status,
            is_renewable=is_renewable,
            is_auto_renew=is_auto_renew,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
            end_date_from=end_date_from,
            end_date_to=end_date_to
        ))
