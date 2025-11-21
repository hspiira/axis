"""URL routing for authentication app."""
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # JWT Token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

# Available endpoints:
# POST /api/auth/token/          - Get access & refresh tokens (login)
# POST /api/auth/token/refresh/  - Refresh access token
# POST /api/auth/token/verify/   - Verify token validity
