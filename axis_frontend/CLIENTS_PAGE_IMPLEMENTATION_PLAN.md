# Clients Page Implementation Plan

## Backend Review Summary

### API Endpoints Available
- `GET /api/clients/` - List all clients
- `POST /api/clients/` - Create client
- `GET /api/clients/{id}/` - Get client details
- `PATCH /api/clients/{id}/` - Update client
- `DELETE /api/clients/{id}/` - Delete client (soft delete)
- `GET /api/clients/active/` - Get active clients
- `GET /api/clients/verified/` - Get verified clients
- `GET /api/clients/needs_verification/` - Get clients needing verification
- `GET /api/clients/recent/` - Get recent clients (with ?days=30)
- `GET /api/clients/industry/{industry_id}/` - Get clients by industry
- `GET /api/clients/search/` - Search with filters (name, email, status, industry_id, is_verified, contact_method)
- `POST /api/clients/{id}/activate/` - Activate client
- `POST /api/clients/{id}/deactivate/` - Deactivate client (with reason)
- `POST /api/clients/{id}/archive/` - Archive client (with reason)
- `POST /api/clients/{id}/verify/` - Verify client (with verified_by)

### Client Model Fields

#### List View (ClientListSerializer)
- `id` (string, CUID)
- `name` (string, required)
- `email` (string, nullable)
- `phone` (string, nullable)
- `industry_name` (string, nullable, from relationship)
- `status` (enum: Active, Inactive, Pending, Archived, Deleted)
- `is_verified` (boolean)
- `is_active` (boolean, computed)
- `created_at` (datetime)
- `updated_at` (datetime)

#### Detail View (ClientDetailSerializer)
All list fields plus:
- `website` (string, nullable)
- `address` (text, nullable)
- `billing_address` (text, nullable)
- `timezone` (string, nullable, IANA format)
- `tax_id` (string, nullable)
- `contact_person` (string, nullable)
- `contact_email` (string, nullable)
- `contact_phone` (string, nullable)
- `industry` (object: {id, name, code} or null)
- `preferred_contact_method` (enum: Email, Phone, SMS, WhatsApp, Other)
- `verified_status` (boolean, computed)
- `primary_contact` (object, computed)
- `notes` (text, nullable)
- `metadata` (JSON, nullable)

### Enums
- **BaseStatus**: Active, Inactive, Pending, Archived, Deleted
- **ContactMethod**: Email, Phone, SMS, WhatsApp, Other

### Industries
- `GET /api/industries/` - List all industries
- Industries have hierarchical structure (parent/children)
- Fields: id, name, code, description, parent, external_id, metadata

## Frontend Implementation Plan

### Phase 1: API & Types Updates

#### 1.1 Update Client Types
- [ ] Create comprehensive Client type matching DetailSerializer
- [ ] Create ClientList type for list view
- [ ] Create ClientFormData type for create/update
- [ ] Add Industry type
- [ ] Add enum types for BaseStatus and ContactMethod

#### 1.2 Extend API Client
- [ ] Add search endpoint with filters
- [ ] Add active/verified/needs_verification endpoints
- [ ] Add recent clients endpoint
- [ ] Add clients by industry endpoint
- [ ] Add status action endpoints (activate, deactivate, archive, verify)
- [ ] Add industries API endpoints

#### 1.3 Extend React Query Hooks
- [ ] Add useActiveClients hook
- [ ] Add useVerifiedClients hook
- [ ] Add useClientsNeedingVerification hook
- [ ] Add useRecentClients hook
- [ ] Add useClientsByIndustry hook
- [ ] Add useSearchClients hook
- [ ] Add useActivateClient hook
- [ ] Add useDeactivateClient hook
- [ ] Add useArchiveClient hook
- [ ] Add useVerifyClient hook
- [ ] Add useIndustries hook

### Phase 2: UI Components

#### 2.1 Client List Components
- [ ] **ClientsTable** - Main table component with:
  - Columns: Name, Email, Phone, Industry, Status, Verified, Created
  - Sortable columns
  - Row selection
  - Status badges with wellness colors
  - Verified indicator
  - Actions dropdown (View, Edit, Activate/Deactivate, Archive, Verify, Delete)
- [ ] **ClientCard** (optional alternative view)
- [ ] **ClientStatusBadge** - Color-coded status indicator
- [ ] **VerifiedBadge** - Verification status indicator

#### 2.2 Filtering & Search
- [ ] **ClientsFilters** - Filter panel with:
  - Search input (name, email)
  - Status filter (multi-select)
  - Industry filter (dropdown with search)
  - Verification status filter
  - Contact method filter
  - Clear filters button
- [ ] **IndustrySelector** - Dropdown with search for industry selection

#### 2.3 Client Form Components
- [ ] **ClientForm** - Main form component with sections:
  - Basic Information (name, email, phone, website)
  - Location (address, billing_address, timezone)
  - Contact Person (contact_person, contact_email, contact_phone)
  - Classification (industry, preferred_contact_method)
  - Financial (tax_id)
  - Status & Verification (status, is_verified)
  - Notes (notes field)
- [ ] **ClientFormModal** - Modal wrapper for create/edit
- [ ] Form validation matching backend rules

#### 2.4 Client Detail Components
- [ ] **ClientDetailView** - Detail page/modal with:
  - Header with name and status
  - Tabs or sections: Overview, Contact Info, Address, Notes
  - Action buttons (Edit, Activate/Deactivate, Archive, Verify)
- [ ] **ClientDetailModal** - Modal version for quick view

#### 2.5 Action Components
- [ ] **ClientActionsMenu** - Dropdown menu for client actions
- [ ] **StatusChangeModal** - Modal for status changes with reason field
- [ ] **VerifyClientModal** - Modal for verification with verified_by field
- [ ] **DeleteClientModal** - Confirmation modal for deletion

### Phase 3: Main Clients Page

#### 3.1 Page Layout
- [ ] Header section with:
  - Title (already handled by PageTitleContext)
  - "Add New Client" button
  - View toggle (Table/Grid) if implementing both
- [ ] Filters section (collapsible)
- [ ] Main content area with:
  - Loading state
  - Empty state
  - Error state
  - Client list/table
- [ ] Pagination (if backend supports it)

#### 3.2 State Management
- [ ] Filter state management
- [ ] Selected client state
- [ ] Modal open/close state
- [ ] Form state management

#### 3.3 Features
- [ ] Real-time search with debouncing
- [ ] Filter persistence (URL params or localStorage)
- [ ] Bulk actions (if needed)
- [ ] Export functionality (future)
- [ ] Keyboard shortcuts (future)

### Phase 4: Integration & Polish

#### 4.1 Error Handling
- [ ] API error handling
- [ ] Form validation errors
- [ ] Toast notifications for success/error
- [ ] Error boundaries

#### 4.2 Performance
- [ ] Virtual scrolling for large lists (if needed)
- [ ] Optimistic updates
- [ ] Cache management
- [ ] Debounced search

#### 4.3 Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Screen reader support
- [ ] Focus management

#### 4.4 Responsive Design
- [ ] Mobile-friendly table (cards on mobile)
- [ ] Responsive modals
- [ ] Touch-friendly interactions

## Implementation Order

1. **Update Types & API** (Phase 1)
   - Essential foundation
   - Can be tested independently

2. **Basic List View** (Phase 2.1, 3.1)
   - Get data displaying first
   - Simple table with basic info

3. **Search & Filters** (Phase 2.2, 3.2)
   - Add filtering capabilities
   - Improve UX

4. **Create/Edit Forms** (Phase 2.3)
   - Enable CRUD operations
   - Form validation

5. **Detail View** (Phase 2.4)
   - View full client information
   - Action buttons

6. **Status Management** (Phase 2.5)
   - Activate/deactivate/archive
   - Verification workflow

7. **Polish & Optimization** (Phase 4)
   - Error handling
   - Performance
   - Accessibility

## Design Considerations

### Wellness Color Scheme
- Active: Emerald green
- Inactive: Gray
- Pending: Amber/yellow
- Archived: Slate/gray
- Verified: Emerald with checkmark icon
- Unverified: Gray with warning icon

### UI Patterns
- Use existing form components from `/components/forms`
- Follow dashboard page patterns
- Maintain clean, minimal design
- Use emerald accents for wellness theme

### Data Flow
```
User Action → React Query Hook → API Client → Backend
                ↓
         Cache Update → UI Update → Toast Notification
```

## Testing Checklist

- [ ] List clients displays correctly
- [ ] Search functionality works
- [ ] Filters apply correctly
- [ ] Create client validates properly
- [ ] Update client works
- [ ] Delete client works (soft delete)
- [ ] Status changes work
- [ ] Verification workflow works
- [ ] Industry selection works
- [ ] Form validation matches backend rules
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] Empty states display correctly

