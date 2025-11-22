"""Repository for Industry model data access."""
from typing import Optional, List
from django.db.models import QuerySet, Q

from axis_backend.repositories.base import BaseRepository
from apps.clients.models import Industry


class IndustryRepository(BaseRepository[Industry]):
    """
    Repository for Industry model.

    Responsibilities:
    - Industry data access operations
    - Hierarchical queries (parent/child relationships)
    - Industry classification lookups
    """

    model = Industry

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with parent relationship optimized.

        Returns:
            QuerySet with select_related for parent
        """
        return super().get_queryset().select_related('parent')

    # Query Methods

    def find_by_name(self, name: str) -> Optional[Industry]:
        """Find industry by exact name match."""
        return self.get_queryset().filter(name=name).first()

    def find_by_code(self, code: str) -> Optional[Industry]:
        """Find industry by classification code."""
        return self.get_queryset().filter(code=code).first()

    def find_by_external_id(self, external_id: str) -> Optional[Industry]:
        """Find industry by external system ID."""
        return self.get_queryset().filter(external_id=external_id).first()

    def search_by_name(self, name: str) -> QuerySet:
        """Search industries by partial name match."""
        return self.get_queryset().filter(name__icontains=name)

    # Hierarchical Queries

    def get_root_industries(self) -> QuerySet:
        """Get all top-level industries (no parent)."""
        return self.get_queryset().filter(parent__isnull=True)

    def get_children(self, industry_id: str) -> QuerySet:
        """Get direct children of an industry."""
        return self.get_queryset().filter(parent_id=industry_id)

    def get_by_parent(self, parent_id: Optional[str]) -> QuerySet:
        """
        Get industries by parent ID.

        Args:
            parent_id: Parent industry ID, or None for root industries

        Returns:
            QuerySet of industries with specified parent
        """
        if parent_id is None:
            return self.get_root_industries()
        return self.get_queryset().filter(parent_id=parent_id)

    def get_descendants_ids(self, industry_id: str) -> List[str]:
        """
        Get all descendant industry IDs recursively.

        Args:
            industry_id: Root industry ID

        Returns:
            List of descendant industry IDs including the root
        """
        def collect_descendants(parent_id: str, collected: set) -> set:
            """Recursively collect descendant IDs."""
            collected.add(parent_id)
            children = self.get_queryset().filter(parent_id=parent_id).values_list('id', flat=True)
            for child_id in children:
                if child_id not in collected:  # Prevent infinite loops
                    collect_descendants(child_id, collected)
            return collected

        return list(collect_descendants(industry_id, set()))

    # Advanced Queries

    def search_industries(
        self,
        name: Optional[str] = None,
        code: Optional[str] = None,
        parent_id: Optional[str] = None,
        has_children: Optional[bool] = None
    ) -> QuerySet:
        """
        Advanced industry search with multiple filters.

        Args:
            name: Partial name match
            code: Partial code match
            parent_id: Filter by parent industry
            has_children: Filter by presence of children

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if name:
            queryset = queryset.filter(name__icontains=name)
        if code:
            queryset = queryset.filter(code__icontains=code)
        if parent_id is not None:
            queryset = queryset.filter(parent_id=parent_id)
        if has_children is not None:
            if has_children:
                queryset = queryset.filter(children__isnull=False).distinct()
            else:
                queryset = queryset.filter(children__isnull=True)

        return queryset

    def get_industry_tree(self, root_id: Optional[str] = None) -> QuerySet:
        """
        Get industries in tree structure.

        Args:
            root_id: Starting point for tree, None for full tree

        Returns:
            QuerySet ordered for tree traversal
        """
        if root_id:
            # Get all descendants
            descendant_ids = self.get_descendants_ids(root_id)
            return self.get_queryset().filter(id__in=descendant_ids).order_by('parent', 'name')

        # Return all industries ordered by hierarchy
        return self.get_queryset().order_by('parent', 'name')
