"""Custom permissions for API access control."""
from .base import (
    IsAdminOrManager,
    IsOwnerOrAdmin,
    CanManagePersons,
    IsReadOnly
)

__all__ = [
    'IsAdminOrManager',
    'IsOwnerOrAdmin',
    'CanManagePersons',
    'IsReadOnly'
]
