"""URL routing for Audit app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.audit.views import AuditLogViewSet, EntityChangeViewSet, FieldChangeViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'entity-changes', EntityChangeViewSet, basename='entity-change')
router.register(r'field-changes', FieldChangeViewSet, basename='field-change')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

# Available endpoints:
# Audit Logs (Read-Only):
# GET    /api/audit-logs/                          - List all audit logs
# GET    /api/audit-logs/{id}/                     - Get audit log details
# GET    /api/audit-logs/user/{user_id}/           - Get user activity logs
# GET    /api/audit-logs/recent/                   - Get recent audit logs
#
# Entity Changes (Read-Only):
# GET    /api/entity-changes/                      - List all entity changes
# GET    /api/entity-changes/{id}/                 - Get entity change details
# GET    /api/entity-changes/entity/{type}/{id}/   - Get entity history
# GET    /api/entity-changes/recent/               - Get recent changes
# GET    /api/entity-changes/user/{user_id}/       - Get changes by user
#
# Field Changes (Read-Only):
# GET    /api/field-changes/                       - List all field changes
# GET    /api/field-changes/{id}/                  - Get field change details
# GET    /api/field-changes/entity-change/{id}/    - Get field changes by entity change
# GET    /api/field-changes/field-history/{type}/{id}/{field}/  - Get field history
