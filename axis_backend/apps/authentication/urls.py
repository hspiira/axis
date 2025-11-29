"""URL routing for authentication app."""
from django.urls import path
from .views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
)
from rest_framework_simplejwt.views import TokenVerifyView

urlpatterns = [
    # JWT Token endpoints using cookies
    path('token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
]

# Available endpoints:
# POST /api/auth/token/          - Get access token (refresh token is in cookie)
# POST /api/auth/token/refresh/  - Refresh access token (uses cookie)
# POST /api/auth/token/verify/   - Verify access token
# POST /api/auth/logout/         - Clear refresh token cookie
