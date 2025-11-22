"""Custom permissions for API access control."""
from .base import (
    IsAdminOrManager,
    IsOwnerOrAdmin,
    CanManagePersons,
    CanManageDocuments,
    IsReadOnly
)

__all__ = [
    'IsAdminOrManager',
    'IsOwnerOrAdmin',
    'CanManagePersons',
    'CanManageDocuments',
    'IsReadOnly'
]
