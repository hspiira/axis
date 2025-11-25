"""URL routing for Clients app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from apps.clients.views import (
    IndustryViewSet,
    ClientViewSet,
    ClientTagViewSet,
    ClientContactViewSet,
    ClientActivityViewSet,
)

# Create main router for top-level ViewSets
router = DefaultRouter()
router.register(r'industries', IndustryViewSet, basename='industry')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'tags', ClientTagViewSet, basename='tag')

# Create nested routers for client sub-resources
clients_router = routers.NestedDefaultRouter(router, r'clients', lookup='client')
clients_router.register(r'contacts', ClientContactViewSet, basename='client-contacts')
clients_router.register(r'activities', ClientActivityViewSet, basename='client-activities')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
    path('', include(clients_router.urls)),
]

# Available endpoints:
# Industries:
# GET    /api/industries/                          - List all industries
# POST   /api/industries/                          - Create industry
# GET    /api/industries/{id}/                     - Get industry details
# PUT    /api/industries/{id}/                     - Update industry
# PATCH  /api/industries/{id}/                     - Partially update industry
# DELETE /api/industries/{id}/                     - Delete industry
# GET    /api/industries/roots/                    - Get root industries
# GET    /api/industries/{id}/children/            - Get industry children
# GET    /api/industries/{id}/descendants/         - Get industry descendants
# GET    /api/industries/tree/                     - Get industry tree
# GET    /api/industries/{id}/subtree/             - Get industry subtree
# GET    /api/industries/search/                   - Search industries
#
# Clients:
# GET    /api/clients/                             - List all clients
# POST   /api/clients/                             - Create client
# GET    /api/clients/{id}/                        - Get client details
# PUT    /api/clients/{id}/                        - Update client
# PATCH  /api/clients/{id}/                        - Partially update client
# DELETE /api/clients/{id}/                        - Delete client
# GET    /api/clients/active/                      - Get active clients
# GET    /api/clients/verified/                    - Get verified clients
# GET    /api/clients/needs_verification/          - Get clients needing verification
# GET    /api/clients/recent/                      - Get recent clients
# GET    /api/clients/industry/{industry_id}/      - Get clients by industry
# GET    /api/clients/search/                      - Search clients
# POST   /api/clients/{id}/activate/               - Activate client
# POST   /api/clients/{id}/deactivate/             - Deactivate client
# POST   /api/clients/{id}/archive/                - Archive client
# POST   /api/clients/{id}/verify/                 - Verify client
#
# Tags:
# GET    /api/tags/                                - List all tags
# POST   /api/tags/                                - Create tag
# GET    /api/tags/{id}/                           - Get tag details
# PUT    /api/tags/{id}/                           - Update tag
# PATCH  /api/tags/{id}/                           - Partially update tag
# DELETE /api/tags/{id}/                           - Delete tag (not system tags)
# GET    /api/tags/stats/                          - Tag usage statistics
#
# Client Contacts (nested under clients):
# GET    /api/clients/{client_id}/contacts/        - List client contacts
# POST   /api/clients/{client_id}/contacts/        - Create contact
# GET    /api/clients/{client_id}/contacts/{id}/   - Get contact details
# PUT    /api/clients/{client_id}/contacts/{id}/   - Update contact
# PATCH  /api/clients/{client_id}/contacts/{id}/   - Partially update contact
# DELETE /api/clients/{client_id}/contacts/{id}/   - Delete contact
# POST   /api/clients/{client_id}/contacts/{id}/set_primary/ - Set as primary
# GET    /api/clients/{client_id}/contacts/primary/ - Get primary contact
#
# Client Activities (nested under clients):
# GET    /api/clients/{client_id}/activities/      - List client activities
# POST   /api/clients/{client_id}/activities/      - Create activity
# GET    /api/clients/{client_id}/activities/{id}/ - Get activity details
# PUT    /api/clients/{client_id}/activities/{id}/ - Update activity
# PATCH  /api/clients/{client_id}/activities/{id}/ - Partially update activity
# DELETE /api/clients/{client_id}/activities/{id}/ - Delete activity
# GET    /api/clients/{client_id}/activities/timeline/ - Activity timeline
# GET    /api/clients/{client_id}/activities/stats/ - Activity statistics
#
# NOTE: Client documents are managed through /api/documents/ endpoint
# Filter by client using: /api/documents/?client=<client_id>
