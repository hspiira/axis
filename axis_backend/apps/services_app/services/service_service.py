"""Service for Service business logic."""
from typing import Optional, List
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from axis_backend.enums import BaseStatus
from apps.services_app.models import Service, ServiceCategory, ServiceProvider
from apps.services_app.repositories import ServiceRepository


class ServiceService(BaseService[Service]):
    """
    Service for Service business logic.

    Responsibilities:
    - Service creation and management
    - Status transitions and availability
    - Provider assignment
    """

    repository_class = ServiceRepository

    @transaction.atomic
    def create_service(
        self,
        name: str,
        category_id: str,
        description: Optional[str] = None,
        status: str = BaseStatus.ACTIVE,
        duration: Optional[int] = None,
        capacity: Optional[int] = None,
        prerequisites: Optional[str] = None,
        is_public: bool = True,
        price: Optional[Decimal] = None,
        service_provider_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> Service:
        """Create a new service."""
        if not name or not name.strip():
            raise ValidationError("Service name cannot be empty")

        # Validate category exists
        try:
            category = ServiceCategory.objects.get(id=category_id)
        except ServiceCategory.DoesNotExist:
            raise ValidationError(f"Category with ID '{category_id}' does not exist")

        # Validate provider if provided
        service_provider = None
        if service_provider_id:
            try:
                service_provider = ServiceProvider.objects.get(id=service_provider_id)
            except ServiceProvider.DoesNotExist:
                raise ValidationError(f"Provider with ID '{service_provider_id}' does not exist")

        # Validate numeric fields
        if duration is not None and duration < 1:
            raise ValidationError("Duration must be at least 1 minute")
        if capacity is not None and capacity < 1:
            raise ValidationError("Capacity must be at least 1")
        if price is not None and price < Decimal('0'):
            raise ValidationError("Price cannot be negative")

        service_data = {
            'name': name.strip(),
            'category': category,
            'description': description,
            'status': status,
            'duration': duration,
            'capacity': capacity,
            'prerequisites': prerequisites,
            'is_public': is_public,
            'price': price,
            'service_provider': service_provider,
            'metadata': metadata or {},
            **kwargs
        }

        return self.repository.create(**service_data)

    @transaction.atomic
    def update_service(
        self,
        service_id: str,
        name: Optional[str] = None,
        category_id: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
        duration: Optional[int] = None,
        capacity: Optional[int] = None,
        prerequisites: Optional[str] = None,
        is_public: Optional[bool] = None,
        price: Optional[Decimal] = None,
        service_provider_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> Service:
        """Update an existing service."""
        service = self.repository.get_by_id(service_id)
        if not service:
            raise ValidationError(f"Service with ID '{service_id}' not found")

        update_data = {}

        if name is not None:
            if not name.strip():
                raise ValidationError("Service name cannot be empty")
            update_data['name'] = name.strip()

        if category_id is not None:
            try:
                category = ServiceCategory.objects.get(id=category_id)
                update_data['category'] = category
            except ServiceCategory.DoesNotExist:
                raise ValidationError(f"Category with ID '{category_id}' does not exist")

        if service_provider_id is not None:
            try:
                provider = ServiceProvider.objects.get(id=service_provider_id)
                update_data['service_provider'] = provider
            except ServiceProvider.DoesNotExist:
                raise ValidationError(f"Provider with ID '{service_provider_id}' does not exist")

        if duration is not None and duration < 1:
            raise ValidationError("Duration must be at least 1 minute")
        if capacity is not None and capacity < 1:
            raise ValidationError("Capacity must be at least 1")
        if price is not None and price < Decimal('0'):
            raise ValidationError("Price cannot be negative")

        if description is not None:
            update_data['description'] = description
        if status is not None:
            update_data['status'] = status
        if duration is not None:
            update_data['duration'] = duration
        if capacity is not None:
            update_data['capacity'] = capacity
        if prerequisites is not None:
            update_data['prerequisites'] = prerequisites
        if is_public is not None:
            update_data['is_public'] = is_public
        if price is not None:
            update_data['price'] = price
        if metadata is not None:
            update_data['metadata'] = metadata

        update_data.update(kwargs)
        return self.repository.update(service_id, **update_data)

    @transaction.atomic
    def activate_service(self, service_id: str) -> Service:
        """Activate a service."""
        service = self.repository.get_by_id(service_id)
        if not service:
            raise ValidationError(f"Service with ID '{service_id}' not found")
        service.activate()
        return service

    @transaction.atomic
    def deactivate_service(self, service_id: str) -> Service:
        """Deactivate a service."""
        service = self.repository.get_by_id(service_id)
        if not service:
            raise ValidationError(f"Service with ID '{service_id}' not found")
        service.deactivate()
        return service

    def get_available_services(self) -> List[Service]:
        """Get all available services."""
        return list(self.repository.get_available_services())

    def get_catalog_services(self) -> List[Service]:
        """Get services available in public catalog."""
        return list(self.repository.get_catalog_services())

    def search_services(
        self,
        name: Optional[str] = None,
        category_id: Optional[str] = None,
        provider_id: Optional[str] = None,
        status: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_group: Optional[bool] = None,
        has_price: Optional[bool] = None
    ) -> List[Service]:
        """Search services with filters."""
        return list(self.repository.search_services(
            name=name,
            category_id=category_id,
            provider_id=provider_id,
            status=status,
            is_public=is_public,
            is_group=is_group,
            has_price=has_price
        ))
