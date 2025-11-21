"""Comprehensive tests for JWT authentication endpoints."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import User, Profile
from axis_backend.enums import UserStatus
from datetime import date


class TokenObtainPairTestCase(TestCase):
    """Test JWT token obtain (login) endpoint."""

    def setUp(self):
        """Set up API client and test user."""
        self.client = APIClient()
        self.url = reverse('token_obtain_pair')

        # Create active user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.user.status = UserStatus.ACTIVE
        self.user.save()

    def test_obtain_token_with_valid_credentials(self):
        """Test obtaining tokens with valid email and password."""
        response = self.client.post(self.url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(len(response.data['access']) > 0)
        self.assertTrue(len(response.data['refresh']) > 0)

    def test_obtain_token_with_invalid_password(self):
        """Test that invalid password returns 401."""
        response = self.client.post(self.url, {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_with_invalid_email(self):
        """Test that invalid email returns 401."""
        response = self.client.post(self.url, {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_with_missing_email(self):
        """Test that missing email returns 400."""
        response = self.client.post(self.url, {
            'password': 'testpass123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_with_missing_password(self):
        """Test that missing password returns 400."""
        response = self.client.post(self.url, {
            'email': 'test@example.com'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_with_empty_credentials(self):
        """Test that empty credentials return 400."""
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_with_inactive_user(self):
        """Test that inactive user cannot obtain tokens."""
        self.user.status = UserStatus.INACTIVE
        self.user.is_active = False  # Django's is_active field
        self.user.save()

        response = self.client.post(self.url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')

        # JWT will return 401 if user.is_active is False
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_for_superuser(self):
        """Test that superuser can obtain tokens."""
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )

        response = self.client.post(self.url, {
            'email': 'admin@example.com',
            'password': 'adminpass123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_response_structure(self):
        """Test that token response has correct structure."""
        response = self.client.post(self.url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.keys()), 2)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)


class TokenRefreshTestCase(TestCase):
    """Test JWT token refresh endpoint."""

    def setUp(self):
        """Set up API client, test user, and obtain tokens."""
        self.client = APIClient()
        self.refresh_url = reverse('token_refresh')
        self.obtain_url = reverse('token_obtain_pair')

        # Create active user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.user.status = UserStatus.ACTIVE
        self.user.save()

        # Obtain initial tokens
        response = self.client.post(self.obtain_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')

        self.refresh_token = response.data['refresh']
        self.access_token = response.data['access']

    def test_refresh_token_with_valid_refresh_token(self):
        """Test refreshing access token with valid refresh token."""
        response = self.client.post(self.refresh_url, {
            'refresh': self.refresh_token
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertTrue(len(response.data['access']) > 0)
        # New access token should be different from original
        self.assertNotEqual(response.data['access'], self.access_token)

    def test_refresh_token_with_invalid_refresh_token(self):
        """Test that invalid refresh token returns 401."""
        response = self.client.post(self.refresh_url, {
            'refresh': 'invalid_refresh_token'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_with_missing_refresh_token(self):
        """Test that missing refresh token returns 400."""
        response = self.client.post(self.refresh_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_token_with_access_token_instead(self):
        """Test that using access token for refresh returns 401."""
        response = self.client.post(self.refresh_url, {
            'refresh': self.access_token
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_multiple_times(self):
        """Test that refresh token can be used multiple times."""
        # First refresh
        response1 = self.client.post(self.refresh_url, {
            'refresh': self.refresh_token
        }, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        access_token_1 = response1.data['access']

        # Second refresh with same refresh token
        response2 = self.client.post(self.refresh_url, {
            'refresh': self.refresh_token
        }, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        access_token_2 = response2.data['access']

        # Both should succeed and produce different access tokens
        self.assertNotEqual(access_token_1, access_token_2)


class TokenVerifyTestCase(TestCase):
    """Test JWT token verify endpoint."""

    def setUp(self):
        """Set up API client, test user, and obtain tokens."""
        self.client = APIClient()
        self.verify_url = reverse('token_verify')
        self.obtain_url = reverse('token_obtain_pair')

        # Create active user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.user.status = UserStatus.ACTIVE
        self.user.save()

        # Obtain tokens
        response = self.client.post(self.obtain_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')

        self.access_token = response.data['access']
        self.refresh_token = response.data['refresh']

    def test_verify_valid_access_token(self):
        """Test verifying valid access token."""
        response = self.client.post(self.verify_url, {
            'token': self.access_token
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_valid_refresh_token(self):
        """Test verifying valid refresh token."""
        response = self.client.post(self.verify_url, {
            'token': self.refresh_token
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_invalid_token(self):
        """Test that invalid token returns 401."""
        response = self.client.post(self.verify_url, {
            'token': 'invalid_token'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_missing_token(self):
        """Test that missing token returns 400."""
        response = self.client.post(self.verify_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_empty_token(self):
        """Test that empty token returns 400 (bad request)."""
        response = self.client.post(self.verify_url, {
            'token': ''
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_malformed_token(self):
        """Test that malformed token returns 401."""
        response = self.client.post(self.verify_url, {
            'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthenticatedEndpointAccessTestCase(TestCase):
    """Test accessing protected endpoints with JWT tokens."""

    def setUp(self):
        """Set up API client, test user, and obtain tokens."""
        self.client = APIClient()
        self.obtain_url = reverse('token_obtain_pair')

        # Create active user with profile
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.user.status = UserStatus.ACTIVE
        self.user.save()

        self.profile = Profile.objects.create(
            user=self.user,
            full_name='Test User',
            dob=date(1990, 1, 1)
        )

        # Obtain tokens
        response = self.client.post(self.obtain_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')

        self.access_token = response.data['access']

    def test_access_protected_endpoint_without_token(self):
        """Test that protected endpoint returns 401 without token."""
        # Assuming /api/persons/ requires authentication
        response = self.client.get('/api/persons/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_protected_endpoint_with_valid_token(self):
        """Test accessing protected endpoint with valid access token."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/persons/')

        # Should not return 401
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_protected_endpoint_with_invalid_token(self):
        """Test that invalid token returns 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.get('/api/persons/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_protected_endpoint_with_malformed_header(self):
        """Test that malformed auth header returns 401."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.access_token}')
        response = self.client.get('/api/persons/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_protected_endpoint_without_bearer_prefix(self):
        """Test that missing 'Bearer' prefix returns 401."""
        self.client.credentials(HTTP_AUTHORIZATION=self.access_token)
        response = self.client.get('/api/persons/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class JWTAuthenticationWorkflowTestCase(TestCase):
    """Integration tests for complete JWT authentication workflow."""

    def setUp(self):
        """Set up API client and test user."""
        self.client = APIClient()
        self.obtain_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')
        self.verify_url = reverse('token_verify')

        # Create active user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.user.status = UserStatus.ACTIVE
        self.user.save()

    def test_complete_authentication_workflow(self):
        """Test complete workflow: obtain → use → refresh → verify."""
        # Step 1: Obtain tokens
        obtain_response = self.client.post(self.obtain_url, {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')

        self.assertEqual(obtain_response.status_code, status.HTTP_200_OK)
        access_token = obtain_response.data['access']
        refresh_token = obtain_response.data['refresh']

        # Step 2: Use access token to access protected endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        access_response = self.client.get('/api/persons/')
        self.assertNotEqual(access_response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Step 3: Refresh access token
        refresh_response = self.client.post(self.refresh_url, {
            'refresh': refresh_token
        }, format='json')

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        new_access_token = refresh_response.data['access']

        # Step 4: Verify new access token
        verify_response = self.client.post(self.verify_url, {
            'token': new_access_token
        }, format='json')

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)

        # Step 5: Use new access token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        final_response = self.client.get('/api/persons/')
        self.assertNotEqual(final_response.status_code, status.HTTP_401_UNAUTHORIZED)
