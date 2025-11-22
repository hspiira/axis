"""Service for ServiceProvider business logic."""
from typing import Optional, List
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from axis_backend.enums import ServiceProviderType, WorkStatus
from apps.services_app.models import ServiceProvider
from apps.services_app.repositories import ServiceProviderRepository


class ServiceProviderService(BaseService[ServiceProvider]):
    """
    Service for ServiceProvider business logic.

    Responsibilities:
    - Provider creation and management
    - Verification and rating management
    - Status transitions
    """

    repository_class = ServiceProviderRepository

    @transaction.atomic
    def create_provider(
        self,
        name: str,
        provider_type: str,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        location: Optional[str] = None,
        qualifications: Optional[list] = None,
        specializations: Optional[list] = None,
        availability: Optional[dict] = None,
        rating: Optional[float] = None,
        is_verified: bool = False,
        status: str = WorkStatus.ACTIVE,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> ServiceProvider:
        """Create a new service provider."""
        if not name or not name.strip():
            raise ValidationError("Provider name cannot be empty")

        # Validate provider type
        valid_types = [choice[0] for choice in ServiceProviderType.choices]
        if provider_type not in valid_types:
            raise ValidationError(f"Invalid provider type: {provider_type}")

        # Validate rating if provided
        if rating is not None and (rating < 0 or rating > 5):
            raise ValidationError("Rating must be between 0 and 5")

        # Check for duplicate email
        if contact_email and self.repository.find_by_email(contact_email):
            raise ValidationError(f"Provider with email '{contact_email}' already exists")

        provider_data = {
            'name': name.strip(),
            'type': provider_type,
            'contact_email': contact_email,
            'contact_phone': contact_phone,
            'location': location,
            'qualifications': qualifications or [],
            'specializations': specializations or [],
            'availability': availability,
            'rating': rating,
            'is_verified': is_verified,
            'status': status,
            'metadata': metadata or {},
            **kwargs
        }

        return self.repository.create(**provider_data)

    @transaction.atomic
    def update_provider(
        self,
        provider_id: str,
        name: Optional[str] = None,
        provider_type: Optional[str] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        location: Optional[str] = None,
        qualifications: Optional[list] = None,
        specializations: Optional[list] = None,
        availability: Optional[dict] = None,
        rating: Optional[float] = None,
        is_verified: Optional[bool] = None,
        status: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> ServiceProvider:
        """Update an existing provider."""
        provider = self.repository.get_by_id(provider_id)
        if not provider:
            raise ValidationError(f"Provider with ID '{provider_id}' not found")

        update_data = {}

        if name is not None:
            if not name.strip():
                raise ValidationError("Provider name cannot be empty")
            update_data['name'] = name.strip()

        if provider_type is not None:
            valid_types = [choice[0] for choice in ServiceProviderType.choices]
            if provider_type not in valid_types:
                raise ValidationError(f"Invalid provider type: {provider_type}")
            update_data['type'] = provider_type

        if rating is not None and (rating < 0 or rating > 5):
            raise ValidationError("Rating must be between 0 and 5")

        if contact_email is not None:
            existing = self.repository.find_by_email(contact_email)
            if existing and existing.id != provider_id:
                raise ValidationError(f"Provider with email '{contact_email}' already exists")
            update_data['contact_email'] = contact_email

        if contact_phone is not None:
            update_data['contact_phone'] = contact_phone
        if location is not None:
            update_data['location'] = location
        if qualifications is not None:
            update_data['qualifications'] = qualifications
        if specializations is not None:
            update_data['specializations'] = specializations
        if availability is not None:
            update_data['availability'] = availability
        if rating is not None:
            update_data['rating'] = rating
        if is_verified is not None:
            update_data['is_verified'] = is_verified
        if status is not None:
            update_data['status'] = status
        if metadata is not None:
            update_data['metadata'] = metadata

        update_data.update(kwargs)
        return self.repository.update(provider_id, **update_data)

    @transaction.atomic
    def verify_provider(self, provider_id: str) -> ServiceProvider:
        """Mark provider as verified."""
        provider = self.repository.get_by_id(provider_id)
        if not provider:
            raise ValidationError(f"Provider with ID '{provider_id}' not found")
        provider.verify()
        return provider

    @transaction.atomic
    def update_provider_rating(self, provider_id: str, new_rating: float) -> ServiceProvider:
        """Update provider rating."""
        provider = self.repository.get_by_id(provider_id)
        if not provider:
            raise ValidationError(f"Provider with ID '{provider_id}' not found")
        if new_rating < 0 or new_rating > 5:
            raise ValidationError("Rating must be between 0 and 5")
        provider.update_rating(new_rating)
        return provider

    def get_available_providers(self) -> List[ServiceProvider]:
        """Get providers that are active and verified."""
        return list(self.repository.get_available_providers())

    def search_providers(
        self,
        name: Optional[str] = None,
        provider_type: Optional[str] = None,
        status: Optional[str] = None,
        is_verified: Optional[bool] = None,
        location: Optional[str] = None,
        min_rating: Optional[float] = None
    ) -> List[ServiceProvider]:
        """Search providers with filters."""
        return list(self.repository.search_providers(
            name=name,
            provider_type=provider_type,
            status=status,
            is_verified=is_verified,
            location=location,
            min_rating=min_rating
        ))
