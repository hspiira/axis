/**
 * Summary Stats Component
 *
 * Displays summary statistics in a grid layout
 */

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  value: number | string
  color?: string
  icon?: LucideIcon
}

interface SummaryStatsProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function SummaryStats({
  stats,
  columns = 4,
  className
}: SummaryStatsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  return (
    <div className={cn(
      'grid gap-4 p-4 bg-theme-secondary rounded-lg border border-theme',
      gridCols[columns],
      className
    )}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

interface StatCardProps extends StatItem {
  className?: string
}

export function StatCard({ label, value, color, icon: Icon, className }: StatCardProps) {
  const valueColor = color || 'text-theme'

  return (
    <div className={cn('text-center', className)}>
      {Icon && (
        <Icon className={cn('h-5 w-5 mx-auto mb-2', valueColor)} />
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
