/**
 * Form Button Component
 *
 * SOLID Principles:
 * - Single Responsibility: Render form submission button
 * - Open/Closed: Extensible with different variants
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Loading state */
  loading?: boolean
  /** Full width button */
  fullWidth?: boolean
}

const variantClasses = {
  primary: cn(
    'bg-gradient-to-r from-purple-600 to-purple-700 text-white',
    'hover:from-purple-700 hover:to-purple-800',
    'shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
  ),
  secondary: cn(
    'bg-white/5 border border-white/10 text-white',
    'hover:bg-white/10 hover:border-white/20'
  ),
  danger: cn(
    'bg-gradient-to-r from-red-600 to-red-700 text-white',
    'hover:from-red-700 hover:to-red-800',
    'shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40'
  ),
  ghost: cn('bg-transparent text-white hover:bg-white/5'),
}

/**
 * Reusable form button component with loading state
 *
 * Usage:
 * ```tsx
 * <FormButton
 *   type="submit"
 *   loading={isSubmitting}
 *   variant="primary"
 * >
 *   Submit
 * </FormButton>
 * ```
 */
export const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>(
  (
    {
      children,
      variant = 'primary',
      loading = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'py-3.5 px-6 rounded-xl font-semibold',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transform hover:scale-[1.02] active:scale-[0.98]',
          'flex items-center justify-center gap-2',
          fullWidth && 'w-full',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        {children}
      </button>
    )
  }
)

FormButton.displayName = 'FormButton'
