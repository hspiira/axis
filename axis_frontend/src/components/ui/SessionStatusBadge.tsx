/**
 * Session Status Badge Component
 *
 * Specialized badge for session statuses with consistent styling
 */

import { cn } from '@/lib/utils'

interface SessionStatusBadgeProps {
  status: string
  className?: string
  variant?: 'badge' | 'text' | 'card'
}

export function SessionStatusBadge({
  status,
  className,
  variant = 'badge'
}: SessionStatusBadgeProps) {
  const colors = getSessionStatusColor(status)

  if (variant === 'text') {
    return <span className={cn(colors.text, className)}>{status}</span>
  }

  if (variant === 'card') {
    return (
      <span className={cn(
        'px-2 py-1 text-xs font-medium rounded-md border',
        colors.badge,
        className
      )}>
        {status}
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colors.badge,
      className
    )}>
      {status}
    </span>
  )
}

export function getSessionStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return {
        badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        text: 'text-emerald-400'
      }
    case 'Scheduled':
    case 'Rescheduled':
      return {
        badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        text: 'text-blue-400'
      }
    case 'Canceled':
      return {
        badge: 'text-red-400 bg-red-500/10 border-red-500/20',
        text: 'text-red-400'
      }
    case 'No Show':
      return {
        badge: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        text: 'text-orange-400'
      }
    case 'Postponed':
      return {
        badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        text: 'text-yellow-400'
      }
    default:
      return {
        badge: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
        text: 'text-gray-400'
      }
  }
}
