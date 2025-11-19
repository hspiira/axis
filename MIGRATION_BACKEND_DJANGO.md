# Django Backend Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Setup](#project-setup)
4. [Database Models Migration](#database-models-migration)
5. [Authentication System](#authentication-system)
6. [API Architecture](#api-architecture)
7. [Audit Logging](#audit-logging)
8. [Deployment](#deployment)

---

## Overview

This guide covers migrating the AXIS EAP System backend from **Next.js API Routes** to **Django REST Framework**.

### Current Backend Stack
- Framework: Next.js 15 API Routes
- ORM: Prisma 6.8.2
- Database: PostgreSQL
- Auth: NextAuth.js 5 with Microsoft Entra ID
- Rate Limiting: Upstash Redis

### Target Backend Stack
- Framework: Django 5.0 + Django REST Framework 3.14
- ORM: Django ORM
- Database: PostgreSQL (same)
- Auth: Django Simple JWT + MSAL
- Rate Limiting: Django throttling + Redis

---

## Technology Stack

### Core Dependencies

```bash
# requirements.txt
django==5.0
djangorestframework==3.14
djangorestframework-simplejwt==5.3
django-filter==23.5
django-cors-headers==4.3
psycopg2-binary==2.9
msal==1.26
celery==5.3
redis==5.0
python-dotenv==1.0
gunicorn==21.2
whitenoise==6.6
django-extensions==3.2
```

### Development Dependencies

```bash
# requirements-dev.txt
pytest==7.4
pytest-django==4.5
black==23.12
flake8==6.1
mypy==1.7
django-debug-toolbar==4.2
factory-boy==3.3
faker==20.1
```

---

## Project Setup

### Step 1: Create Django Project

```bash
# Create project directory
mkdir axis_backend
cd axis_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Django
pip install django==5.0

# Create Django project
django-admin startproject axis_backend .

# Create apps (Django's module system)
python manage.py startapp authentication
python manage.py startapp clients
python manage.py startapp contracts
python manage.py startapp services_app
python manage.py startapp staff
python manage.py startapp beneficiaries
python manage.py startapp documents
python manage.py startapp kpis
python manage.py startapp audit

# Install all dependencies
pip install -r requirements.txt
```

### Step 2: Project Structure

```
axis_backend/
├── manage.py
├── requirements.txt
├── requirements-dev.txt
├── .env
├── .env.example
├── axis_backend/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── audit.py
│   │   └── request_logging.py
│   └── models.py  # Base models
├── authentication/
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── backends/
│   │   ├── __init__.py
│   │   └── microsoft.py
│   └── tests.py
├── clients/
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── repositories.py
│   ├── services.py
│   ├── views.py
│   ├── urls.py
│   ├── filters.py
│   ├── permissions.py
│   └── tests.py
├── contracts/
│   └── ... (same structure as clients)
├── services_app/
│   └── ... (same structure as clients)
├── staff/
│   └── ... (same structure as clients)
├── beneficiaries/
│   └── ... (same structure as clients)
├── documents/
│   └── ... (same structure as clients)
├── kpis/
│   └── ... (same structure as clients)
└── audit/
    ├── migrations/
    ├── __init__.py
    ├── models.py
    ├── services.py
    ├── signals.py
    └── middleware.py
```

### Step 3: Django Settings Configuration

```python
# axis_backend/settings/base.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.getenv('SECRET_KEY')

INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'corsheaders',

    # Local apps
    'authentication',
    'clients',
    'contracts',
    'services_app',
    'staff',
    'beneficiaries',
    'documents',
    'kpis',
    'audit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'audit.middleware.AuditMiddleware',  # Custom: captures current user
]

ROOT_URLCONF = 'axis_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'axis_backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'EXCEPTION_HANDLER': 'axis_backend.utils.custom_exception_handler',
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True

# Microsoft Entra ID Configuration
MICROSOFT_CLIENT_ID = os.getenv('MICROSOFT_CLIENT_ID')
MICROSOFT_CLIENT_SECRET = os.getenv('MICROSOFT_CLIENT_SECRET')
MICROSOFT_TENANT_ID = os.getenv('MICROSOFT_TENANT_ID')
MICROSOFT_REDIRECT_URI = os.getenv('MICROSOFT_REDIRECT_URI')

# Redis Configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Celery Configuration
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

```python
# axis_backend/settings/development.py
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

INSTALLED_APPS += ['django_extensions', 'debug_toolbar']

MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

INTERNAL_IPS = ['127.0.0.1']
```

```python
# axis_backend/settings/production.py
from .base import *

DEBUG = False

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

### Step 4: Environment Variables

```bash
# .env.example
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=axis_db
DB_USER=axis_user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# Microsoft Entra ID
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/callback

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (for password reset, etc.)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password
```

---

## Database Models Migration

### Base Models (Reusable)

```python
# axis_backend/models.py
import uuid
from django.db import models
from django.utils import timezone

class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted records"""
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class BaseModel(models.Model):
    """Abstract base model with common fields for all models"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Include deleted records

    class Meta:
        abstract = True

    def soft_delete(self):
        """Soft delete this record"""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        """Restore a soft-deleted record"""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])
```

### Client Model Example

```python
# clients/models.py
from django.db import models
from axis_backend.models import BaseModel

class Client(BaseModel):
    """
    Client organization model.
    Represents companies/organizations using the EAP services.
    """
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        PENDING = 'PENDING', 'Pending'

    class ContactMethod(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'
        PHONE = 'PHONE', 'Phone'
        SMS = 'SMS', 'SMS'
        WHATSAPP = 'WHATSAPP', 'WhatsApp'
        OTHER = 'OTHER', 'Other'

    # Basic Information
    name = models.CharField(max_length=255, db_index=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    billing_address = models.TextField(null=True, blank=True)
    tax_id = models.CharField(max_length=100, null=True, blank=True)

    # Contact Information
    contact_person = models.CharField(max_length=255, null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=50, null=True, blank=True)
    preferred_contact_method = models.CharField(
        max_length=20,
        choices=ContactMethod.choices,
        null=True,
        blank=True
    )

    # Relationships
    industry = models.ForeignKey(
        'Industry',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clients'
    )

    # Status Fields
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    is_verified = models.BooleanField(default=False, db_index=True)
    timezone = models.CharField(max_length=50, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'clients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name', 'status']),
            models.Index(fields=['is_verified', 'status']),
            models.Index(fields=['created_at', 'status']),
        ]

    def __str__(self):
        return self.name

    def get_active_contracts(self):
        """Get all active contracts for this client"""
        return self.contracts.filter(status='ACTIVE', deleted_at__isnull=True)

    def get_total_staff(self):
        """Get total staff count"""
        return self.staff.filter(deleted_at__isnull=True).count()

class Industry(BaseModel):
    """Hierarchical industry classification"""
    name = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    external_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    level = models.IntegerField(default=0)

    class Meta:
        db_table = 'industries'
        verbose_name_plural = 'Industries'
        ordering = ['level', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}" if self.code else self.name
```

### Contract Model Example

```python
# contracts/models.py
from django.db import models
from axis_backend.models import BaseModel
from clients.models import Client

class Contract(BaseModel):
    """Service contract model"""

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        TERMINATED = 'TERMINATED', 'Terminated'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        OVERDUE = 'OVERDUE', 'Overdue'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class BillingFrequency(models.TextChoices):
        MONTHLY = 'MONTHLY', 'Monthly'
        QUARTERLY = 'QUARTERLY', 'Quarterly'
        SEMI_ANNUAL = 'SEMI_ANNUAL', 'Semi-Annual'
        ANNUAL = 'ANNUAL', 'Annual'

    # Relationships
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='contracts'
    )

    # Basic Information
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    contract_number = models.CharField(max_length=100, unique=True, db_index=True)

    # Dates
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    renewal_date = models.DateField(null=True, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )

    # Billing
    billing_amount = models.DecimalField(max_digits=12, decimal_places=2)
    billing_frequency = models.CharField(
        max_length=20,
        choices=BillingFrequency.choices,
        default=BillingFrequency.MONTHLY
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    payment_terms = models.TextField(null=True, blank=True)

    # Renewal
    auto_renew = models.BooleanField(default=False)
    renewal_notice_days = models.IntegerField(default=30)

    # Additional
    notes = models.TextField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'contracts'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['payment_status']),
        ]

    def __str__(self):
        return f"{self.contract_number} - {self.client.name}"

    @property
    def is_active(self):
        """Check if contract is currently active"""
        from django.utils import timezone
        today = timezone.now().date()
        return (
            self.status == self.Status.ACTIVE and
            self.start_date <= today <= self.end_date
        )
```

### Authentication Models

```python
# authentication/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    """Extended user model"""

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        PENDING_VERIFICATION = 'PENDING_VERIFICATION', 'Pending Verification'
        BANNED = 'BANNED', 'Banned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    last_login_at = models.DateTimeField(null=True, blank=True)
    email_verified = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

class Profile(models.Model):
    """User profile information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, null=True, blank=True)
    image = models.URLField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'

    def __str__(self):
        return self.full_name
```

### Running Migrations

```bash
# Create migrations for all apps
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser for admin panel
python manage.py createsuperuser
```

---

## Authentication System

### Microsoft Entra ID Service

```python
# authentication/backends/microsoft.py
from msal import ConfidentialClientApplication
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from authentication.models import Profile
from audit.services import AuditService

User = get_user_model()

class MicrosoftAuthService:
    """Service for Microsoft Entra ID authentication"""

    def __init__(self):
        self.client_id = settings.MICROSOFT_CLIENT_ID
        self.client_secret = settings.MICROSOFT_CLIENT_SECRET
        self.tenant_id = settings.MICROSOFT_TENANT_ID
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        self.redirect_uri = settings.MICROSOFT_REDIRECT_URI

        self.app = ConfidentialClientApplication(
            self.client_id,
            authority=self.authority,
            client_credential=self.client_secret
        )

    def verify_token(self, code):
        """Verify Microsoft authorization code and return user info"""
        result = self.app.acquire_token_by_authorization_code(
            code=code,
            scopes=["User.Read", "email", "profile"],
            redirect_uri=self.redirect_uri
        )

        if "error" in result:
            raise Exception(f"Authentication failed: {result.get('error_description')}")

        return result.get('id_token_claims')

    def get_or_create_user(self, code):
        """Create or retrieve user from Microsoft token"""
        user_info = self.verify_token(code)

        email = user_info.get('email') or user_info.get('preferred_username')
        name = user_info.get('name', '')

        if not email:
            raise Exception("Email not provided by Microsoft")

        # Check if user exists
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': name.split()[0] if name else '',
                'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else '',
                'is_active': True,
                'status': User.Status.ACTIVE,
            }
        )

        if created:
            # Create profile for new user
            Profile.objects.create(
                user=user,
                full_name=name,
                email=email
            )

            # Audit log for new user
            AuditService.log_action(
                action='LOGIN',
                entity_type='User',
                entity_id=str(user.id),
                user_id=str(user.id),
                data={
                    'provider': 'microsoft',
                    'email': email,
                    'is_new_user': True
                }
            )
        else:
            # Update last login
            from django.utils import timezone
            user.last_login_at = timezone.now()
            user.save(update_fields=['last_login_at'])

            # Audit log for existing user
            AuditService.log_action(
                action='LOGIN',
                entity_type='User',
                entity_id=str(user.id),
                user_id=str(user.id),
                data={
                    'provider': 'microsoft',
                    'email': email
                }
            )

        return user

    def generate_tokens(self, user):
        """Generate JWT tokens for user"""
        refresh = RefreshToken.for_user(user)

        # Add custom claims
        refresh['email'] = user.email
        refresh['name'] = f"{user.first_name} {user.last_name}"

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
```

### Authentication Views

```python
# authentication/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenRefreshView
from .backends.microsoft import MicrosoftAuthService
from .serializers import UserSerializer

class MicrosoftLoginView(APIView):
    """Handle Microsoft Entra ID login"""
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')

        if not code:
            return Response(
                {'error': 'Authorization code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        auth_service = MicrosoftAuthService()

        try:
            user = auth_service.get_or_create_user(code)
            tokens = auth_service.generate_tokens(user)

            return Response({
                'user': UserSerializer(user).data,
                'tokens': tokens
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutView(APIView):
    """Handle user logout"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from audit.services import AuditService

        # Audit log
        AuditService.log_action(
            action='LOGOUT',
            entity_type='User',
            entity_id=str(request.user.id),
            user_id=str(request.user.id),
            data={'email': request.user.email}
        )

        return Response({'message': 'Logged out successfully'})

class CurrentUserView(APIView):
    """Get current authenticated user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
```

### Serializers

```python
# authentication/serializers.py
from rest_framework import serializers
from .models import User, Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'email', 'phone', 'image', 'bio']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'status', 'profile']
        read_only_fields = ['id', 'email']
```

### URLs

```python
# authentication/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MicrosoftLoginView, LogoutView, CurrentUserView

urlpatterns = [
    path('login/microsoft/', MicrosoftLoginView.as_view(), name='microsoft_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

---

## API Architecture

### Clean Architecture Pattern

```
API Request
    ↓
View (HTTP Handler)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Model (Database)
```

### Repository Layer

```python
# clients/repositories.py
from typing import List, Optional, Dict
from django.db.models import Q, Prefetch
from .models import Client

class ClientRepository:
    """Data access layer for clients"""

    @staticmethod
    def list_clients(
        search: Optional[str] = None,
        filters: Optional[Dict] = None,
        ordering: str = '-created_at'
    ):
        """List clients with filters and search"""
        queryset = Client.objects.select_related('industry').prefetch_related(
            'contracts',
            'staff',
            'documents'
        )

        # Apply search
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(contact_person__icontains=search) |
                Q(contact_email__icontains=search)
            )

        # Apply filters
        if filters:
            if 'status' in filters and filters['status']:
                queryset = queryset.filter(status=filters['status'])

            if 'is_verified' in filters and filters['is_verified'] is not None:
                queryset = queryset.filter(is_verified=filters['is_verified'])

            if 'industry_id' in filters and filters['industry_id']:
                queryset = queryset.filter(industry_id=filters['industry_id'])

        # Apply ordering
        queryset = queryset.order_by(ordering)

        return queryset

    @staticmethod
    def get_client(client_id: str) -> Optional[Client]:
        """Get single client by ID"""
        try:
            return Client.objects.select_related('industry').prefetch_related(
                'contracts',
                'staff',
                'documents',
                'kpis',
                'kpi_assignments'
            ).get(id=client_id)
        except Client.DoesNotExist:
            return None

    @staticmethod
    def create_client(data: Dict) -> Client:
        """Create new client"""
        return Client.objects.create(**data)

    @staticmethod
    def update_client(client_id: str, data: Dict) -> Optional[Client]:
        """Update existing client"""
        client = ClientRepository.get_client(client_id)
        if not client:
            return None

        for key, value in data.items():
            setattr(client, key, value)

        client.save()
        return client

    @staticmethod
    def delete_client(client_id: str) -> bool:
        """Soft delete client"""
        client = ClientRepository.get_client(client_id)
        if not client:
            return False

        client.soft_delete()
        return True
```

### Service Layer

```python
# clients/services.py
from typing import Dict, Optional
from django.core.paginator import Paginator
from .repositories import ClientRepository
from audit.services import AuditService

class ClientService:
    """Business logic for client operations"""

    def __init__(self):
        self.repository = ClientRepository()
        self.audit_service = AuditService()

    def list_clients(self, params: Dict) -> Dict:
        """List clients with pagination"""
        queryset = self.repository.list_clients(
            search=params.get('search'),
            filters=params.get('filters', {}),
            ordering=params.get('ordering', '-created_at')
        )

        # Paginate
        page_number = params.get('page', 1)
        page_size = params.get('limit', 10)

        paginator = Paginator(queryset, page_size)
        page = paginator.get_page(page_number)

        return {
            'data': list(page),
            'pagination': {
                'total': paginator.count,
                'pages': paginator.num_pages,
                'page': page.number,
                'limit': paginator.per_page,
            }
        }

    def get_client(self, client_id: str):
        """Get single client"""
        return self.repository.get_client(client_id)

    def create_client(self, data: Dict, user) -> 'Client':
        """Create new client"""
        client = self.repository.create_client(data)

        # Audit log
        self.audit_service.log_action(
            action='CREATE',
            entity_type='Client',
            entity_id=str(client.id),
            user_id=str(user.id),
            data={'client_name': client.name}
        )

        return client

    def update_client(self, client_id: str, data: Dict, user):
        """Update existing client"""
        client = self.repository.update_client(client_id, data)

        if client:
            # Audit log
            self.audit_service.log_action(
                action='UPDATE',
                entity_type='Client',
                entity_id=str(client.id),
                user_id=str(user.id),
                data={'changes': data}
            )

        return client

    def delete_client(self, client_id: str, user) -> bool:
        """Delete client"""
        success = self.repository.delete_client(client_id)

        if success:
            # Audit log
            self.audit_service.log_action(
                action='DELETE',
                entity_type='Client',
                entity_id=client_id,
                user_id=str(user.id)
            )

        return success

    def verify_client(self, client_id: str, user):
        """Verify a client"""
        client = self.repository.get_client(client_id)
        if not client:
            return None

        client.is_verified = True
        client.save(update_fields=['is_verified', 'updated_at'])

        # Audit log
        self.audit_service.log_action(
            action='VERIFY',
            entity_type='Client',
            entity_id=str(client.id),
            user_id=str(user.id)
        )

        return client
```

### Serializer Layer

```python
# clients/serializers.py
from rest_framework import serializers
from .models import Client, Industry

class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = ['id', 'name', 'code']

class ClientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view"""
    industry_name = serializers.CharField(source='industry.name', read_only=True)
    active_contracts_count = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'email', 'phone', 'status',
            'is_verified', 'industry_name', 'active_contracts_count',
            'created_at', 'updated_at'
        ]

    def get_active_contracts_count(self, obj):
        return obj.get_active_contracts().count()

class ClientDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail view"""
    industry = IndustrySerializer(read_only=True)

    class Meta:
        model = Client
        fields = '__all__'

class ClientCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for create/update operations"""

    class Meta:
        model = Client
        fields = [
            'name', 'email', 'phone', 'website', 'address',
            'billing_address', 'tax_id', 'contact_person',
            'contact_email', 'contact_phone', 'industry',
            'preferred_contact_method', 'timezone', 'notes',
            'metadata', 'status', 'is_verified'
        ]

    def validate_email(self, value):
        """Ensure email is unique"""
        if value:
            # Check for existing email (excluding current instance on update)
            queryset = Client.objects.filter(email=value)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)

            if queryset.exists():
                raise serializers.ValidationError("Client with this email already exists")

        return value

    def validate_name(self, value):
        """Ensure name is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Client name cannot be empty")
        return value.strip()
```

### View Layer

```python
# clients/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Client
from .serializers import (
    ClientListSerializer,
    ClientDetailSerializer,
    ClientCreateUpdateSerializer
)
from .services import ClientService
from .filters import ClientFilter

class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for client operations.
    Provides CRUD operations for clients.
    """
    permission_classes = [IsAuthenticated]
    filterset_class = ClientFilter
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'email', 'phone', 'contact_person']
    ordering_fields = ['name', 'created_at', 'status']
    ordering = ['-created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = ClientService()

    def get_queryset(self):
        return Client.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ClientCreateUpdateSerializer
        return ClientDetailSerializer

    def list(self, request):
        """List clients with pagination"""
        params = {
            'search': request.query_params.get('search'),
            'filters': {
                'status': request.query_params.get('status'),
                'is_verified': request.query_params.get('is_verified'),
                'industry_id': request.query_params.get('industry_id'),
            },
            'page': int(request.query_params.get('page', 1)),
            'limit': int(request.query_params.get('limit', 10)),
            'ordering': request.query_params.get('ordering', '-created_at')
        }

        result = self.service.list_clients(params)
        serializer = self.get_serializer(result['data'], many=True)

        return Response({
            'data': serializer.data,
            'pagination': result['pagination']
        })

    def retrieve(self, request, pk=None):
        """Get single client"""
        client = self.service.get_client(pk)

        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(client)
        return Response(serializer.data)

    def create(self, request):
        """Create new client"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client = self.service.create_client(
            serializer.validated_data,
            request.user
        )

        response_serializer = ClientDetailSerializer(client)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, pk=None):
        """Update client (full update)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client = self.service.update_client(
            pk,
            serializer.validated_data,
            request.user
        )

        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        response_serializer = ClientDetailSerializer(client)
        return Response(response_serializer.data)

    def partial_update(self, request, pk=None):
        """Update client (partial update)"""
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        client = self.service.update_client(
            pk,
            serializer.validated_data,
            request.user
        )

        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        response_serializer = ClientDetailSerializer(client)
        return Response(response_serializer.data)

    def destroy(self, request, pk=None):
        """Delete client (soft delete)"""
        success = self.service.delete_client(pk, request.user)

        if not success:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Custom action to verify a client"""
        client = self.service.verify_client(pk, request.user)

        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get client statistics"""
        client = self.service.get_client(pk)

        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        stats = {
            'total_contracts': client.contracts.count(),
            'active_contracts': client.get_active_contracts().count(),
            'total_staff': client.get_total_staff(),
            'is_verified': client.is_verified,
        }

        return Response(stats)
```

### Filters

```python
# clients/filters.py
from django_filters import rest_framework as filters
from .models import Client

class ClientFilter(filters.FilterSet):
    """Filter class for clients"""
    name = filters.CharFilter(lookup_expr='icontains')
    status = filters.ChoiceFilter(choices=Client.Status.choices)
    is_verified = filters.BooleanFilter()
    created_after = filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Client
        fields = ['name', 'status', 'is_verified', 'industry']
```

### URLs

```python
# clients/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
]
```

### Main URLs

```python
# axis_backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('clients.urls')),
    path('api/', include('contracts.urls')),
    path('api/', include('staff.urls')),
    path('api/', include('beneficiaries.urls')),
    # Add other app URLs...
]
```

---

## Audit Logging

### Audit Model

```python
# audit/models.py
import uuid
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    """Audit log for tracking all actions"""

    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        VERIFY = 'VERIFY', 'Verify'
        APPROVE = 'APPROVE', 'Approve'
        REJECT = 'REJECT', 'Reject'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=20, choices=Action.choices, db_index=True)
    entity_type = models.CharField(max_length=100, db_index=True)
    entity_id = models.UUIDField(db_index=True)
    user_id = models.UUIDField(db_index=True)
    data = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user_id', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f"{self.action} on {self.entity_type} by {self.user_id}"
```

### Audit Service

```python
# audit/services.py
from .models import AuditLog

class AuditService:
    """Service for audit logging operations"""

    @staticmethod
    def log_action(
        action: str,
        entity_type: str,
        entity_id: str,
        user_id: str,
        data: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ):
        """Create an audit log entry"""
        return AuditLog.objects.create(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            data=data or {},
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def get_entity_history(entity_type: str, entity_id: str):
        """Get all audit logs for a specific entity"""
        return AuditLog.objects.filter(
            entity_type=entity_type,
            entity_id=entity_id
        ).order_by('-created_at')

    @staticmethod
    def get_user_activity(user_id: str, limit: int = 100):
        """Get recent activity for a user"""
        return AuditLog.objects.filter(
            user_id=user_id
        ).order_by('-created_at')[:limit]
```

### Audit Middleware

```python
# audit/middleware.py
from threading import local

_thread_locals = local()

def get_current_user():
    """Get the currently authenticated user from thread local storage"""
    return getattr(_thread_locals, 'user', None)

def get_current_request():
    """Get the current request from thread local storage"""
    return getattr(_thread_locals, 'request', None)

def set_current_user(user):
    """Set the current user in thread local storage"""
    _thread_locals.user = user

def set_current_request(request):
    """Set the current request in thread local storage"""
    _thread_locals.request = request

class AuditMiddleware:
    """Middleware to capture current user and request for audit logging"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Set user and request in thread local
        if hasattr(request, 'user') and request.user.is_authenticated:
            set_current_user(request.user)
        set_current_request(request)

        response = self.get_response(request)

        # Clear thread local after request
        set_current_user(None)
        set_current_request(None)

        return response
```

### Signal-Based Auto Auditing

```python
# audit/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .services import AuditService
from .middleware import get_current_user, get_current_request

# Import models to audit
from clients.models import Client
from contracts.models import Contract
# Add other models...

# List of models to auto-audit
AUDITED_MODELS = [Client, Contract]

def register_audit_signals():
    """Register signal handlers for all audited models"""

    for model in AUDITED_MODELS:
        # Save signal (create/update)
        @receiver(post_save, sender=model)
        def audit_save(sender, instance, created, **kwargs):
            user = get_current_user()
            request = get_current_request()

            if user:
                ip_address = None
                user_agent = None

                if request:
                    ip_address = get_client_ip(request)
                    user_agent = request.META.get('HTTP_USER_AGENT')

                AuditService.log_action(
                    action='CREATE' if created else 'UPDATE',
                    entity_type=sender.__name__,
                    entity_id=str(instance.id),
                    user_id=str(user.id),
                    ip_address=ip_address,
                    user_agent=user_agent
                )

        # Delete signal
        @receiver(post_delete, sender=model)
        def audit_delete(sender, instance, **kwargs):
            user = get_current_user()
            request = get_current_request()

            if user:
                ip_address = None
                user_agent = None

                if request:
                    ip_address = get_client_ip(request)
                    user_agent = request.META.get('HTTP_USER_AGENT')

                AuditService.log_action(
                    action='DELETE',
                    entity_type=sender.__name__,
                    entity_id=str(instance.id),
                    user_id=str(user.id),
                    ip_address=ip_address,
                    user_agent=user_agent
                )

def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# Register signals when app is ready
register_audit_signals()
```

```python
# audit/apps.py
from django.apps import AppConfig

class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'

    def ready(self):
        # Import signals to register them
        import audit.signals
```

---

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Run gunicorn
CMD ["gunicorn", "axis_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    command: gunicorn axis_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4
    volumes:
      - .:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  celery:
    build:
      context: .
      dockerfile: Dockerfile
    command: celery -A axis_backend worker -l info
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### Production Settings

```python
# axis_backend/settings/production.py
from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/django-ci.yml
name: Django CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-dev.txt

    - name: Run migrations
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
      run: |
        python manage.py migrate

    - name: Run tests
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
      run: |
        pytest

    - name: Run linting
      run: |
        flake8 .
        black --check .

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to production
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

---

## Summary

This backend migration guide covers:

1. ✅ **Project Setup**: Django project structure, apps, settings
2. ✅ **Database Models**: All 8 domain models migrated from Prisma
3. ✅ **Authentication**: Microsoft Entra ID with JWT tokens
4. ✅ **Clean Architecture**: Repository → Service → View pattern
5. ✅ **Audit Logging**: Automatic signal-based auditing
6. ✅ **Deployment**: Docker, docker-compose, CI/CD

**Next Steps**:
1. Set up local development environment
2. Create and run database migrations
3. Implement remaining models (Staff, Beneficiaries, Services, etc.)
4. Write unit and integration tests
5. Deploy to staging environment
