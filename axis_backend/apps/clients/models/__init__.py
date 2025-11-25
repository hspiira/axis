"""Client management models."""
from .industry import Industry
from .client import Client
from .tag import ClientTag
from .contact import ClientContact
from .activity import ClientActivity

__all__ = [
    'Industry',
    'Client',
    'ClientTag',
    'ClientContact',
    'ClientActivity',
]
