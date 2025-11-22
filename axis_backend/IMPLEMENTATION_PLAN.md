# Complete Implementation Plan: Repository → Service → API Pattern
## All Remaining Apps (Services, Documents, KPIs, Audit)

**Status**: In Progress  
**Created**: 2025-11-22  
**Total Components**: 52 files + 1,700 tests  
**Estimated Timeline**: 8 weeks

---

## Progress Tracker

### Completed ✅
- [x] Authentication app - Full stack (Repository → Service → API + 195 tests)
- [x] Clients app - Full stack (Repository → Service → API + 88 tests)
- [x] Contracts app - Full stack (Repository → Service → API + 49 tests)
- [x] Persons app - Full stack (Repository → Service → API + 49 tests)
- [x] Services app - Model tests only (186 tests)
- [x] Documents app - Model tests only (34 tests)

### In Progress 🔄
- [ ] Documents app - Repository → Service → API layers
- [ ] Services app - Repository → Service → API layers
- [ ] KPIs app - Repository → Service → API layers
- [ ] Audit app - Repository → Service → API layers

---

## Overview

Implement the complete 3-tier architecture for 4 remaining apps following the Persons app pattern:
1. **Repository Layer** - Data access abstraction
2. **Service Layer** - Business logic
3. **API Layer** - REST endpoints with DRF

**Total Components to Build**: 52 files across 4 apps

---

## App 1: Services App (Most Complex)

### Models (6)
1. ServiceCategory
2. Service  
3. ServiceProvider
4. ServiceAssignment
5. ServiceSession
6. SessionFeedback

### Repository Layer (6 files)

**`repositories/__init__.py`**
```python
from .service_category_repository import ServiceCategoryRepository
from .service_repository import ServiceRepository
from .service_provider_repository import ServiceProviderRepository
from .service_assignment_repository import ServiceAssignmentRepository
from .service_session_repository import ServiceSessionRepository
from .session_feedback_repository import SessionFeedbackRepository
```

**Key Methods Per Repository:**
- Standard CRUD: `get_by_id()`, `list()`, `create()`, `update()`, `delete()`, `exists()`
- Custom queries based on model relationships
- Filtering by status, dates, relationships
- Search functionality where applicable

**`service_category_repository.py`** (~150 lines)
- `get_by_name()` - Find by unique name
- `get_active_categories()` - Categories with active services
- `get_with_service_count()` - Annotate service counts

**`service_repository.py`** (~200 lines)
- `get_by_category()` - Services by category
- `get_active_services()` - Available services
- `search_services()` - Full-text search on name/description
- `get_group_services()` - Filter by session_type
- `get_with_assignments()` - Prefetch assignments

**`service_provider_repository.py`** (~200 lines)
- `get_by_type()` - Filter by provider type
- `get_available()` - Available providers
- `get_verified()` - Verified providers only
- `get_by_specialization()` - Filter by specializations
- `search_providers()` - Name/credentials search

**`service_assignment_repository.py`** (~200 lines)
- `get_by_person()` - Assignments for person
- `get_by_service()` - Assignments for service
- `get_active_assignments()` - Non-expired assignments
- `get_by_frequency()` - Filter by frequency
- `get_expiring_soon()` - Assignments expiring within days

**`service_session_repository.py`** (~250 lines)
- `get_by_person()` - Sessions for person
- `get_by_provider()` - Sessions for provider
- `get_by_assignment()` - Sessions for assignment
- `get_by_status()` - Filter by session status
- `get_by_date_range()` - Sessions in date range
- `get_upcoming()` - Future sessions
- `get_completed()` - Past completed sessions

**`session_feedback_repository.py`** (~150 lines)
- `get_by_session()` - Feedback for session
- `get_by_person()` - Person's feedback
- `get_by_rating()` - Filter by rating
- `get_average_rating()` - Calculate averages

### Service Layer (6 files)

**Key Responsibilities:**
- Business logic validation
- Transaction management  
- Event triggering
- Cross-entity operations

**`service_category_service.py`** (~200 lines)
- `create_category()` - Validate uniqueness
- `update_category()` - Update with validation
- `delete_category()` - Check for active services
- `get_category_statistics()` - Service counts, etc.

**`service_service.py`** (~300 lines)
- `create_service()` - Validate category, duration, capacity
- `update_service()` - Update with business rules
- `activate_service()` - Activate for assignments
- `deactivate_service()` - Check active assignments
- `assign_to_person()` - Create ServiceAssignment with validation
- `get_eligible_persons()` - Based on service requirements

**`service_provider_service.py`** (~300 lines)
- `create_provider()` - Validate credentials, specializations
- `update_provider()` - Update with verification checks
- `verify_provider()` - Verification workflow
- `update_availability()` - Manage availability
- `update_rating()` - Recalculate average rating
- `get_provider_statistics()` - Sessions, ratings, utilization

**`service_assignment_service.py`** (~300 lines)
- `create_assignment()` - Validate person eligibility, service availability
- `update_assignment()` - Modify frequency, sessions
- `complete_assignment()` - Mark complete with validation
- `cancel_assignment()` - Cancel with reason
- `check_eligibility()` - Business rules for eligibility
- `calculate_remaining_sessions()` - Track session usage

**`service_session_service.py`** (~400 lines)
- `create_session()` - Validate assignment, provider, date/time
- `update_session()` - Modify with constraints
- `complete_session()` - Mark complete with attendance
- `cancel_session()` - Cancel with reason, notify
- `reschedule_session()` - Change date/time with validation
- `mark_attendance()` - Record attendance
- `validate_session_eligibility()` - Check assignment limits

**`session_feedback_service.py`** (~200 lines)
- `create_feedback()` - Validate session completion
- `update_feedback()` - Modify feedback
- `get_session_feedback()` - Retrieve feedback
- `calculate_provider_rating()` - Update provider rating

### API Layer (6 ViewSets + 6 Serializers)

**Serializer Patterns:**
- Read serializers with relationships
- Write serializers with validation
- Nested serializers for related data
- Custom validation methods

**ViewSet Patterns:**
- Standard CRUD endpoints
- Custom actions for business operations
- Filtering, searching, pagination
- Permissions and authentication

### Testing (6 test files per layer)

**Repository Tests** (6 files, ~40 tests each = 240 tests)
**Service Tests** (6 files, ~50 tests each = 300 tests)
**API Tests** (6 files, ~30 tests each = 180 tests)

**Total Services App Tests**: ~720 new tests

---

## App 2: Documents App (Simplest) ⭐ START HERE

### Models (1)
1. Document

### Repository Layer (1 file)

**`document_repository.py`** (~200 lines)
- `get_by_type()` - Filter by document type
- `get_by_client()` - Client's documents
- `get_by_contract()` - Contract's documents
- `get_published()` - Published documents only
- `get_latest_versions()` - Latest version of each document
- `get_expiring_soon()` - Documents expiring within days
- `search_documents()` - Title/description search
- `get_by_uploader()` - Documents by user

### Service Layer (1 file)

**`document_service.py`** (~300 lines)
- `create_document()` - Upload with metadata
- `update_document()` - Update metadata
- `publish_document()` - Publish workflow
- `archive_document()` - Archive with validation
- `create_new_version()` - Version management
- `get_version_history()` - Retrieve all versions
- `check_expiry()` - Expiry validation
- `grant_access()` - Access control (future)
- `revoke_access()` - Remove access (future)

### API Layer (1 ViewSet + 1 Serializer)

**`document_serializer.py`** (~200 lines)
- `DocumentSerializer` - Full with uploader, client, contract
- `DocumentListSerializer` - List view
- `DocumentCreateSerializer` - Upload document
- `DocumentUpdateSerializer` - Update metadata
- `DocumentVersionSerializer` - Version info
- Validators: file_size, expiry_date

**`document_viewset.py`** (~300 lines)
- Standard CRUD
- Custom actions: publish, archive, create_version, version_history
- Filtering: type, status, client, contract, uploader, confidential, expiry
- Search: title, description, tags
- Nested routes: /clients/{id}/documents/, /contracts/{id}/documents/

### Testing

**Repository Tests**: ~40 tests
**Service Tests**: ~60 tests
**API Tests**: ~40 tests

**Total Documents App Tests**: ~140 new tests

---

## App 3: KPIs App

### Models (3)
1. KPIType
2. KPI
3. KPIAssignment

### Repository Layer (3 files)

**`kpi_type_repository.py`** (~150 lines)
**`kpi_repository.py`** (~200 lines)
**`kpi_assignment_repository.py`** (~200 lines)

### Service Layer (3 files)

**`kpi_type_service.py`** (~200 lines)
**`kpi_service.py`** (~300 lines)
**`kpi_assignment_service.py`** (~300 lines)

### API Layer (3 ViewSets + 3 Serializers)

**Serializers** (~150 lines each = 450 lines)
**ViewSets** (~200 lines each = 600 lines)

### Testing

**Total KPIs App Tests**: ~420 new tests

---

## App 4: Audit App

### Models (3)
1. AuditLog
2. EntityChange
3. FieldChange

### Repository Layer (3 files)

**`audit_log_repository.py`** (~200 lines)
**`entity_change_repository.py`** (~200 lines)
**`field_change_repository.py`** (~150 lines)

### Service Layer (3 files)

**`audit_log_service.py`** (~300 lines)
**`entity_change_service.py`** (~250 lines)
**`field_change_service.py`** (~200 lines)

### API Layer (3 ViewSets + 3 Serializers)

**Serializers** (~150 lines each = 450 lines)
**ViewSets** (~200 lines each = 600 lines)

### Testing

**Total Audit App Tests**: ~420 new tests

---

## Implementation Summary

### Total Components

| App | Repos | Services | Serializers | ViewSets | Total Files |
|-----|-------|----------|-------------|----------|-------------|
| Services | 6 | 6 | 6 | 6 | 24 + tests |
| Documents | 1 | 1 | 1 | 1 | 4 + tests |
| KPIs | 3 | 3 | 3 | 3 | 12 + tests |
| Audit | 3 | 3 | 3 | 3 | 12 + tests |
| **Total** | **13** | **13** | **13** | **13** | **52 + tests** |

### Total Testing

| App | Repo Tests | Service Tests | API Tests | Total |
|-----|------------|---------------|-----------|-------|
| Services | 240 | 300 | 180 | 720 |
| Documents | 40 | 60 | 40 | 140 |
| KPIs | 120 | 180 | 120 | 420 |
| Audit | 120 | 180 | 120 | 420 |
| **Total** | **520** | **720** | **460** | **1,700** |

### Estimated Lines of Code

- **Repository Layer**: ~6,000 lines
- **Service Layer**: ~9,000 lines
- **API Layer**: ~7,500 lines
- **Tests**: ~51,000 lines
- **Total**: ~73,500 lines

---

## Implementation Order (Recommended)

### Phase 1: Documents App (Simplest - 1 week) ⭐
**Why First**: Single model, straightforward logic, establishes patterns

1. Repository layer
2. Service layer (with versioning logic)
3. API layer (with upload handling)
4. Complete testing
5. Integration testing

**Deliverable**: Complete Documents CRUD with versioning

### Phase 2: Services App (Most Complex - 3 weeks)
**Why Second**: Core business logic, most relationships, sets standard for complex apps

1. ServiceCategory (simplest)
2. Service (depends on Category)
3. ServiceProvider (independent)
4. ServiceAssignment (depends on Service + Person)
5. ServiceSession (depends on Assignment + Provider)
6. SessionFeedback (depends on Session)

**Each component**: Repository → Service → API → Tests

**Deliverable**: Complete EAP service management system

### Phase 3: KPIs App (Medium - 2 weeks)
**Why Third**: Builds on Services patterns, adds metrics tracking

1. KPIType
2. KPI (depends on Type)
3. KPIAssignment (depends on KPI)

**Deliverable**: Complete KPI tracking and reporting

### Phase 4: Audit App (Medium - 2 weeks)
**Why Last**: Depends on all other apps being complete for comprehensive auditing

1. AuditLog
2. EntityChange (depends on AuditLog)
3. FieldChange (depends on EntityChange)

**Deliverable**: Complete audit trail system

**Total Timeline**: 8 weeks for complete implementation

---

## Success Criteria

### Per App

✅ All repositories implement BaseRepository interface  
✅ All services implement business logic validation  
✅ All APIs follow DRF best practices  
✅ 90%+ test coverage per layer  
✅ All tests passing  
✅ API documentation generated (drf-spectacular)  
✅ Proper error handling and logging  

### Overall

✅ Consistent patterns across all apps  
✅ Full CRUD functionality  
✅ Complex queries optimized (select_related, prefetch_related)  
✅ Business logic validated  
✅ Transaction management  
✅ API versioning support  
✅ Comprehensive test suite  

---

## Notes

- Follow existing patterns from Persons app
- Use BaseRepository and BaseService
- All tests use Django TestCase
- Proper tearDown with FK ordering
- Comprehensive validation at service layer
- DRF spectacular for API documentation

