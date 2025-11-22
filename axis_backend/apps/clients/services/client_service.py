"""Service for Client business logic."""
from typing import Optional, Any
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from axis_backend.enums import BaseStatus
from apps.clients.models import Client, Industry
from apps.clients.repositories import ClientRepository


class ClientService(BaseService[Client]):
    """
    Service for Client business logic.

    Responsibilities:
    - Client creation and management
    - Status transitions and verification
    - Contact information validation
    """

    repository_class = ClientRepository

    # Create Operations

    @transaction.atomic
    def create_client(
        self,
        name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        address: Optional[str] = None,
        billing_address: Optional[str] = None,
        timezone: Optional[str] = None,
        tax_id: Optional[str] = None,
        contact_person: Optional[str] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        industry_id: Optional[str] = None,
        status: str = BaseStatus.ACTIVE,
        preferred_contact_method: Optional[str] = None,
        is_verified: bool = False,
        notes: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        **kwargs
    ) -> Client:
        """
        Create a new client.

        Args:
            name: Client organization name (required)
            email: Primary email address
            phone: Primary phone number
            website: Website URL
            address: Physical address
            billing_address: Billing address
            timezone: IANA timezone identifier
            tax_id: Tax identification number
            contact_person: Primary contact person name
            contact_email: Contact person email
            contact_phone: Contact person phone
            industry_id: Industry classification ID
            status: Client status (default: ACTIVE)
            preferred_contact_method: Preferred communication method
            is_verified: Verification status
            notes: Internal notes
            metadata: Additional attributes
            **kwargs: Additional fields

        Returns:
            Created Client instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not name or not name.strip():
            raise ValidationError("Client name cannot be empty")

        # Check for duplicate name
        if self.repository.find_by_name(name.strip()):
            raise ValidationError(f"Client with name '{name}' already exists")

        # Validate at least one contact method for active clients
        if status == BaseStatus.ACTIVE:
            if not any([email, phone, contact_email, contact_phone]):
                raise ValidationError(
                    "Active clients must have at least one contact method (email or phone)"
                )

        # Check for duplicate email
        if email and self.repository.find_by_email(email):
            raise ValidationError(f"Client with email '{email}' already exists")

        # Check for duplicate tax ID
        if tax_id and self.repository.find_by_tax_id(tax_id):
            raise ValidationError(f"Client with tax ID '{tax_id}' already exists")

        # Validate industry exists
        industry = None
        if industry_id:
            try:
                industry = Industry.objects.get(id=industry_id)
            except Industry.DoesNotExist:
                raise ValidationError(f"Industry with ID '{industry_id}' does not exist")

        # Create client
        client_data = {
            'name': name.strip(),
            'email': email,
            'phone': phone,
            'website': website,
            'address': address,
            'billing_address': billing_address,
            'timezone': timezone,
            'tax_id': tax_id,
            'contact_person': contact_person,
            'contact_email': contact_email,
            'contact_phone': contact_phone,
            'industry': industry,
            'status': status,
            'preferred_contact_method': preferred_contact_method,
            'is_verified': is_verified,
            'notes': notes,
            'metadata': metadata or {},
            **kwargs
        }

        return self.repository.create(**client_data)

    # Update Operations

    @transaction.atomic
    def update_client(
        self,
        client_id: str,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        address: Optional[str] = None,
        billing_address: Optional[str] = None,
        timezone: Optional[str] = None,
        tax_id: Optional[str] = None,
        contact_person: Optional[str] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        industry_id: Optional[str] = None,
        status: Optional[str] = None,
        preferred_contact_method: Optional[str] = None,
        is_verified: Optional[bool] = None,
        notes: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        **kwargs
    ) -> Client:
        """
        Update an existing client.

        Args:
            client_id: Client ID to update
            (other args same as create_client)

        Returns:
            Updated Client instance

        Raises:
            ValidationError: If validation fails
        """
        client = self.repository.get_by_id(client_id)
        if not client:
            raise ValidationError(f"Client with ID '{client_id}' not found")

        update_data = {}

        # Validate and prepare name update
        if name is not None:
            name = name.strip()
            if not name:
                raise ValidationError("Client name cannot be empty")
            # Check for duplicate name (excluding current client)
            existing = self.repository.find_by_name(name)
            if existing and existing.id != client_id:
                raise ValidationError(f"Client with name '{name}' already exists")
            update_data['name'] = name

        # Validate and prepare email update
        if email is not None:
            # Check for duplicate email (excluding current client)
            existing = self.repository.find_by_email(email)
            if existing and existing.id != client_id:
                raise ValidationError(f"Client with email '{email}' already exists")
            update_data['email'] = email

        # Validate and prepare tax_id update
        if tax_id is not None:
            # Check for duplicate tax ID (excluding current client)
            existing = self.repository.find_by_tax_id(tax_id)
            if existing and existing.id != client_id:
                raise ValidationError(f"Client with tax ID '{tax_id}' already exists")
            update_data['tax_id'] = tax_id

        # Validate industry exists
        if industry_id is not None:
            try:
                industry = Industry.objects.get(id=industry_id)
                update_data['industry_id'] = industry
            except Industry.DoesNotExist:
                raise ValidationError(f"Industry with ID '{industry_id}' does not exist")

        # Validate contact methods for active status
        new_status = status if status is not None else client.status
        if new_status == BaseStatus.ACTIVE:
            new_email = email if email is not None else client.email
            new_phone = phone if phone is not None else client.phone
            new_contact_email = contact_email if contact_email is not None else client.contact_email
            new_contact_phone = contact_phone if contact_phone is not None else client.contact_phone

            if not any([new_email, new_phone, new_contact_email, new_contact_phone]):
                raise ValidationError(
                    "Active clients must have at least one contact method (email or phone)"
                )

        # Add other fields
        if phone is not None:
            update_data['phone'] = phone
        if website is not None:
            update_data['website'] = website
        if address is not None:
            update_data['address'] = address
        if billing_address is not None:
            update_data['billing_address'] = billing_address
        if timezone is not None:
            update_data['timezone'] = timezone
        if contact_person is not None:
            update_data['contact_person'] = contact_person
        if contact_email is not None:
            update_data['contact_email'] = contact_email
        if contact_phone is not None:
            update_data['contact_phone'] = contact_phone
        if status is not None:
            update_data['status'] = status
        if preferred_contact_method is not None:
            update_data['preferred_contact_method'] = preferred_contact_method
        if is_verified is not None:
            update_data['is_verified'] = is_verified
        if notes is not None:
            update_data['notes'] = notes
        if metadata is not None:
            update_data['metadata'] = metadata

        update_data.update(kwargs)

        return self.repository.update(client_id, **update_data)

    # Status Management

    @transaction.atomic
    def activate_client(self, client_id: str) -> Client:
        """
        Activate a client.

        Args:
            client_id: Client ID to activate

        Returns:
            Updated Client instance

        Raises:
            ValidationError: If validation fails
        """
        client = self.repository.get_by_id(client_id)
        if not client:
            raise ValidationError(f"Client with ID '{client_id}' not found")

        client.activate()
        return client

    @transaction.atomic
    def deactivate_client(self, client_id: str, reason: Optional[str] = None) -> Client:
        """
        Deactivate a client.

        Args:
            client_id: Client ID to deactivate
            reason: Reason for deactivation

        Returns:
            Updated Client instance

        Raises:
            ValidationError: If validation fails
        """
        client = self.repository.get_by_id(client_id)
        if not client:
            raise ValidationError(f"Client with ID '{client_id}' not found")

        client.deactivate(reason)
        return client

    @transaction.atomic
    def archive_client(self, client_id: str, reason: Optional[str] = None) -> Client:
        """
        Archive a client.

        Args:
            client_id: Client ID to archive
            reason: Reason for archival

        Returns:
            Updated Client instance

        Raises:
            ValidationError: If validation fails
        """
        client = self.repository.get_by_id(client_id)
        if not client:
            raise ValidationError(f"Client with ID '{client_id}' not found")

        client.archive(reason)
        return client

    @transaction.atomic
    def verify_client(self, client_id: str, verified_by: Optional[str] = None) -> Client:
        """
        Verify a client.

        Args:
            client_id: Client ID to verify
            verified_by: User ID performing verification

        Returns:
            Updated Client instance

        Raises:
            ValidationError: If validation fails
        """
        client = self.repository.get_by_id(client_id)
        if not client:
            raise ValidationError(f"Client with ID '{client_id}' not found")

        client.verify(verified_by)
        return client

    # Query Methods

    def search_clients(
        self,
        name: Optional[str] = None,
        email: Optional[str] = None,
        status: Optional[str] = None,
        industry_id: Optional[str] = None,
        is_verified: Optional[bool] = None,
        contact_method: Optional[str] = None
    ) -> list[Client]:
        """
        Search clients with filters.

        Args:
            name: Partial name match
            email: Email address match
            status: Client status
            industry_id: Industry filter
            is_verified: Verification status
            contact_method: Preferred contact method

        Returns:
            List of matching clients
        """
        return list(self.repository.search_clients(
            name=name,
            email=email,
            status=status,
            industry_id=industry_id,
            is_verified=is_verified,
            contact_method=contact_method
        ))

    def get_active_clients(self) -> list[Client]:
        """Get all active clients."""
        return list(self.repository.get_active_clients())

    def get_verified_clients(self) -> list[Client]:
        """Get all verified clients."""
        return list(self.repository.get_verified_clients())

    def get_clients_by_industry(self, industry_id: str) -> list[Client]:
        """Get clients in specific industry."""
        return list(self.repository.filter_by_industry(industry_id))

    def get_recent_clients(self, days: int = 30) -> list[Client]:
        """Get recently created clients."""
        return list(self.repository.get_recent_clients(days))

    def get_clients_needing_verification(self) -> list[Client]:
        """Get active unverified clients."""
        return list(self.repository.get_clients_needing_verification())
