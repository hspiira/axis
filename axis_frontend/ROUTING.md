# Routing Architecture

This document describes the routing structure and navigation patterns used in the Axis EAP frontend application.

## Architecture Overview

The application uses **React Router v6** with a **hybrid routing approach** that combines:
- **Flat routes** for primary pages
- **URL query parameters** for modal-based detail views
- **Layout preservation** via modal overlays

## Benefits

✅ **Deep linking**: Share URLs like `/clients?view=client-123`
✅ **Browser navigation**: Back/forward buttons work seamlessly
✅ **Bookmarkable**: Users can bookmark specific detail views
✅ **Layout preservation**: Parent page remains visible under modal
✅ **Simple**: No nested route complexity, easy to maintain

## Route Structure

### Primary Routes (Flat)

All primary application pages are defined as flat routes in `src/router.tsx`:

```
/                    - Landing page (public)
/dashboard          - Dashboard (protected)
/clients            - Client management (protected)
/persons            - Person management (protected)
/contracts          - Contract management (protected)
/documents          - Document library (protected)
/services           - Services management (protected)
/settings           - Application settings (protected)
/profile            - User profile (protected)
```

### Detail View Pattern (Query Parameters)

Detail views use URL query parameters to maintain parent layout while showing detailed information in modals:

```
/clients?view={clientId}     - Show client detail modal
/persons?view={personId}     - Show person detail modal
/contracts?view={contractId} - Show contract detail modal (future)
/documents?view={documentId} - Show document detail modal (future)
```

## Implementation Pattern

### 1. Page Component Setup

```typescript
import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'

export function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])

  // Sync detail view with URL
  const viewItemId = searchParams.get('view')
  const viewingItem = useMemo(() => {
    if (!viewItemId) return null
    return items.find((item) => item.id === viewItemId) || null
  }, [viewItemId, items])

  // ...rest of component
}
```

### 2. Opening Detail Views

```typescript
const handleView = (item: Item) => {
  // Add view parameter to URL
  setSearchParams({ view: item.id })
}
```

### 3. Closing Detail Views

```typescript
const handleCloseView = () => {
  // Remove view parameter from URL
  searchParams.delete('view')
  setSearchParams(searchParams)
}
```

### 4. Modal Rendering

```typescript
{/* Detail Modal */}
{viewingItem && (
  <DetailModal
    item={viewingItem}
    isOpen={!!viewingItem}
    onClose={handleCloseView}
  />
)}
```

## Layout Preservation

Detail modals use full-screen overlays with these characteristics:

- **Fixed positioning**: `fixed inset-0` ensures modal covers entire viewport
- **Backdrop**: `bg-black/90 backdrop-blur-[2px]` creates dark overlay
- **High z-index**: `z-50` ensures modal appears above all content
- **Parent page preserved**: Parent page remains mounted and visible underneath

### Modal Structure

```tsx
<div className="fixed inset-0 bg-black/90 backdrop-blur-[2px] z-50 flex flex-col">
  {/* Modal Header */}
  <div className="bg-gray-950 border-b border-white/10 px-6 py-4">
    {/* Header content with close button */}
  </div>

  {/* Modal Content */}
  <div className="flex-1 overflow-hidden bg-gray-900/50">
    {/* Tabbed content or detail sections */}
  </div>
</div>
```

## Navigation Flow Examples

### Example 1: View Client Details

1. User on `/clients` page
2. Clicks "View" on a client → URL changes to `/clients?view=client-123`
3. ClientDetailModal opens with full-screen overlay
4. User clicks "Close" → URL returns to `/clients`
5. Modal closes, clients list still visible

### Example 2: Edit from Detail View

1. User on `/clients?view=client-123` (detail modal open)
2. Clicks "Edit" button in modal
3. URL changes to `/clients` (removes view param)
4. Detail modal closes
5. Edit modal opens
6. After save, user returns to `/clients` list

### Example 3: Browser Navigation

1. User views client: `/clients?view=client-123`
2. Views another client: `/clients?view=client-456`
3. Clicks browser back → Returns to `/clients?view=client-123`
4. Clicks browser back → Returns to `/clients` (no modal)

## Best Practices

### ✅ DO

- Use query parameters for detail views (modal overlays)
- Keep route definitions flat in `router.tsx`
- Sync modal state with URL via `useSearchParams`
- Preserve parent page layout with modal overlays
- Use `useMemo` to compute viewing state from URL
- Clean up URL params when closing modals

### ❌ DON'T

- Don't use nested routes for modal-based views
- Don't manage modal state only in component state
- Don't navigate away from parent page for details
- Don't create separate pages for detail views
- Don't forget to handle browser back/forward

## Query Parameter Conventions

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `view` | Show detail modal for specific item | `?view=client-123` |
| `edit` | Open edit modal for specific item (future) | `?edit=client-123` |
| `create` | Open create modal (if needed) | `?create=employee` |
| `tab` | Set active tab in detail view (future) | `?view=client-123&tab=contracts` |

## Filter Parameters

Search and filter parameters use specific naming:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `search` | Text search query | `?search=acme` |
| `status` | Filter by status | `?status=Active` |
| `industry` | Filter by industry | `?industry=tech` |
| `person_type` | Filter persons by type | `?person_type=ClientEmployee` |

## Future Considerations

### Tab State in URL (Optional Enhancement)

```typescript
// Save active tab to URL
const handleTabChange = (tabId: string) => {
  setSearchParams({ view: itemId, tab: tabId })
}

// Read tab from URL on mount
const activeTab = searchParams.get('tab') || 'overview'
```

### Multi-Parameter Management

```typescript
// Preserve existing params when adding view
const handleView = (item: Item) => {
  const newParams = new URLSearchParams(searchParams)
  newParams.set('view', item.id)
  setSearchParams(newParams)
}
```

### Nested Detail Views (Future)

If needed for complex relationships:
```
/clients?view=client-123&contract=contract-456
```

## Testing URLs

Direct navigation to these URLs should work:

- http://localhost:5173/clients
- http://localhost:5173/clients?view=client-123
- http://localhost:5173/persons
- http://localhost:5173/persons?view=person-456
- http://localhost:5173/contracts
- http://localhost:5173/documents

## Component File References

| Feature | File |
|---------|------|
| Router config | `src/router.tsx` |
| Clients page | `src/pages/ClientsPage.tsx` |
| Persons page | `src/pages/PersonsPage.tsx` |
| Client detail modal | `src/components/clients/ClientDetailModal.tsx` |
| Person detail modal | `src/components/persons/PersonDetailModal.tsx` |
| URL search params hook | `src/hooks/useURLSearchParams.tsx` |

## Related Patterns

- **AppLayout**: Provides consistent navigation across all pages
- **Protected Routes**: Wraps authenticated pages with auth checks
- **Modal Components**: Reusable modal patterns with overlay
- **Tab Systems**: Organized information display within detail views
