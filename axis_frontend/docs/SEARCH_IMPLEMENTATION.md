# Search Implementation Guide

Reusable search functionality with debouncing for optimal user experience and API performance.

## Overview

The search system provides:
- **Debounced input**: Prevents excessive API calls while typing
- **Clear button**: Easy way to reset search
- **Loading states**: Visual feedback during search
- **Reusable component**: Can be used across all pages
- **Type-safe**: Full TypeScript support

## Components

### 1. useDebounce Hook

**Location**: `src/hooks/useDebounce.ts`

**Purpose**: Delays value updates until user stops typing

**Usage**:
```typescript
import { useDebounce } from '@/hooks/useDebounce'

const [searchTerm, setSearchTerm] = useState('')
const debouncedSearchTerm = useDebounce(searchTerm, 500) // 500ms delay

useEffect(() => {
  // API call only happens after 500ms of no typing
  searchAPI(debouncedSearchTerm)
}, [debouncedSearchTerm])
```

**Parameters**:
- `value: T` - The value to debounce
- `delay: number` - Delay in milliseconds (default: 500ms)

**Returns**: Debounced value that updates after the specified delay

### 2. SearchInput Component

**Location**: `src/components/ui/SearchInput.tsx`

**Purpose**: Reusable search input with built-in debouncing

**Features**:
- Search icon on the left
- Clear button (X) on the right when input has value
- Automatic debouncing
- Controlled component pattern
- Accessibility support

**Usage**:
```typescript
import { SearchInput } from '@/components/ui/SearchInput'

function MyPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search clients..."
      debounceMs={300}
      className="w-full"
    />
  )
}
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Current search value |
| `onChange` | `(value: string) => void` | Required | Callback when debounced value changes |
| `placeholder` | `string` | `'Search...'` | Input placeholder text |
| `debounceMs` | `number` | `500` | Debounce delay in milliseconds |
| `className` | `string` | `undefined` | Additional CSS classes |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |
| `disabled` | `boolean` | `false` | Disable input |

## Implementation Pattern

### Client Search Example

**ClientsFilters.tsx**:
```typescript
import { SearchInput } from '@/components/ui/SearchInput'

export function ClientsFilters({ filters, onFiltersChange }: Props) {
  const searchValue = filters.name || filters.email || ''

  const handleSearchChange = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      // Clear search filters
      const newFilters = { ...filters }
      delete newFilters.name
      delete newFilters.email
      onFiltersChange(newFilters)
    } else {
      // Update name filter (backend handles partial matching)
      const newFilters = { ...filters, name: trimmedValue }
      delete newFilters.email
      onFiltersChange(newFilters)
    }
  }

  return (
    <SearchInput
      value={searchValue}
      onChange={handleSearchChange}
      placeholder="Search by name or email..."
      debounceMs={300}
    />
  )
}
```

### Usage in Other Pages

**Contracts Page Example**:
```typescript
import { SearchInput } from '@/components/ui/SearchInput'

export function ContractsPage() {
  const [filters, setFilters] = useState<ContractSearchParams>({})

  const handleSearchChange = (value: string) => {
    setFilters({
      ...filters,
      title: value || undefined,
    })
  }

  return (
    <SearchInput
      value={filters.title || ''}
      onChange={handleSearchChange}
      placeholder="Search contracts..."
      debounceMs={300}
    />
  )
}
```

**Cases Page Example**:
```typescript
import { SearchInput } from '@/components/ui/SearchInput'

export function CasesPage() {
  const [filters, setFilters] = useState<CaseSearchParams>({})

  const handleSearchChange = (value: string) => {
    setFilters({
      ...filters,
      case_number: value || undefined,
    })
  }

  return (
    <SearchInput
      value={filters.case_number || ''}
      onChange={handleSearchChange}
      placeholder="Search by case number..."
      debounceMs={300}
    />
  )
}
```

## Best Practices

### 1. Debounce Timing
- **Fast searches** (local filtering): 150-300ms
- **API searches** (database queries): 300-500ms
- **Expensive searches** (complex queries): 500-800ms

### 2. Clear Empty Values
Always remove empty/undefined values from filters:
```typescript
const handleSearchChange = (value: string) => {
  const newFilters = { ...filters }

  if (value) {
    newFilters.searchField = value
  } else {
    delete newFilters.searchField
  }

  onFiltersChange(newFilters)
}
```

### 3. Trim Input
Always trim whitespace to avoid unnecessary API calls:
```typescript
const trimmedValue = value.trim()
if (!trimmedValue) {
  // Clear search
}
```

### 4. Handle Multiple Search Fields
When searching across multiple fields, clear others when one is set:
```typescript
if (value.includes('@')) {
  // Email search
  newFilters.email = value
  delete newFilters.name
} else {
  // Name search
  newFilters.name = value
  delete newFilters.email
}
```

## Performance Considerations

### Without Debouncing
```
User types "John Smith" (10 characters)
→ 10 API calls
→ High server load
→ Wasted network bandwidth
→ Poor user experience (flickering results)
```

### With Debouncing (300ms)
```
User types "John Smith" (10 characters)
→ User stops typing
→ Wait 300ms
→ 1 API call
→ Efficient server usage
→ Smooth user experience
```

### Token Savings
- Without debouncing: ~10 API calls per search
- With debouncing: ~1-2 API calls per search
- **Savings**: 80-90% reduction in API calls

## Accessibility

The SearchInput component includes:
- Proper ARIA labels for screen readers
- Keyboard navigation support
- Clear button with accessible label
- Focus states and visual feedback
- Disabled state handling

## Testing

### Unit Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from '@/components/ui/SearchInput'

it('should debounce input changes', async () => {
  const onChange = vi.fn()
  render(<SearchInput value="" onChange={onChange} debounceMs={300} />)

  const input = screen.getByRole('textbox')
  await userEvent.type(input, 'test')

  // onChange should not be called immediately
  expect(onChange).not.toHaveBeenCalled()

  // Wait for debounce
  await waitFor(() => expect(onChange).toHaveBeenCalledWith('test'), {
    timeout: 400
  })
})

it('should show clear button when input has value', () => {
  render(<SearchInput value="test" onChange={vi.fn()} />)

  const clearButton = screen.getByLabelText('Clear search')
  expect(clearButton).toBeInTheDocument()
})
```

## Migration Guide

### From Old Pattern
```typescript
// Before: No debouncing, immediate updates
<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### To New Pattern
```typescript
// After: Debounced with better UX
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  debounceMs={300}
/>
```

## Future Enhancements

Potential improvements:
- Search suggestions/autocomplete
- Recent searches history
- Advanced search operators
- Search result highlighting
- Fuzzy search support
- Multi-field search with weights
