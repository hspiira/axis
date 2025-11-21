# Alchemy - EAP Management System

A comprehensive Employee Assistance Program (EAP) management system with Django REST Framework backend and modern architecture.

## Prerequisites

- Python 3.12+
- PostgreSQL 14+ (production) / SQLite (development)
- Redis (for Celery tasks)
- Git

## Tech Stack

### Backend (Current)
- **Framework**: Django 5.0
- **API**: Django REST Framework
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: JWT with Microsoft Entra ID integration
- **Task Queue**: Celery with Redis
- **Primary Keys**: CUID2 (Collision-resistant Universal IDs)

### Frontend (Legacy - Being Replaced)
- **Framework**: Next.js 15 with App Router
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

## Getting Started

### Backend Setup (axis_backend/)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd axis/axis_backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the axis_backend directory:
   ```env
   DJANGO_ENV=development  # or production
   SECRET_KEY=<your-secret-key>

   # Database (production only - development uses SQLite)
   DB_NAME=alchemy_db
   DB_USER=alchemy_user
   DB_PASSWORD=<password>
   DB_HOST=localhost
   DB_PORT=5432

   # Microsoft Entra ID
   MICROSOFT_CLIENT_ID=<client-id>
   MICROSOFT_CLIENT_SECRET=<client-secret>
   MICROSOFT_TENANT_ID=<tenant-id>
   MICROSOFT_REDIRECT_URI=<redirect-uri>

   # Redis
   REDIS_URL=redis://localhost:6379/0
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Run the development server:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000`.

## Project Structure

```
axis/
├── axis_backend/              # Django Backend
│   ├── axis_backend/          # Project configuration
│   │   ├── settings/          # Environment-based settings
│   │   │   ├── __init__.py   # Smart settings selection (DJANGO_ENV)
│   │   │   ├── base.py       # Shared settings
│   │   │   ├── development.py # Development (SQLite)
│   │   │   └── production.py # Production (PostgreSQL)
│   │   ├── enums/            # Centralized enumerations
│   │   │   └── choices.py    # All Django choice enums
│   │   ├── models/           # Base models
│   │   │   └── base.py       # BaseModel with CUID2 and soft delete
│   │   └── utils/            # Utilities
│   │       └── generators.py # CUID2 generator
│   ├── apps/
│   │   ├── authentication/   # User accounts and permissions
│   │   ├── clients/          # Client organizations
│   │   ├── contracts/        # Service contracts
│   │   ├── persons/          # Unified service recipients (employees & dependents)
│   │   ├── services_app/     # Service delivery
│   │   ├── kpis/             # Performance metrics
│   │   ├── documents/        # Document management
│   │   └── audit/            # Audit logging
│   └── manage.py
└── [frontend]/               # Frontend (legacy - to be updated)
```

## Available Commands

### Backend
- `python manage.py runserver` - Start development server
- `python manage.py migrate` - Run database migrations
- `python manage.py makemigrations` - Create new migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py test` - Run tests
- `python manage.py shell` - Django shell

### Frontend (Legacy)
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint

## Key Features

### Unified Person Model
Alchemy uses a type discriminator pattern to represent all EAP service recipients:

- **Employee**: Client organization employees with employment details
- **Dependent**: Family members linked to employees (spouse, child, parent)
- Conditional validation based on person type
- Automatic eligibility calculation through relationship chain
- Factory methods for type-safe creation

#### Creating a Person

**Employee:**
```python
from apps.persons.models import Person
from axis_backend.enums import StaffRole, WorkStatus
import datetime

employee = Person.create_employee(
    profile=profile,
    user=user,
    client=client,
    employee_role=StaffRole.MANAGER,
    employment_start_date=datetime.date(2020, 1, 1),
    employment_status=WorkStatus.ACTIVE
)
```

**Dependent:**
```python
from axis_backend.enums import RelationType

dependent = Person.create_dependent(
    profile=profile,
    user=user,
    primary_employee=employee,
    relationship_to_employee=RelationType.CHILD,
    guardian=guardian_user  # Required for minors
)
```

### SOLID Design Principles

The codebase follows SOLID principles:
- **Single Responsibility**: Each model has one clear purpose
- **Open/Closed**: Extensible through metadata and type discriminators
- **Liskov Substitution**: All models properly extend BaseModel
- **Interface Segregation**: User/Profile separation
- **Dependency Inversion**: Models depend on abstractions

### Soft Delete Pattern
All models inherit from `BaseModel` with:
- `deleted_at` field for marking deletions
- `SoftDeleteManager` excludes deleted records by default
- `all_objects` manager for accessing all records

### Role-Based Access Control (RBAC)

Django permissions system with custom roles:
- User management through Django admin
- Role and permission models in authentication app
- Granular permissions per model and action

## Database Models

### Core Entities

- **User**: Authentication with CUID2 primary keys
- **Profile**: Personal demographic information
- **Client**: Organizations subscribing to EAP services
- **Person**: Unified employees and dependents
- **Service**: Available EAP services
- **ServiceSession**: Service delivery sessions
- **Contract**: Client service agreements
- **KPI**: Performance metrics

### Entity Relationships

```
Client → Contract → KPI
  ↓
Person (Employee) → Person (Dependent)
  ↓                      ↓
ServiceSession ← Service ← ServiceProvider
  ↓
SessionFeedback
```

## API Documentation

API endpoints are available at:
- Development: `http://localhost:8000/api/`
- Admin panel: `http://localhost:8000/admin/`

### Authentication

The API uses JWT authentication:

```bash
# Obtain token
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "password"
}

# Use token in requests
GET /api/persons/
Authorization: Bearer <access_token>
```

## Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.persons

# Run with coverage
coverage run manage.py test
coverage report
```

## Development Workflow

1. Set `DJANGO_ENV=development` in `.env`
2. Development uses SQLite (no PostgreSQL needed)
3. Create feature branch from `main`
4. Write tests for new features
5. Follow SOLID principles and type hints
6. Submit pull request with comprehensive description

## Migration Guide

This project was migrated from Next.js/Prisma to Django:
- Old Staff and Beneficiary models → Unified Person model
- Prisma schema → Django models with migrations
- NextAuth → JWT with Django authentication
- See `MIGRATION_BACKEND_DJANGO v2.md` for details

## Contributing

1. Follow SOLID design principles
2. Write comprehensive docstrings
3. Add tests for new features
4. Use type hints where applicable
5. Keep migrations clean and reversible

## License

[License details to be added]

---

**Alchemy** - Transforming workplace wellness through intelligent EAP management.
