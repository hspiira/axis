"""Service for ServiceCategory business logic."""
from typing import Optional, List
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from apps.services_app.models import ServiceCategory
from apps.services_app.repositories import ServiceCategoryRepository


class ServiceCategoryService(BaseService[ServiceCategory]):
    """
    Service for ServiceCategory business logic.

    Responsibilities:
    - Category creation and management
    - Category validation and business rules
    """

    repository_class = ServiceCategoryRepository

    @transaction.atomic
    def create_category(
        self,
        name: str,
        description: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> ServiceCategory:
        """
        Create a new service category.

        Args:
            name: Category name (required)
            description: Category description
            metadata: Additional category attributes

        Returns:
            Created ServiceCategory instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate name
        if not name or not name.strip():
            raise ValidationError("Category name cannot be empty")

        # Check for duplicate name
        existing = self.repository.find_by_name(name.strip())
        if existing:
            raise ValidationError(f"Category with name '{name}' already exists")

        # Create category
        category_data = {
            'name': name.strip(),
            'description': description,
            'metadata': metadata or {}
        }

        return self.repository.create(**category_data)

    @transaction.atomic
    def update_category(
        self,
        category_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> ServiceCategory:
        """
        Update an existing category.

        Args:
            category_id: Category ID to update
            name: Updated name
            description: Updated description
            metadata: Updated metadata

        Returns:
            Updated ServiceCategory instance

        Raises:
            ValidationError: If validation fails
        """
        category = self.repository.get_by_id(category_id)
        if not category:
            raise ValidationError(f"Category with ID '{category_id}' not found")

        update_data = {}

        if name is not None:
            if not name.strip():
                raise ValidationError("Category name cannot be empty")
            # Check for duplicate name (excluding current category)
            existing = self.repository.find_by_name(name.strip())
            if existing and existing.id != category_id:
                raise ValidationError(f"Category with name '{name}' already exists")
            update_data['name'] = name.strip()

        if description is not None:
            update_data['description'] = description
        if metadata is not None:
            update_data['metadata'] = metadata

        return self.repository.update(category_id, **update_data)

    def search_categories(
        self,
        name: Optional[str] = None,
        has_services: Optional[bool] = None
    ) -> List[ServiceCategory]:
        """Search categories with filters."""
        return list(self.repository.search_categories(
            name=name,
            has_services=has_services
        ))
