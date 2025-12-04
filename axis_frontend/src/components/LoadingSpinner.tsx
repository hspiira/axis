/**
 * Loading Spinner Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display loading indicator
 * - Open/Closed: Easily extensible with different sizes and variants
 */

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Optional message to display */
  message?: string
  /** Center the spinner in its container */
  centered?: boolean
  /** Additional CSS classes */
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

/**
 * Loading spinner component
 *
 * Usage:
 * ```tsx
 * <LoadingSpinner size="md" message="Loading data..." />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  message,
  centered = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        centered && 'justify-center',
        className
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-cream-500 border-t-transparent',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <span className="text-sm text-gray-400 animate-pulse">{message}</span>
      )}
    </div>
  )
}

/**
 * Full page loading spinner
 *
 * Usage:
 * ```tsx
 * <FullPageSpinner message="Loading application..." />
 * ```
 */
export function FullPageSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-lg text-white font-medium">{message}</p>
      </div>
    </div>
  )
}
