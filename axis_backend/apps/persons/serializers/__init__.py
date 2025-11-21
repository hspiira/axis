"""Serializers for persons app."""
from .person_serializer import (
    PersonListSerializer,
    PersonDetailSerializer,
    PersonCreateSerializer,
    PersonUpdateSerializer,
    CreateEmployeeSerializer,
    CreateDependentSerializer,
)

__all__ = [
    'PersonListSerializer',
    'PersonDetailSerializer',
    'PersonCreateSerializer',
    'PersonUpdateSerializer',
    'CreateEmployeeSerializer',
    'CreateDependentSerializer',
]
