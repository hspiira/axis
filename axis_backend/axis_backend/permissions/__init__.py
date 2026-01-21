"""Custom permissions for API access control."""
from .base import (
    IsAdminOrManager,
    IsOwnerOrAdmin,
    CanManagePersons,
    CanManageDocuments,
    IsReadOnly
)
from .object import (
    IsOwnerOrReadOnly,
    IsClientScopedOrAdmin,
    IsConfidentialAllowed,
    CanModifyObject
)

__all__ = [
    # Base permissions
    'IsAdminOrManager',
    'IsOwnerOrAdmin',
    'CanManagePersons',
    'CanManageDocuments',
    'IsReadOnly',
    # Object-level permissions
    'IsOwnerOrReadOnly',
    'IsClientScopedOrAdmin',
    'IsConfidentialAllowed',
    'CanModifyObject',
]
