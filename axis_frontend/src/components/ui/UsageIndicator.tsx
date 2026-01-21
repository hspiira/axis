/**
 * Usage Indicator Component
 *
 * Displays usage statistics with color-coded indicators
 */

import { cn } from '@/lib/utils'

interface UsageIndicatorProps {
  used: number
  total: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function UsageIndicator({
  used,
  total,
  className,
  size = 'md',
  showLabel = true
}: UsageIndicatorProps) {
  const color = getUsageColor(used, total)

  const sizes = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  }

  return (
    <div className={cn('text-center', className)}>
      <div className={cn('font-bold', sizes[size], color)}>
        {used} / {total}
      </div>
      {showLabel && (
        <>
          <div className={cn('text-theme-tertiary', labelSizes[size])}>
            Sessions Used
          </div>
          <div className={cn('text-theme-secondary mt-1', labelSizes[size])}>
            {total - used} remaining
          </div>
        </>
      )}
    </div>
  )
}

export function getUsageColor(used: number, total: number): string {
  const percentage = (used / total) * 100
  if (percentage >= 90) return 'text-red-400'
  if (percentage >= 70) return 'text-yellow-400'
  return 'text-emerald-400'
}

interface UsageProgressProps {
  used: number
  total: number
  className?: string
}

export function UsageProgress({ used, total, className }: UsageProgressProps) {
  const percentage = Math.min((used / total) * 100, 100)
  const color = getUsageColor(used, total)

  const barColor = color.replace('text-', 'bg-')

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-theme-secondary">Usage</span>
        <span className={cn('text-sm font-medium', color)}>
          {used}/{total} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
