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

/**
 * Global status color mapping following universal conventions:
 * - Green: Active, Success, Completed, Approved
 * - Blue: Scheduled, In Progress, Rescheduled
 * - Yellow: Pending, Warning, Postponed
 * - Orange: No Show, Overdue
 * - Red: Inactive, Canceled, Failed, Expired, Terminated, Deleted
 * - Purple: Special statuses
 * - Gray: Archived, Disabled, Neutral
 */
export function getStatusColor(status: string): string {
  // Normalize status to check (case-insensitive)
  const normalizedStatus = status.toLowerCase()

  // Green - Active/Success states
  if (normalizedStatus === 'active' || normalizedStatus === 'approved' || normalizedStatus === 'success') {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }
  // Completed states
  else if (normalizedStatus === 'completed' || normalizedStatus === 'done' || normalizedStatus === 'finished') {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }
  // Blue - Scheduled/In Progress states
  else if (normalizedStatus === 'scheduled' || normalizedStatus === 'in progress' || normalizedStatus === 'processing') {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }
  else if (normalizedStatus === 'rescheduled') {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }
  // Yellow - Pending/Warning states
  else if (normalizedStatus === 'pending' || normalizedStatus === 'waiting' || normalizedStatus === 'review') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
  else if (normalizedStatus === 'postponed' || normalizedStatus === 'delayed') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
  else if (normalizedStatus === 'renewed') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
  else if (normalizedStatus === 'suspended') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
  // Orange - No Show/Overdue states
  else if (normalizedStatus === 'no show' || normalizedStatus === 'overdue' || normalizedStatus === 'late') {
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }
  // Red - Inactive/Canceled/Failed states
  else if (normalizedStatus === 'inactive' || normalizedStatus === 'disabled') {
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  else if (normalizedStatus === 'canceled' || normalizedStatus === 'cancelled') {
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  else if (normalizedStatus === 'failed' || normalizedStatus === 'error' || normalizedStatus === 'rejected') {
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  else if (normalizedStatus === 'expired' || normalizedStatus === 'terminated' || normalizedStatus === 'deleted') {
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  // Gray - Archived/Neutral states
  else if (normalizedStatus === 'archived' || normalizedStatus === 'closed') {
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
  // Purple - Special/Draft states
  else if (normalizedStatus === 'draft' || normalizedStatus === 'special') {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }

  // Default - Gray for unknown statuses
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}
