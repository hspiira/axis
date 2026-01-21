/**
 * FilterToolbar Component
 *
 * Generic toolbar component for search, filters, and actions.
 * Provides consistent layout while allowing custom content via slots.
 *
 * Layout Structure:
 * - Row 1: Search | Filters | Actions
 * - Row 2: Secondary Filters (optional)
 *
 * SOLID Principles:
 * - Single Responsibility: Manage toolbar layout structure
 * - Open/Closed: Extensible via slots without modifying component
 * - Dependency Inversion: Depends on ReactNode abstraction
 */

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FilterToolbarProps {
  /**
   * Search input slot - typically a SearchInput or custom input
   */
  searchSlot?: ReactNode

  /**
   * Filter controls slot - filter buttons, dropdowns, etc.
   */
  filterSlot?: ReactNode

  /**
   * Action buttons slot - create, export, etc.
   */
  actionSlot?: ReactNode

  /**
   * Secondary filter row slot - additional filters shown below main row
   */
  secondaryFilterSlot?: ReactNode

  /**
   * Custom className for the container
   */
  className?: string

  /**
   * Variant styling
   */
  variant?: 'default' | 'compact' | 'bordered'
}

const variantClasses = {
  default: 'space-y-3',
  compact: 'space-y-2',
  bordered: 'space-y-3 bg-white/5 border border-white/10 rounded-lg p-4',
}

export function FilterToolbar({
  searchSlot,
  filterSlot,
  actionSlot,
  secondaryFilterSlot,
  className,
  variant = 'default',
}: FilterToolbarProps) {
  const hasMainContent = searchSlot || filterSlot || actionSlot

  return (
    <div className={cn(variantClasses[variant], className)}>
      {/* Main Row: Search | Filters | Actions */}
      {hasMainContent && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Slot */}
          {searchSlot && <div className="flex-1 min-w-[300px]">{searchSlot}</div>}

          {/* Filter Slot */}
          {filterSlot && <div className="flex items-center gap-1.5">{filterSlot}</div>}

          {/* Action Slot */}
          {actionSlot && <div className="flex items-center gap-1.5">{actionSlot}</div>}
        </div>
      )}

      {/* Secondary Filter Row (optional) */}
      {secondaryFilterSlot && (
        <div className="flex items-center gap-1.5 flex-wrap">{secondaryFilterSlot}</div>
      )}
    </div>
  )
}
