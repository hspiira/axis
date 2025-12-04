/**
 * Summary Stats Component
 *
 * Displays summary statistics in a grid layout with multiple variants
 */

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  value: number | string
  color?: string
  icon?: LucideIcon
  iconColor?: string
}

interface SummaryStatsProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  variant?: 'default' | 'cards' | 'compact'
  className?: string
}

/**
 * SummaryStats - Main container for displaying multiple stat cards
 *
 * @param stats - Array of stat items to display
 * @param columns - Number of columns in grid (2, 3, or 4)
 * @param variant - Display variant:
 *   - 'default': Stats on theme-secondary background with border (minimal design)
 *   - 'cards': Individual cards with white/5 background and borders (prominent design)
 *   - 'compact': Dense layout without container padding (inline stats)
 * @param className - Additional CSS classes
 */
export function SummaryStats({
  stats,
  columns = 4,
  variant = 'default',
  className
}: SummaryStatsProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-4'
  }

  const variants = {
    default: 'p-4 bg-theme-secondary rounded-lg border border-theme',
    cards: '',
    compact: 'gap-3'
  }

  return (
    <div className={cn(
      'grid gap-4',
      gridCols[columns],
      variants[variant],
      className
    )}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} variant={variant} />
      ))}
    </div>
  )
}

interface StatCardProps extends StatItem {
  variant?: 'default' | 'cards' | 'compact'
  className?: string
}

/**
 * StatCard - Individual stat card component
 *
 * Displays a single statistic with optional icon, label, and value
 * Adapts styling based on variant prop from parent SummaryStats
 */
export function StatCard({
  label,
  value,
  color,
  icon: Icon,
  iconColor,
  variant = 'default',
  className
}: StatCardProps) {
  const valueColor = color || 'text-theme'
  const iconColorClass = iconColor || valueColor

  // Variant: 'cards' - Individual cards with prominent styling
  if (variant === 'cards') {
    return (
      <div className={cn('bg-white/5 border border-white/10 rounded-lg p-4', className)}>
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className={cn('h-5 w-5', iconColorClass)} />}
          <span className="text-sm text-gray-400">{label}</span>
        </div>
        <p className={cn('text-2xl font-bold', valueColor)}>{value}</p>
      </div>
    )
  }

  // Variant: 'compact' - Dense inline stats
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {Icon && <Icon className={cn('h-4 w-4', iconColorClass)} />}
        <div>
          <div className={cn('text-lg font-bold', valueColor)}>{value}</div>
          <div className="text-xs text-theme-tertiary">{label}</div>
        </div>
      </div>
    )
  }

  // Variant: 'default' - Centered stats without individual backgrounds
  return (
    <div className={cn('text-center', className)}>
      {Icon && (
        <Icon className={cn('h-5 w-5 mx-auto mb-2', iconColorClass)} />
      )}
      <div className={cn('text-2xl font-bold', valueColor)}>
        {value}
      </div>
      <div className="text-xs text-theme-tertiary">
        {label}
      </div>
    </div>
  )
}

// Preset stat types for common use cases
export const sessionStatPresets = {
  total: (count: number) => ({
    label: 'Total Sessions',
    value: count,
    color: 'text-theme'
  }),
  completed: (count: number) => ({
    label: 'Completed',
    value: count,
    color: 'text-emerald-400'
  }),
  upcoming: (count: number) => ({
    label: 'Upcoming',
    value: count,
    color: 'text-blue-400'
  }),
  canceled: (count: number) => ({
    label: 'Canceled/No Show',
    value: count,
    color: 'text-red-400'
  })
}

export const serviceStatPresets = {
  active: (count: number) => ({
    label: 'Active Services',
    value: count,
    color: 'text-emerald-400'
  }),
  pending: (count: number) => ({
    label: 'Pending',
    value: count,
    color: 'text-yellow-400'
  }),
  total: (count: number) => ({
    label: 'Total',
    value: count,
    color: 'text-theme'
  })
}
