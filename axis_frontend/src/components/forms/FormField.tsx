/**
 * Form Field Component
 *
 * SOLID Principles:
 * - Single Responsibility: Render form input with label and error
 * - Open/Closed: Extensible with different input types
 */

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { type FieldError } from 'react-hook-form'

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label */
  label: string
  /** Field error from React Hook Form */
  error?: FieldError
  /** Optional helper text */
  helperText?: string
  /** Icon to display on the left */
  leftIcon?: React.ReactNode
  /** Icon to display on the right */
  rightIcon?: React.ReactNode
}

/**
 * Reusable form field component with label, error, and helper text
 *
 * Usage:
 * ```tsx
 * <FormField
 *   label="Email"
 *   type="email"
 *   {...register('email')}
 *   error={errors.email}
 * />
 * ```
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {/* Label */}
        <label
          htmlFor={props.id || props.name}
          className="block text-sm font-medium text-gray-400"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative group">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-gray-500 group-focus-within:text-cream-400 transition-colors">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full py-2 px-3 bg-white/5 border rounded-lg',
              'text-white placeholder-gray-500 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50',
              'transition-all duration-200',
              'backdrop-blur-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-red-900/50 focus:ring-red-500/50 focus:border-red-500/50'
                : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]',
              className
            )}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
            {error.message}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
