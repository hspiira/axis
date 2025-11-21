"""URL routing for persons app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.persons.views import PersonViewSet

# Create router for ViewSet
router = DefaultRouter()
router.register(r'persons', PersonViewSet, basename='person')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

# Available endpoints:
# GET    /api/persons/                        - List all persons
# POST   /api/persons/                        - Create person (generic)
# GET    /api/persons/{id}/                   - Get person details
# PUT    /api/persons/{id}/                   - Update person (full)
# PATCH  /api/persons/{id}/                   - Update person (partial)
# DELETE /api/persons/{id}/                   - Delete person
#
# Custom actions:
# POST   /api/persons/create-employee/        - Create employee
# POST   /api/persons/create-dependent/       - Create dependent
# GET    /api/persons/eligible/               - List eligible persons
# GET    /api/persons/{id}/family/            - Get family members
# GET    /api/persons/by-client/{client_id}/  - Get employees by client
# POST   /api/persons/{id}/activate/          - Activate person
# POST   /api/persons/{id}/deactivate/        - Deactivate person
# POST   /api/persons/{id}/update-employment-status/ - Update employment status
