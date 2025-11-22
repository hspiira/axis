"""URL routing for Contracts app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.contracts.views import ContractViewSet

# Create router for ViewSets
router = DefaultRouter()
router.register(r'contracts', ContractViewSet, basename='contract')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

# Available endpoints:
# Contracts:
# GET    /api/contracts/                       - List all contracts
# POST   /api/contracts/                       - Create contract
# GET    /api/contracts/{id}/                  - Get contract details
# PUT    /api/contracts/{id}/                  - Update contract
# PATCH  /api/contracts/{id}/                  - Partially update contract
# DELETE /api/contracts/{id}/                  - Delete contract
# GET    /api/contracts/active/                - Get active contracts
# GET    /api/contracts/client/{client_id}/    - Get contracts by client
# GET    /api/contracts/expiring_soon/         - Get contracts expiring soon
# GET    /api/contracts/pending_renewal/       - Get contracts pending renewal
# GET    /api/contracts/overdue_payments/      - Get contracts with overdue payments
# GET    /api/contracts/billing_due/           - Get contracts with billing due
# GET    /api/contracts/search/                - Search contracts
# POST   /api/contracts/{id}/activate/         - Activate contract
# POST   /api/contracts/{id}/terminate/        - Terminate contract
# POST   /api/contracts/{id}/renew/            - Renew contract
# POST   /api/contracts/{id}/mark_expired/     - Mark contract as expired
# POST   /api/contracts/{id}/mark_paid/        - Mark payment as paid
# POST   /api/contracts/{id}/mark_overdue/     - Mark payment as overdue
