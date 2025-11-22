"""URL routing for KPIs app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.kpis.views import KPITypeViewSet, KPIViewSet, KPIAssignmentViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'kpi-types', KPITypeViewSet, basename='kpi-type')
router.register(r'kpis', KPIViewSet, basename='kpi')
router.register(r'kpi-assignments', KPIAssignmentViewSet, basename='kpi-assignment')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

# Available endpoints:
# KPI Types:
# GET    /api/kpi-types/                     - List all KPI types
# POST   /api/kpi-types/                     - Create KPI type
# GET    /api/kpi-types/{id}/                - Get KPI type details
# PUT    /api/kpi-types/{id}/                - Update KPI type (full)
# PATCH  /api/kpi-types/{id}/                - Update KPI type (partial)
# DELETE /api/kpi-types/{id}/                - Delete KPI type (soft)
#
# KPIs:
# GET    /api/kpis/                          - List all KPIs
# POST   /api/kpis/                          - Create KPI
# GET    /api/kpis/{id}/                     - Get KPI details
# PUT    /api/kpis/{id}/                     - Update KPI (full)
# PATCH  /api/kpis/{id}/                     - Update KPI (partial)
# DELETE /api/kpis/{id}/                     - Delete KPI (soft)
# GET    /api/kpis/public/                   - Get public KPIs
# GET    /api/kpis/global_kpis/              - Get global KPIs
# POST   /api/kpis/{id}/toggle_visibility/   - Toggle KPI visibility
#
# KPI Assignments:
# GET    /api/kpi-assignments/               - List all assignments
# POST   /api/kpi-assignments/               - Create assignment
# GET    /api/kpi-assignments/{id}/          - Get assignment details
# PUT    /api/kpi-assignments/{id}/          - Update assignment (full)
# PATCH  /api/kpi-assignments/{id}/          - Update assignment (partial)
# DELETE /api/kpi-assignments/{id}/          - Delete assignment (soft)
# GET    /api/kpi-assignments/active/        - Get active assignments
# POST   /api/kpi-assignments/{id}/record_measurement/  - Record measurement
# POST   /api/kpi-assignments/{id}/activate/            - Activate assignment
# POST   /api/kpi-assignments/{id}/complete/            - Complete assignment
# POST   /api/kpi-assignments/{id}/pause/               - Pause assignment
