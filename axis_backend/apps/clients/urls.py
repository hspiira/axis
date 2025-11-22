"""URL routing for Clients app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.clients.views import IndustryViewSet, ClientViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'industries', IndustryViewSet, basename='industry')
router.register(r'clients', ClientViewSet, basename='client')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
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
