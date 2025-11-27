# Bulk Upload Feature Review & Implementation

## Backend Status

### Persons/Employees
- ❌ **NO bulk upload endpoint exists** (NEEDS IMPLEMENTATION)
- ✅ Single employee creation: `POST /api/persons/create-employee/`
- ✅ Repository has `bulk_create` method (found in tests) but not exposed via API
- ✅ Single employee creation is atomic and well-structured

### Clients
- ❌ **NO bulk upload endpoint exists** (NEEDS IMPLEMENTATION)
- ✅ Single client creation: `POST /api/clients/` (standard create)
- ❌ No bulk_create method in repository
- ✅ Single client creation is atomic and well-structured

## Frontend Implementation Status

### ✅ Completed
1. **BulkUploadModal Component** (`axis_frontend/src/components/clients/BulkUploadModal.tsx`)
   - File upload with drag & drop
   - CSV/Excel parsing
   - Template download
   - Multi-step workflow (upload → preview → uploading → results)

2. **BulkUploadPreview Component** (`axis_frontend/src/components/clients/BulkUploadPreview.tsx`)
   - Data preview table
   - Validation error display
   - Inline editing capability
   - Summary statistics

3. **BulkUploadProgress Component** (`axis_frontend/src/components/clients/BulkUploadProgress.tsx`)
   - Progress bar with percentage
   - Status messages

4. **BulkUploadResults Component** (`axis_frontend/src/components/clients/BulkUploadResults.tsx`)
   - Success/failure breakdown
   - Detailed error reporting
   - Download report functionality

5. **CSV Parser Utilities** (`axis_frontend/src/utils/csvParser.ts`)
   - CSV and Excel file parsing
   - Client and Employee row validation
   - Type definitions

### ⚠️ Pending
1. **Employee Bulk Upload Modal** - Similar component for employees (can reuse most logic)
2. **Backend API Integration** - Connect to actual bulk upload endpoints when available
3. **Integration into Pages** - Add bulk upload buttons to ClientsPage and PersonsPage

## Current Single Creation Review

### Employee Creation (`CreateEmployeeForm`)
**Fields:**
- Required: `client_id`, `full_name`
- Optional: `email`, `phone`, `date_of_birth`, `gender`, `address`, `city`, `country`
- Employment: `employee_department`, `employee_id_number`, `employment_status`, `employment_start_date`, `job_title`

**Process:**
1. Validates required fields
2. Creates User (inactive by default)
3. Creates Profile
4. Creates Person (CLIENT_EMPLOYEE type)
5. All wrapped in atomic transaction

### Client Creation (`ClientForm`)
**Fields:**
- Required: `name`
- Optional: `email`, `phone`, `website`, `address`, `billing_address`, `timezone`, `tax_id`
- Contact: `contact_person`, `contact_email`, `contact_phone`
- Classification: `industry_id`, `status`, `preferred_contact_method`, `is_verified`, `notes`

**Process:**
1. Multi-step form (5 steps)
2. Validates business rules (duplicate name/email/tax_id)
3. Creates Client with industry relationship
4. Atomic transaction

## Recommendations

### Backend Implementation Needed

1. **Persons Bulk Upload Endpoint**
   - `POST /api/persons/bulk-create-employees/`
   - Accept array of employee data
   - Process in batches with transaction rollback on errors
   - Return success/failure report

2. **Clients Bulk Upload Endpoint**
   - `POST /api/clients/bulk-create/`
   - Accept array of client data
   - Process in batches with transaction rollback on errors
   - Return success/failure report

### Frontend Design Requirements

1. **File Upload Support**
   - CSV/Excel file upload
   - Template download
   - File validation

2. **Data Preview**
   - Show parsed data before submission
   - Highlight validation errors
   - Allow editing before upload

3. **Progress Tracking**
   - Show upload progress
   - Display success/failure counts
   - Show detailed error messages

4. **Error Handling**
   - Row-level error reporting
   - Continue on partial failures
   - Retry failed rows

