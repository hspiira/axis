/**
 * Search Input Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle search input with debouncing
 * - Open/Closed: Extensible with custom icons and styling
 *
 * Reusable search input with debouncing to prevent excessive API calls
 */

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  autoFocus?: boolean
  disabled?: boolean
}

export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 500,
  className,
  autoFocus = false,
  disabled = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value)
  const debouncedValue = useDebounce(internalValue, debounceMs)

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Notify parent when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue])

  const handleClear = () => {
    setInternalValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={cn(
          'w-full pl-10 pr-10 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50',
          'transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
      {internalValue && (
        <button
          onClick={handleClear}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
