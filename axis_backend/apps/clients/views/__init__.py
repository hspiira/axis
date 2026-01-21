"""Views for Clients app."""
from .industry_viewset import IndustryViewSet
from .client_viewset import ClientViewSet
from .tag_view import ClientTagViewSet
from .contact_view import ClientContactViewSet
from .activity_view import ClientActivityViewSet

__all__ = [
    'ClientViewSet',
    'IndustryViewSet',
    'ClientTagViewSet',
    'ClientContactViewSet',
    'ClientActivityViewSet',
]
