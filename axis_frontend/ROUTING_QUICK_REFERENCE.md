# Routing Quick Reference

Quick guide for working with the routing system in Axis EAP frontend.

## ✅ Completed Implementation

### Pages with URL-Managed Detail Views

| Page | Route | Detail View URL | Status |
|------|-------|-----------------|--------|
| Clients | `/clients` | `/clients?view={clientId}` | ✅ Implemented |
| Persons | `/persons` | `/persons?view={personId}` | ✅ Implemented |
| Contracts | `/contracts` | `/contracts?view={contractId}` | 🔜 Ready for implementation |
| Documents | `/documents` | `/documents?view={documentId}` | 🔜 Ready for implementation |

### Key Benefits

- ✅ **Deep linking**: Share `/clients?view=client-123` with colleagues
- ✅ **Browser navigation**: Back/forward buttons work correctly
- ✅ **Bookmarkable**: Users can bookmark specific views
- ✅ **Layout preserved**: Parent page visible under modal overlay
- ✅ **SEO friendly**: Clean, meaningful URLs

## 🚀 How It Works

### Opening a Detail View

When user clicks "View" on an item:
1. URL changes: `/clients` → `/clients?view=client-123`
2. React Router detects URL change
3. Page component reads `view` param
4. Modal opens with detail content
5. Parent page remains visible underneath

### Closing a Detail View

When user clicks "Close" or presses Escape:
1. `view` param removed from URL
2. URL changes: `/clients?view=client-123` → `/clients`
3. Modal closes smoothly
4. Parent page still fully functional

### Browser Back Button

User workflow:
1. User on `/clients` (list view)
2. Opens client A: `/clients?view=client-a`
3. Opens client B: `/clients?view=client-b`
4. Clicks browser back → Returns to `/clients?view=client-a` (client A modal opens)
5. Clicks browser back → Returns to `/clients` (no modal, list view)

## 📝 Implementation Pattern

### Step 1: Import Required Hooks

```typescript
import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
```

### Step 2: Setup URL State Sync

```typescript
export function MyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])

  // Derive viewing state from URL
  const viewItemId = searchParams.get('view')
  const viewingItem = useMemo(() => {
    if (!viewItemId) return null
    return items.find((item) => item.id === viewItemId) || null
  }, [viewItemId, items])
}
```

### Step 3: Handle Open/Close

```typescript
// Open detail view
const handleView = (item: Item) => {
  setSearchParams({ view: item.id })
}

// Close detail view
const handleCloseView = () => {
  searchParams.delete('view')
  setSearchParams(searchParams)
}
```

### Step 4: Render Modal

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

## 🎯 Best Practices

### ✅ DO

```typescript
// ✅ Use query params for modal views
setSearchParams({ view: itemId })

// ✅ Remove params when closing
searchParams.delete('view')
setSearchParams(searchParams)

// ✅ Use useMemo to compute viewing state
const viewingItem = useMemo(() => { /* ... */ }, [viewItemId, items])

// ✅ Keep parent page layout intact
<div className="fixed inset-0 bg-black/90 z-50">
  {/* Modal content */}
</div>
```

### ❌ DON'T

```typescript
// ❌ Don't use only component state
const [viewingItem, setViewingItem] = useState(null) // No URL sync

// ❌ Don't navigate to new route for details
navigate(`/clients/${clientId}`) // Creates new page, loses context

// ❌ Don't forget to clean up URL
onClose={() => setShowModal(false)} // URL still has ?view=...

// ❌ Don't use nested routes for modals
// Bad: /clients/:id (creates new page)
// Good: /clients?view=:id (modal overlay)
```

## 🔍 Testing URLs

Try these URLs directly in the browser:

```bash
# List views (should show page without modal)
http://localhost:3000/clients
http://localhost:3000/persons
http://localhost:3000/contracts
http://localhost:3000/documents

# Detail views (should show page WITH modal)
http://localhost:3000/clients?view=client-123
http://localhost:3000/persons?view=person-456

# Multiple params (should work together)
http://localhost:3000/clients?status=Active&view=client-123
http://localhost:3000/persons?person_type=ClientEmployee&view=person-789
```

## 🔧 Common Issues & Solutions

### Issue: Modal doesn't open when URL changes

**Solution**: Check that you're using `useMemo` to compute viewing state from URL:

```typescript
// ✅ Correct - reacts to URL changes
const viewingItem = useMemo(() => {
  if (!viewItemId) return null
  return items.find((item) => item.id === viewItemId) || null
}, [viewItemId, items])

// ❌ Wrong - doesn't react to URL
const viewingItem = items.find((item) => item.id === viewItemId)
```

### Issue: Browser back doesn't work

**Solution**: Make sure you're updating URL, not just component state:

```typescript
// ✅ Correct - updates URL
const handleView = (item) => {
  setSearchParams({ view: item.id })
}

// ❌ Wrong - only local state
const handleView = (item) => {
  setViewingItem(item) // No URL change
}
```

### Issue: URL params are lost when opening modal

**Solution**: Preserve existing params when adding `view`:

```typescript
// ✅ Correct - preserves other params
const handleView = (item: Item) => {
  const newParams = new URLSearchParams(searchParams)
  newParams.set('view', item.id)
  setSearchParams(newParams)
}

// ❌ Wrong - replaces all params
const handleView = (item: Item) => {
  setSearchParams({ view: item.id }) // Loses other params
}
```

## 📚 Reference Files

| Component | Location |
|-----------|----------|
| Router config | `src/router.tsx` |
| Clients page (example) | `src/pages/ClientsPage.tsx` |
| Persons page (example) | `src/pages/PersonsPage.tsx` |
| Client detail modal | `src/components/clients/ClientDetailModal.tsx` |
| Person detail modal | `src/components/persons/PersonDetailModal.tsx` |
| Full routing guide | `ROUTING.md` |

## 🎨 Modal Layout Pattern

All detail modals use this consistent structure:

```tsx
<div className="fixed inset-0 bg-black/90 backdrop-blur-[2px] z-50 flex flex-col">
  {/* Header - Fixed */}
  <div className="bg-gray-950 border-b border-white/10 px-6 py-4 flex-shrink-0">
    <div className="flex items-center justify-between">
      {/* Title and metadata */}
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {/* Status badges, etc */}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  </div>

  {/* Content - Scrollable */}
  <div className="flex-1 overflow-hidden bg-gray-900/50">
    {/* Tabbed content or sections */}
  </div>
</div>
```

## 🚀 Next Steps

To add URL-managed detail views to a new page:

1. Add `useSearchParams` hook
2. Derive viewing state from URL using `useMemo`
3. Update `handleView` to set URL params
4. Update `handleClose` to remove URL params
5. Render modal conditionally based on viewing state
6. Test with direct URLs and browser navigation

For complete details, see `ROUTING.md`.
