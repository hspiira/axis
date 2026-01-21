"""
Custom authentication views for JWT with cookies.

This module provides customized views for Django REST Framework Simple JWT
that store the refresh token in a secure, HTTP-only cookie, mitigating
the risk of XSS attacks.
"""
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

# In a production environment, you would want to set `secure=True`
# and `samesite='Lax'` or `'Strict'` for CSRF protection.
# For local development, `samesite='Lax'` and `secure=False` is fine.
COOKIE_SETTINGS = {
    'httponly': True,
    'samesite': 'Lax',
    'secure': not settings.DEBUG,  # True in production, False in development
    'path': '/api/auth/',
}

class CookieTokenObtainPairSerializer(TokenRefreshSerializer):
    """
    Custom serializer for obtaining token pairs.
    Doesn't include the refresh token in the response body.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims here if needed
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Remove refresh token from the response data
        del data['refresh']
        return data


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Custom view for obtaining token pairs.
    Sets the refresh token in an HTTP-only cookie.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            refresh_token = response.data.pop('refresh', None)
            if refresh_token:
                response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    **COOKIE_SETTINGS
                )
        return response


class CookieTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Custom serializer for refreshing tokens.
    Reads the refresh token from cookies instead of the request body.
    """
    refresh = None

    def validate(self, attrs):
        attrs['refresh'] = self.context['request'].COOKIES.get('refresh_token')
        if not attrs['refresh']:
            raise InvalidToken('No refresh token found in cookies.')
        
        return super().validate(attrs)


class CookieTokenRefreshView(TokenRefreshView):
    """
    Custom view for refreshing tokens.
    Reads the refresh token from cookies and, if successful,
    may also return a new refresh token in cookies.
    """
    serializer_class = CookieTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            # If token rotation is enabled, a new refresh token might be issued.
            # The default behavior of Simple JWT is to include it in the body,
            # so we pop it and set it in the cookie.
            if 'refresh' in response.data:
                refresh_token = response.data.pop('refresh')
                response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    **COOKIE_SETTINGS
                )
        return response

class LogoutView(APIView):
    """
    View for logging out a user by clearing the refresh token cookie.
    """
    def post(self, request, *args, **kwargs):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token', path=COOKIE_SETTINGS['path'])
        return response