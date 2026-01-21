"""Service for Industry business logic."""
from typing import Optional, List, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from apps.clients.models import Industry
from apps.clients.repositories import IndustryRepository


class IndustryService(BaseService[Industry]):
    """
    Service for Industry business logic.

    Responsibilities:
    - Industry creation and management
    - Hierarchical relationship validation
    - Industry classification operations
    """

    repository_class = IndustryRepository

    # Create Operations

    @transaction.atomic
    def create_industry(
        self,
        name: str,
        code: Optional[str] = None,
        description: Optional[str] = None,
        parent_id: Optional[str] = None,
        external_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Industry:
        """
        Create a new industry.

        Args:
            name: Industry name (required)
            code: Classification code
            description: Industry description
            parent_id: Parent industry ID for hierarchy
            external_id: External system reference ID
            metadata: Additional attributes
            **kwargs: Additional fields

        Returns:
            Created Industry instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not name or not name.strip():
            raise ValidationError("Industry name cannot be empty")

        # Check for duplicate name
        if self.repository.find_by_name(name):
            raise ValidationError(f"Industry with name '{name}' already exists")

        # Check for duplicate code
        if code and self.repository.find_by_code(code):
            raise ValidationError(f"Industry with code '{code}' already exists")

        # Validate parent exists
        parent = None
        if parent_id:
            parent = self.repository.get_by_id(parent_id)
            if not parent:
                raise ValidationError(f"Parent industry with ID '{parent_id}' does not exist")

            # Prevent circular references
            if self._would_create_cycle(parent, None):
                raise ValidationError("Cannot create industry: would create circular reference")

        # Create industry
        industry_data = {
            'name': name.strip(),
            'code': code,
            'description': description,
            'parent': parent,
            'external_id': external_id,
            'metadata': metadata or {},
            **kwargs
        }

        return self.repository.create(**industry_data)

    # Update Operations

    @transaction.atomic
    def update_industry(
        self,
        industry_id: str,
        name: Optional[str] = None,
        code: Optional[str] = None,
        description: Optional[str] = None,
        parent_id: Optional[str] = None,
        external_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Industry:
        """
        Update an existing industry.

        Args:
            industry_id: Industry ID to update
            name: New name
            code: New code
            description: New description
            parent_id: New parent ID
            external_id: New external ID
            metadata: New metadata
            **kwargs: Additional fields to update

        Returns:
            Updated Industry instance

        Raises:
            ValidationError: If validation fails
        """
        industry = self.repository.get_by_id(industry_id)
        if not industry:
            raise ValidationError(f"Industry with ID '{industry_id}' not found")

        update_data = {}

        # Validate and prepare name update
        if name is not None:
            name = name.strip()
            if not name:
                raise ValidationError("Industry name cannot be empty")
            # Check for duplicate name (excluding current industry)
            existing = self.repository.find_by_name(name)
            if existing and existing.id != industry_id:
                raise ValidationError(f"Industry with name '{name}' already exists")
            update_data['name'] = name

        # Validate and prepare code update
        if code is not None:
            # Check for duplicate code (excluding current industry)
            existing = self.repository.find_by_code(code)
            if existing and existing.id != industry_id:
                raise ValidationError(f"Industry with code '{code}' already exists")
            update_data['code'] = code

        # Validate and prepare parent update
        if parent_id is not None:
            if parent_id == industry_id:
                raise ValidationError("Industry cannot be its own parent")

            parent = self.repository.get_by_id(parent_id)
            if not parent:
                raise ValidationError(f"Parent industry with ID '{parent_id}' does not exist")

            # Prevent circular references
            if self._would_create_cycle(parent, industry):
                raise ValidationError("Cannot update: would create circular reference in hierarchy")

            update_data['parent_id'] = parent_id

        # Add other fields
        if description is not None:
            update_data['description'] = description
        if external_id is not None:
            update_data['external_id'] = external_id
        if metadata is not None:
            update_data['metadata'] = metadata

        update_data.update(kwargs)

        return self.repository.update(industry_id, **update_data)

    # Business Logic Operations

    def get_industry_tree(self, root_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get industry hierarchy as tree structure.

        Args:
            root_id: Starting point for tree, None for full tree

        Returns:
            List of industries in tree structure with nested children
        """
        industries = self.repository.get_industry_tree(root_id)

        # Build tree structure
        tree_map = {}
        root_items = []

        for industry in industries:
            tree_map[industry.id] = {
                'id': industry.id,
                'name': industry.name,
                'code': industry.code,
                'parent_id': industry.parent_id,
                'children': []
            }

        for industry_id, industry_data in tree_map.items():
            parent_id = industry_data['parent_id']
            if parent_id and parent_id in tree_map:
                tree_map[parent_id]['children'].append(industry_data)
            else:
                root_items.append(industry_data)

        return root_items

    def get_descendants(self, industry_id: str) -> List[Industry]:
        """
        Get all descendant industries.

        Args:
            industry_id: Root industry ID

        Returns:
            List of descendant industries
        """
        descendant_ids = self.repository.get_descendants_ids(industry_id)
        return list(self.repository.get_queryset().filter(id__in=descendant_ids))

    def move_industry(self, industry_id: str, new_parent_id: Optional[str]) -> Industry:
        """
        Move industry to new parent in hierarchy.

        Args:
            industry_id: Industry to move
            new_parent_id: New parent ID, None to make root-level

        Returns:
            Updated Industry instance

        Raises:
            ValidationError: If move would create cycle
        """
        return self.update_industry(industry_id, parent_id=new_parent_id)

    # Helper Methods

    def _would_create_cycle(self, parent: Industry, child: Optional[Industry]) -> bool:
        """
        Check if setting parent would create circular reference.

        Args:
            parent: Proposed parent industry
            child: Child industry (None for new industry)

        Returns:
            True if would create cycle
        """
        if child is None:
            return False

        # Check if parent is descendant of child
        current = parent
        while current:
            if current.id == child.id:
                return True
            current = current.parent

        return False

    # Query Methods

    def search_industries(
        self,
        name: Optional[str] = None,
        code: Optional[str] = None,
        parent_id: Optional[str] = None,
        has_children: Optional[bool] = None
    ) -> List[Industry]:
        """
        Search industries with filters.

        Args:
            name: Partial name match
            code: Partial code match
            parent_id: Filter by parent
            has_children: Filter by presence of children

        Returns:
            List of matching industries
        """
        return list(self.repository.search_industries(
            name=name,
            code=code,
            parent_id=parent_id,
            has_children=has_children
        ))

    def get_root_industries(self) -> List[Industry]:
        """Get all top-level industries."""
        return list(self.repository.get_root_industries())

    def get_children(self, industry_id: str) -> List[Industry]:
        """Get direct children of industry."""
        return list(self.repository.get_children(industry_id))
