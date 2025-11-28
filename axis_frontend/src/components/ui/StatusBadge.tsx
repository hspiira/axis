/**
 * Status Badge Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display status with consistent styling
 * - Open/Closed: Extensible with custom status types and colors
 */

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        getStatusColor(status),
        className
      )}
    >
      {status}
    </span>
  )
}

export function getStatusColor(status: string): string {
  // Normalize status to check (case-insensitive)
  const normalizedStatus = status.toLowerCase()

  // Check common statuses
  if (normalizedStatus === 'active') {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  } else if (normalizedStatus === 'inactive') {
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  } else if (normalizedStatus === 'pending') {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  } else if (normalizedStatus === 'archived') {
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  } else if (normalizedStatus === 'deleted') {
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  } else if (normalizedStatus === 'expired') {
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  } else if (normalizedStatus === 'renewed') {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  } else if (normalizedStatus === 'terminated') {
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  } else if (normalizedStatus === 'suspended') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }

  // Default
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}
