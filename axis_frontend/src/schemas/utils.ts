/**
 * Zod Schema Utilities
 *
 * Reusable schema builders following Zod v4 best practices
 *
 * @see https://zod.dev/
 */

import { z } from 'zod'

/**
 * Optional string that treats empty strings as undefined
 *
 * Modern Zod pattern using coercion and preprocessing
 */
export const optionalString = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .optional()

/**
 * Optional email with proper validation
 *
 * Accepts empty strings and converts to undefined
 */
export const optionalEmail = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(z.string().email('Invalid email address').optional())

/**
 * Optional URL with proper validation
 *
 * Accepts empty strings and converts to undefined
 */
export const optionalUrl = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(z.string().url('Invalid URL').optional())

/**
 * Optional phone number with basic validation
 *
 * Max 20 characters to match backend CharField max_length
 */
export const optionalPhone = z
  .string()
  .trim()
  .max(20, 'Phone number too long')
  .transform((val) => (val === '' ? undefined : val))
  .optional()

/**
 * Required email field
 */
export const requiredEmail = z.string().trim().email('Invalid email address')

/**
 * Required URL field
 */
export const requiredUrl = z.string().trim().url('Invalid URL')

/**
 * Text field with max length
 *
 * @param maxLength - Maximum character length
 * @param fieldName - Field name for error messages
 */
export function textField(maxLength: number, fieldName = 'Field') {
  return z
    .string()
    .trim()
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
}

/**
 * Optional text field with max length
 *
 * @param maxLength - Maximum character length
 * @param fieldName - Field name for error messages
 */
export function optionalTextField(maxLength: number, fieldName = 'Field') {
  return z
    .string()
    .trim()
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
    .transform((val) => (val === '' ? undefined : val))
    .optional()
}

/**
 * Required field with max length
 *
 * @param maxLength - Maximum character length
 * @param fieldName - Field name for error messages
 */
export function requiredTextField(maxLength: number, fieldName = 'Field') {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
}

/**
 * Textarea field (no max length, allows multiline)
 */
export const textarea = z.string().trim()

/**
 * Optional textarea field
 */
export const optionalTextarea = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .optional()

/**
 * CUID identifier (matches backend primary keys)
 */
export const cuid = z.string().length(25, 'Invalid ID format')

/**
 * Optional CUID
 */
export const optionalCuid = z
  .string()
  .length(25, 'Invalid ID format')
  .transform((val) => (val === '' ? undefined : val))
  .optional()

/**
 * ISO datetime string
 */
export const datetime = z.string().datetime()

/**
 * Optional datetime
 */
export const optionalDatetime = z.string().datetime().optional()

/**
 * Timezone string (IANA format)
 */
export const timezone = z
  .string()
  .refine((val) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: val })
      return true
    } catch {
      return false
    }
  }, 'Invalid timezone')

/**
 * Optional timezone
 */
export const optionalTimezone = z
  .string()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(
    z
      .string()
      .refine(
        (val) => {
          if (!val) return true
          try {
            Intl.DateTimeFormat(undefined, { timeZone: val })
            return true
          } catch {
            return false
          }
        },
        'Invalid timezone'
      )
      .optional()
  )

/**
 * JSON metadata object
 */
export const metadata = z.record(z.unknown()).optional()

/**
 * Create a refinement that ensures at least one field is provided
 *
 * @param fields - Array of field names to check
 * @param message - Error message
 */
export function requireAtLeastOne<T extends z.ZodRawShape>(
  fields: (keyof T)[],
  message = 'At least one field is required'
) {
  return (data: z.infer<z.ZodObject<T>>) => {
    return fields.some((field) => {
      const value = data[field]
      return value !== null && value !== undefined && value !== ''
    })
  }
}

/**
 * Create a refinement for conditional required fields
 *
 * @param condition - Function that determines if field is required
 * @param fieldName - Name of the field to validate
 * @param message - Error message
 */
export function conditionallyRequired<T>(
  condition: (data: T) => boolean,
  fieldName: keyof T,
  message = 'This field is required'
) {
  return (data: T) => {
    if (condition(data)) {
      const value = data[fieldName]
      return value !== null && value !== undefined && value !== ''
    }
    return true
  }
}
