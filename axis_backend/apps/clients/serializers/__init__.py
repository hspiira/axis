"""Serializers for Clients app."""
from .industry_serializer import (
    IndustryListSerializer,
    IndustryDetailSerializer,
    IndustryCreateSerializer,
    IndustryUpdateSerializer,
)
from .client_serializer import (
    ClientListSerializer,
    ClientDetailSerializer,
    ClientCreateSerializer,
    ClientUpdateSerializer,
)

__all__ = [
    'ClientCreateSerializer',
    'ClientDetailSerializer',
    'ClientListSerializer',
    'ClientUpdateSerializer',
    'IndustryDetailSerializer',
    'IndustryCreateSerializer',
    'IndustryListSerializer',
    'IndustryUpdateSerializer',
]
