/**
 * Form Select Component
 *
 * SOLID Principles:
 * - Single Responsibility: Render select dropdown with label and error
 * - Open/Closed: Extensible with different options
 */

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { type FieldError } from 'react-hook-form'

export interface SelectOption {
  value: string
  label: string
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Field label */
  label: string
  /** Select options */
  options: SelectOption[]
  /** Field error from React Hook Form */
  error?: FieldError
  /** Optional helper text */
  helperText?: string
  /** Placeholder option */
  placeholder?: string
}

/**
 * Reusable select component with label, error, and helper text
 *
 * Usage:
 * ```tsx
 * <FormSelect
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   {...register('status')}
 *   error={errors.status}
 * />
 * ```
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, options, error, helperText, placeholder, className, ...props }, ref) => {
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

        {/* Select Container */}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full py-2 px-3 pr-10 bg-white/5 border rounded-lg',
              'text-white text-sm',
              'focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50',
              'transition-all duration-200',
              'backdrop-blur-sm',
              'appearance-none cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-900/50 focus:ring-red-500/50 focus:border-red-500/50'
                : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-900">
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown Arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

FormSelect.displayName = 'FormSelect'
