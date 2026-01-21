/**
 * Service Status Badge Component
 *
 * Specialized badge for service assignment statuses
 */

import { cn } from '@/lib/utils'

interface ServiceStatusBadgeProps {
  status: string
  className?: string
  variant?: 'badge' | 'text' | 'card'
}

export function ServiceStatusBadge({
  status,
  className,
  variant = 'badge'
}: ServiceStatusBadgeProps) {
  const colors = getServiceStatusColor(status)

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

export function getServiceStatusColor(status: string) {
  switch (status) {
    case 'Active':
      return {
        badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        text: 'text-emerald-400'
      }
    case 'Inactive':
      return {
        badge: 'text-red-400 bg-red-500/10 border-red-500/20',
        text: 'text-red-400'
      }
    case 'Pending':
      return {
        badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        text: 'text-yellow-400'
      }
    case 'Archived':
      return {
        badge: 'text-gray-500 bg-gray-600/10 border-gray-600/20',
        text: 'text-gray-500'
      }
    default:
      return {
        badge: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
        text: 'text-gray-400'
      }
  }
}
