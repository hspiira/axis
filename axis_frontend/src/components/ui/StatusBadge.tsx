/**
 * Status Badge Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display status with consistent styling
 * - Open/Closed: Extensible with custom status types and colors
 */

import { BaseStatus } from '@/api/clients'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: BaseStatus
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

export function getStatusColor(status: BaseStatus): string {
  switch (status) {
    case BaseStatus.ACTIVE:
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case BaseStatus.INACTIVE:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    case BaseStatus.PENDING:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case BaseStatus.ARCHIVED:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    case BaseStatus.DELETED:
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}
