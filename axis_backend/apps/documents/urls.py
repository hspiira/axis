"""URL routing for documents app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.documents.views import DocumentViewSet

# Create router for ViewSet
router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

# Available endpoints:
# GET    /api/documents/                          - List all documents
# POST   /api/documents/                          - Create document
# GET    /api/documents/{id}/                     - Get document details
# PUT    /api/documents/{id}/                     - Update document (full)
# PATCH  /api/documents/{id}/                     - Update document (partial)
# DELETE /api/documents/{id}/                     - Delete document (soft)
#
# Custom actions:
# POST   /api/documents/{id}/publish/             - Publish document
# POST   /api/documents/{id}/archive/             - Archive document
# POST   /api/documents/{id}/create-version/      - Create new version
# GET    /api/documents/{id}/version-history/     - Get version history
# GET    /api/documents/{id}/check-expiry/        - Check expiry status
# GET    /api/documents/expiring-soon/            - Get expiring documents
# GET    /api/documents/expired/                  - Get expired documents
# GET    /api/documents/published/                - Get published documents
# GET    /api/documents/latest-versions/          - Get latest versions
# GET    /api/documents/confidential/             - Get confidential documents
