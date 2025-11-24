/**
 * Form Textarea Component
 *
 * SOLID Principles:
 * - Single Responsibility: Render textarea with label and error
 * - Open/Closed: Extensible with different variants
 */

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { type FieldError } from 'react-hook-form'

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Field label */
  label: string
  /** Field error from React Hook Form */
  error?: FieldError
  /** Optional helper text */
  helperText?: string
}

/**
 * Reusable textarea component with label, error, and helper text
 *
 * Usage:
 * ```tsx
 * <FormTextarea
 *   label="Description"
 *   rows={4}
 *   {...register('description')}
 *   error={errors.description}
 * />
 * ```
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
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

        {/* Textarea */}
        <textarea
          ref={ref}
          className={cn(
            'w-full py-3.5 px-4 bg-white/5 border rounded-xl',
            'text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50',
            'transition-all duration-200',
            'backdrop-blur-sm',
            'resize-y min-h-[100px]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-900/50 focus:ring-red-500/50 focus:border-red-500/50'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]',
            className
          )}
          {...props}
        />

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

FormTextarea.displayName = 'FormTextarea'
