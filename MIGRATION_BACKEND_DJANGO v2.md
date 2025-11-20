# Django Backend Migration Guide

**⚠️ MIGRATION STATUS: 10% COMPLETE (Project Structure Only)**

## Table of Contents
1. [Current Status](#current-status)
2. [Overview](#overview)
3. [Technology Stack](#technology-stack)
4. [Project Setup](#project-setup)
5. [Database Models Migration](#database-models-migration)
6. [Authentication System](#authentication-system)
7. [API Architecture](#api-architecture)
8. [Audit Logging](#audit-logging)
9. [Deployment](#deployment)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Current Status

### ✅ **Completed (Week 0)**
- [x] Django project scaffold created
- [x] 9 Django apps created (authentication, clients, contracts, services_app, staff, beneficiaries, documents, kpis, audit)
- [x] Settings configured (DRF, JWT, CORS, Redis, Celery)
- [x] Middleware set up (CORS, Auth, Audit)
- [x] Project structure established
- [x] **Client model implemented** (`apps/clients/models/client.py`) ✨ **NEW**

### ❌ **Not Started (Weeks 1-7)**
- [ ] **NO models implemented** (except Client) - All other model files are empty placeholders
- [ ] **NO views/serializers/repositories** - Only Django boilerplate exists
- [ ] **NO authentication** - Microsoft Entra ID not implemented
- [ ] **NO API endpoints** - No actual functionality
- [ ] **NO service/repository layers** - Clean architecture not implemented
- [ ] **NO tests** - No test files created
- [ ] **NO data migrations** - No Prisma → Django data migration

### 📊 **Statistics**
- **Total Python Files**: 81
- **Models Implemented**: 1/40+ (2.5%)
- **Apps Configured**: 9/9 (100%)
- **API Endpoints**: 0/100+ (0%)
- **Tests Written**: 0/200+ (0%)

---

## Overview

This guide covers migrating the AXIS EAP System backend from **Next.js API Routes** to **Django REST Framework**.

### Current Backend Stack (WORKING)
- Framework: **Next.js 15 API Routes** (407 TSX files, fully functional)
- ORM: **Prisma 6.8.2** (40+ models, 1244 lines of schema)
- Database: **PostgreSQL** (production data exists)
- Auth: **NextAuth.js 5** with Microsoft Entra ID
- Rate Limiting: **Upstash Redis**
- Frontend: **React 19**, **Tailwind CSS 4**

### Target Backend Stack (IN PROGRESS)
- Framework: **Django 5.0** + **Django REST Framework 3.14**
- ORM: **Django ORM** (needs translation from Prisma)
- Database: **PostgreSQL** (same database, needs migration)
- Auth: **Django Simple JWT** + **MSAL** (not implemented)
- Rate Limiting: **Django throttling** + Redis
- Frontend: **Vite** + **React 18** (to be migrated)

### Key Differences

| Feature | Next.js (Current) | Django (Target) | Status |
|---------|-------------------|-----------------|--------|
| Project Structure | ✅ App Router | ✅ Apps pattern | ✅ Done |
| ORM | ✅ Prisma | ❌ Django ORM | ❌ Needs implementation |
| API Routes | ✅ Next.js routes | ❌ DRF ViewSets | ❌ Needs implementation |
| Authentication | ✅ NextAuth | ❌ MSAL + JWT | ❌ Needs implementation |
| Models | ✅ 40+ Prisma models | ✅ 1/40 Django models | 🔶 2.5% complete |
| Clean Architecture | ❌ Direct DB access | ❌ Repository/Service pattern | ❌ Needs implementation |

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
django-redis==5.3  # NEW: Redis cache backend
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
pytest-cov==4.1  # Code coverage
black==23.12
flake8==6.1
isort==5.13  # Import sorting
mypy==1.7
django-debug-toolbar==4.2
factory-boy==3.3
faker==20.1
ipython==8.18  # Enhanced shell
```

---

## Project Setup

### Current Project Structure

```
axis_backend/  # ✅ EXISTS
├── manage.py
├── requirements.txt
├── .env  # ⚠️ CONFIGURE NEEDED
├── axis_backend/
│   ├── __init__.py
│   ├── settings/
│   │   ├── base.py  # ✅ CONFIGURED
│   │   ├── development.py  # ⚠️ NEEDS REVIEW
│   │   └── production.py  # ⚠️ NEEDS REVIEW
│   ├── urls.py  # ⚠️ NEEDS API ROUTES
│   ├── wsgi.py
│   ├── asgi.py
│   ├── enums/  # ❌ NEEDS CREATION
│   │   ├── __init__.py
│   │   └── choices.py  # All TextChoices enums
│   ├── models.py  # ⚠️ BaseModel needs enhancement
│   └── managers.py  # ❌ NEEDS CREATION (SoftDeleteManager)
├── apps/  # ✅ EXISTS (NEW STRUCTURE)
│   ├── authentication/  # ❌ EMPTY
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py  # ❌ NOT IMPLEMENTED
│   │   │   ├── profile.py  # ❌ NOT IMPLEMENTED
│   │   │   ├── account.py  # ❌ NOT IMPLEMENTED
│   │   │   ├── session.py  # ❌ NOT IMPLEMENTED
│   │   │   └── role.py  # ❌ NOT IMPLEMENTED
│   │   ├── services.py  # ❌ NOT IMPLEMENTED
│   │   ├── serializers.py  # ❌ NOT IMPLEMENTED
│   │   ├── views.py  # ❌ EMPTY
│   │   └── backends/
│   │       └── microsoft.py  # ❌ NOT IMPLEMENTED
│   ├── clients/  # 🔶 PARTIAL
│   │   ├── models/
│   │   │   ├── __init__.py  # ⚠️ NEEDS UPDATE
│   │   │   ├── client.py  # ✅ IMPLEMENTED
│   │   │   └── industry.py  # ❌ EMPTY
│   │   ├── repositories.py  # ❌ NOT IMPLEMENTED
│   │   ├── services.py  # ❌ NOT IMPLEMENTED
│   │   ├── serializers.py  # ❌ NOT IMPLEMENTED
│   │   ├── views.py  # ❌ EMPTY
│   │   └── filters.py  # ❌ NOT IMPLEMENTED
│   ├── contracts/  # ❌ EMPTY
│   ├── services_app/  # ❌ EMPTY
│   ├── staff/  # ❌ EMPTY
│   ├── beneficiaries/  # ❌ EMPTY
│   ├── documents/  # ❌ EMPTY
│   ├── kpis/  # ❌ EMPTY
│   └── audit/  # ❌ EMPTY
```

### Step 1: Verify Django Installation

```bash
cd /Users/piira/dev/old/axis/axis_backend

# Activate virtual environment (if exists)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Verify Django is installed
python -c "import django; print(django.get_version())"
# Expected: 5.0.x

# Verify project runs
python manage.py check
# Expected: System check identified no issues (0 silenced).
```

### Step 2: Create Missing Infrastructure Files

**See Implementation Roadmap section below for detailed steps.**

---

## Database Models Migration

### Prisma → Django Translation

**📚 Complete translation guide**: See `/PRISMA_TO_DJANGO_MAPPING.md`

### Source Schema Statistics

```
Prisma Schema: eapx/prisma/schema.prisma
- Total Lines: 1,244
- Total Models: 40+
- Total Enums: 25+
- Relationships: 100+
```

### Translation Progress

| Domain | Prisma Models | Django Models | Progress |
|--------|---------------|---------------|----------|
| **Authentication** | 7 (User, Profile, Account, Session, Role, Permission, UserRole) | 0/7 | ❌ 0% |
| **Core Business** | 3 (Client ✅, Industry, Contract) | 1/3 | 🔶 33% |
| **Services** | 7 (Service, Intervention, ServiceProvider, etc.) | 0/7 | ❌ 0% |
| **Staff/Beneficiary** | 2 (Staff, Beneficiary) | 0/2 | ❌ 0% |
| **Sessions** | 4 (CareSession, SessionFeedback, SessionForm, etc.) | 0/4 | ❌ 0% |
| **KPIs** | 3 (KPI, KPIType, KPIAssignment) | 0/3 | ❌ 0% |
| **Documents** | 1 (Document) | 0/1 | ❌ 0% |
| **Audit** | 4 (AuditLog, EntityChange, FieldChange, etc.) | 0/4 | ❌ 0% |
| **Support** | 9+ (EmergencyContact, CounselorAvailability, etc.) | 0/9 | ❌ 0% |
| **TOTAL** | **40+** | **1/40+** | **2.5%** |

### Base Model Implementation

**Current Status**: Basic BaseModel exists in `axis_backend/models.py`

**Needs Enhancement**:
- UUID primary key (currently may use default BigAutoField)
- Soft delete functionality
- Custom manager for soft delete
- Audit fields (created_at, updated_at, deleted_at)

**Example Implementation** (see PRISMA_TO_DJANGO_MAPPING.md for complete code):

```python
# axis_backend/models.py
import uuid
from django.db import models

class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted records"""
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class BaseModel(models.Model):
    """Abstract base model with UUID, timestamps, and soft delete"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()  # Default: excludes deleted
    all_objects = models.Manager()  # All records including deleted

    class Meta:
        abstract = True

    def soft_delete(self):
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])
```

### Enums Implementation

**Status**: ❌ **NOT CREATED**

**Location**: `axis_backend/enums/choices.py`

**Total Enums Needed**: 25+

```python
# Example enums (see PRISMA_TO_DJANGO_MAPPING.md for complete list)
from django.db import models

class BaseStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    PENDING = 'PENDING', 'Pending'
    ARCHIVED = 'ARCHIVED', 'Archived'
    DELETED = 'DELETED', 'Deleted'

class ContactMethod(models.TextChoices):
    EMAIL = 'EMAIL', 'Email'
    PHONE = 'PHONE', 'Phone'
    SMS = 'SMS', 'SMS'
    WHATSAPP = 'WHATSAPP', 'WhatsApp'
    OTHER = 'OTHER', 'Other'

# ... 23 more enums
```

### Implemented Model: Client ✅

**Location**: `apps/clients/models/client.py`

**Features**:
- ✅ All Prisma fields translated
- ✅ ForeignKey to Industry (not yet implemented)
- ✅ Proper indexes
- ✅ Business logic methods
- ✅ Django Meta configuration
- ✅ Help text on all fields
- ✅ Check constraints

**Prisma Reference**: `schema.prisma:330-370`

---

## Authentication System

**Status**: ❌ **NOT IMPLEMENTED**

### Required Components

1. **User Model** (`authentication/models/user.py`)
   - Extend Django's AbstractUser
   - Add UUID primary key
   - Add status field (ACTIVE, SUSPENDED, BANNED, etc.)
   - Add email verification fields
   - Add 2FA fields (optional)

2. **Microsoft Entra ID Backend** (`authentication/backends/microsoft.py`)
   - MSAL integration
   - Token verification
   - User creation/lookup
   - JWT token generation

3. **API Endpoints**
   - POST `/api/auth/login/microsoft/` - Login with Microsoft
   - POST `/api/auth/logout/` - Logout
   - POST `/api/auth/token/refresh/` - Refresh JWT
   - GET `/api/auth/me/` - Current user

### Microsoft Entra ID Configuration

**Required Environment Variables**:
```bash
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>
MICROSOFT_TENANT_ID=<your-tenant-id>
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Setup Steps**:
1. Register app in Azure Portal
2. Configure redirect URIs
3. Set up API permissions (User.Read, email, profile)
4. Generate client secret
5. Configure environment variables

---

## API Architecture

**Status**: ❌ **NOT IMPLEMENTED**

### Clean Architecture Pattern

```
HTTP Request
    ↓
View Layer (HTTP handling)
    ↓
Service Layer (Business logic)
    ↓
Repository Layer (Data access)
    ↓
Model Layer (Database)
```

### Layer Responsibilities

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **View** | HTTP request/response, authentication, validation | `ClientViewSet.create()` |
| **Service** | Business logic, orchestration, audit logging | `ClientService.create_client()` |
| **Repository** | Database queries, data access optimization | `ClientRepository.create()` |
| **Model** | Data structure, relationships, constraints | `Client` model |

### Implementation Status

| Module | Repository | Service | Serializer | View | Filter | Tests |
|--------|-----------|---------|-----------|------|--------|-------|
| **Clients** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Industries** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Contracts** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Beneficiaries** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Services** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sessions** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **KPIs** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Documents** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Total Progress**: 0/10 modules (0%)

---

## Audit Logging

**Status**: ❌ **NOT IMPLEMENTED**

### Required Components

1. **AuditLog Model** (`audit/models.py`)
   - Track all CRUD operations
   - Store user, IP, user agent
   - Store old/new data for changes

2. **AuditService** (`audit/services.py`)
   - Log creation helper
   - Entity history retrieval
   - User activity tracking

3. **AuditMiddleware** (`audit/middleware.py`)
   - Capture current user/request
   - Thread-local storage

4. **Signal Handlers** (`audit/signals.py`)
   - Auto-audit on save/delete
   - Register all models for auditing

---

## Deployment

**Status**: ⚠️ **PARTIALLY CONFIGURED**

### Docker Configuration

**Files Needed**:
- `Dockerfile` - ❌ Not created
- `docker-compose.yml` - ❌ Not created
- `.dockerignore` - ❌ Not created

### CI/CD Pipeline

**Files Needed**:
- `.github/workflows/django-ci.yml` - ❌ Not created
- `.github/workflows/deploy.yml` - ❌ Not created

---

## Implementation Roadmap

### Phase 0: Week 0 - Infrastructure Setup (CURRENT)

**Priority**: CRITICAL

**Tasks**:
1. ✅ **Create enums file**: `axis_backend/enums/choices.py` (25+ enums)
2. ✅ **Update BaseModel**: Add UUID, soft delete, managers
3. ✅ **Create managers**: `axis_backend/managers.py` (SoftDeleteManager)
4. ✅ **Update __init__ files**: Import models properly
5. ✅ **Create Industry model**: `apps/clients/models/industry.py`
6. ✅ **Run migrations**: `python manage.py makemigrations && python manage.py migrate`
7. ✅ **Test models**: Django shell verification

**Deliverables**:
- All infrastructure files created
- Client and Industry models working
- Migrations applied successfully
- Base model tested

---

### Phase 1: Weeks 1-2 - Authentication & Core Models

**Week 1: Authentication**
- [ ] User model (extend AbstractUser)
- [ ] Profile model
- [ ] Account model (OAuth)
- [ ] Session model
- [ ] Role & Permission models
- [ ] Microsoft Entra ID integration
- [ ] Auth endpoints
- [ ] Auth tests

**Week 2: Core Business Models**
- [ ] Contract model
- [ ] Service model
- [ ] ServiceProvider model
- [ ] Intervention model
- [ ] Migrations
- [ ] Admin configuration
- [ ] Model tests

---

### Phase 2: Weeks 3-4 - Staff, Beneficiaries, Sessions

**Week 3: Staff & Beneficiaries**
- [ ] Staff model
- [ ] Beneficiary model
- [ ] CareSession model
- [ ] SessionFeedback model
- [ ] Related models
- [ ] Migrations
- [ ] Tests

**Week 4: Support Models**
- [ ] Document model
- [ ] KPI models (KPI, KPIType, KPIAssignment)
- [ ] AuditLog model
- [ ] EntityChange model
- [ ] Migrations
- [ ] Tests

---

### Phase 3: Weeks 5-7 - Clean Architecture Layers

**Week 5: Repository Layer**
- [ ] All repository classes (10+ modules)
- [ ] Query optimization (select_related, prefetch_related)
- [ ] Repository tests

**Week 6: Service Layer**
- [ ] All service classes
- [ ] Business logic implementation
- [ ] Audit integration
- [ ] Service tests

**Week 7: API Layer**
- [ ] Serializers (List, Detail, Create/Update)
- [ ] ViewSets (all CRUD operations)
- [ ] Filters
- [ ] Permissions
- [ ] URL configuration
- [ ] Integration tests

---

### Phase 4: Weeks 8-9 - Testing & Documentation

**Week 8: Testing**
- [ ] Unit tests for all models (80%+ coverage)
- [ ] Integration tests for all APIs
- [ ] E2E tests (critical flows)
- [ ] Performance tests
- [ ] Fix failing tests

**Week 9: Documentation & Polish**
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Code documentation (docstrings)
- [ ] README updates
- [ ] Deployment guides
- [ ] Developer onboarding docs

---

## Testing Strategy

### Test Coverage Goals

| Layer | Target Coverage | Current Coverage |
|-------|----------------|------------------|
| Models | 90%+ | 0% |
| Services | 80%+ | 0% |
| Repositories | 80%+ | 0% |
| Views | 70%+ | 0% |
| Overall | 80%+ | 0% |

### Test Structure

```
apps/
├── clients/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_models.py
│   │   ├── test_repositories.py
│   │   ├── test_services.py
│   │   ├── test_views.py
│   │   └── test_filters.py
```

---

## Data Migration Strategy

### Option 1: Fresh Start (Recommended for Development)

```bash
# Drop and recreate database
dropdb axis_db
createdb axis_db

# Run Django migrations
python manage.py migrate

# Load seed data
python manage.py loaddata fixtures/initial_data.json
```

### Option 2: Migrate from Prisma Database

**Steps**:
1. Export data from Prisma database (SQL dump or custom script)
2. Transform data to match Django schema
3. Import into Django database
4. Verify data integrity

**Migration Script Template**:
```python
# scripts/migrate_from_prisma.py
import django
import psycopg2
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'axis_backend.settings.development')
django.setup()

from clients.models import Client, Industry

# Connect to old Prisma DB
old_db = psycopg2.connect(...)

# Migrate data
# ... (see PRISMA_TO_DJANGO_MAPPING.md for complete script)
```

---

## Common Commands

```bash
# Development
python manage.py runserver
python manage.py shell_plus  # Enhanced shell
python manage.py show_urls  # List all URLs

# Database
python manage.py makemigrations
python manage.py migrate
python manage.py dbshell  # PostgreSQL shell

# Testing
pytest
pytest --cov=apps --cov-report=html
pytest apps/clients/tests/

# Code Quality
black .
isort .
flake8 .
mypy .

# Admin
python manage.py createsuperuser
python manage.py changepassword <username>

# Data
python manage.py loaddata fixtures/initial_data.json
python manage.py dumpdata clients --indent=2 > fixtures/clients.json
```

---

## Summary

### Current Reality

- **Project Structure**: ✅ 100% complete
- **Settings**: ✅ 100% configured
- **Models**: 🔶 2.5% implemented (1/40)
- **API Endpoints**: ❌ 0% implemented
- **Authentication**: ❌ 0% implemented
- **Clean Architecture**: ❌ 0% implemented
- **Tests**: ❌ 0% written

### Next Immediate Steps

1. **Create infrastructure files** (enums, BaseModel, managers)
2. **Implement Industry model** (Client depends on it)
3. **Run migrations** for Client and Industry
4. **Test in Django shell** to verify models work
5. **Start authentication system** (Week 1 priority)

### Estimated Time to Complete

- **Infrastructure Setup**: 2-3 days
- **All Models**: 3-4 weeks
- **Clean Architecture Layers**: 3 weeks
- **Testing**: 2 weeks
- **Total**: **8-9 weeks** from now

**See `/MIGRATION_TIMELINE_CHECKLIST.md` for detailed week-by-week plan.**
