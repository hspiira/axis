"""URL configuration for services_app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.services_app.views import (
    ServiceCategoryViewSet,
    ServiceViewSet,
    ServiceProviderViewSet,
    ServiceAssignmentViewSet,
    ServiceSessionViewSet,
    SessionFeedbackViewSet,
)

# Create router and register viewsets
router = DefaultRouter()

router.register(r'categories', ServiceCategoryViewSet, basename='service-category')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'providers', ServiceProviderViewSet, basename='service-provider')
router.register(r'assignments', ServiceAssignmentViewSet, basename='service-assignment')
router.register(r'sessions', ServiceSessionViewSet, basename='service-session')
router.register(r'feedback', SessionFeedbackViewSet, basename='session-feedback')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

"""
Available Endpoints:

Service Categories:
- GET    /api/services/categories/                     - List all service categories
- POST   /api/services/categories/                     - Create new category
- GET    /api/services/categories/{id}/                - Get category details
- PUT    /api/services/categories/{id}/                - Update category
- PATCH  /api/services/categories/{id}/                - Partial update category
- DELETE /api/services/categories/{id}/                - Delete category
- GET    /api/services/categories/with_services/       - Get categories with services
- GET    /api/services/categories/search/              - Search categories

Services:
- GET    /api/services/services/                       - List all services
- POST   /api/services/services/                       - Create new service
- GET    /api/services/services/{id}/                  - Get service details
- PUT    /api/services/services/{id}/                  - Update service
- PATCH  /api/services/services/{id}/                  - Partial update service
- DELETE /api/services/services/{id}/                  - Delete service
- GET    /api/services/services/available/             - Get available services
- GET    /api/services/services/catalog/               - Get catalog services
- GET    /api/services/services/search/                - Search services
- POST   /api/services/services/{id}/activate/         - Activate service
- POST   /api/services/services/{id}/deactivate/       - Deactivate service

Service Providers:
- GET    /api/services/providers/                      - List all providers
- POST   /api/services/providers/                      - Create new provider
- GET    /api/services/providers/{id}/                 - Get provider details
- PUT    /api/services/providers/{id}/                 - Update provider
- PATCH  /api/services/providers/{id}/                 - Partial update provider
- DELETE /api/services/providers/{id}/                 - Delete provider
- GET    /api/services/providers/available/            - Get available providers
- GET    /api/services/providers/search/               - Search providers
- POST   /api/services/providers/{id}/verify/          - Verify provider
- POST   /api/services/providers/{id}/update_rating/   - Update provider rating

Service Assignments:
- GET    /api/services/assignments/                    - List all assignments
- POST   /api/services/assignments/                    - Create new assignment
- GET    /api/services/assignments/{id}/               - Get assignment details
- PUT    /api/services/assignments/{id}/               - Update assignment
- PATCH  /api/services/assignments/{id}/               - Partial update assignment
- DELETE /api/services/assignments/{id}/               - Delete assignment
- GET    /api/services/assignments/current/            - Get current assignments
- GET    /api/services/assignments/client/{id}/        - Get assignments by client
- GET    /api/services/assignments/search/             - Search assignments

Service Sessions:
- GET    /api/services/sessions/                       - List all sessions
- POST   /api/services/sessions/                       - Create new session
- GET    /api/services/sessions/{id}/                  - Get session details
- PUT    /api/services/sessions/{id}/                  - Update session
- PATCH  /api/services/sessions/{id}/                  - Partial update session
- DELETE /api/services/sessions/{id}/                  - Delete session
- GET    /api/services/sessions/upcoming/              - Get upcoming sessions
- GET    /api/services/sessions/person/{id}/           - Get sessions by person
- GET    /api/services/sessions/search/                - Search sessions
- POST   /api/services/sessions/{id}/complete/         - Complete session
- POST   /api/services/sessions/{id}/cancel/           - Cancel session
- POST   /api/services/sessions/{id}/reschedule/       - Reschedule session

Session Feedback:
- GET    /api/services/feedback/                       - List all feedback
- POST   /api/services/feedback/                       - Create new feedback
- GET    /api/services/feedback/{id}/                  - Get feedback details
- PUT    /api/services/feedback/{id}/                  - Update feedback
- PATCH  /api/services/feedback/{id}/                  - Partial update feedback
- DELETE /api/services/feedback/{id}/                  - Delete feedback
- GET    /api/services/feedback/provider-rating/{id}/  - Get provider average rating
- GET    /api/services/feedback/service-rating/{id}/   - Get service average rating
- GET    /api/services/feedback/search/                - Search feedback
"""
