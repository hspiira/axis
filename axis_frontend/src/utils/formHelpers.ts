/**
 * Form Helper Utilities
 *
 * SOLID Principles:
 * - Single Responsibility: Each function has one clear purpose
 * - DRY: Reusable form data processing logic
 */

/**
 * Cleans form data by converting empty strings to undefined.
 * This ensures optional fields are not sent as empty strings to the API,
 * which can cause validation errors.
 *
 * @param data - The form data object to clean
 * @returns Cleaned form data with empty strings converted to undefined
 *
 * @example
 * const cleaned = cleanFormData({
 *   name: 'John',
 *   email: '',
 *   phone: ''
 * })
 * // Result: { name: 'John', email: undefined, phone: undefined }
 */
export function cleanFormData<T extends Record<string, any>>(data: T): T {
  const cleaned = { ...data }

  for (const key in cleaned) {
    if (cleaned[key] === '') {
      cleaned[key] = undefined as any
    }
  }

  return cleaned
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates required fields are present and non-empty
 *
 * @param data - The form data to validate
 * @param requiredFields - Array of field names that must be present
 * @returns Object with isValid boolean and missing field names
 *
 * @example
 * const { isValid, missing } = validateRequiredFields(
 *   { name: 'John', email: '' },
 *   ['name', 'email']
 * )
 * // Result: { isValid: false, missing: ['email'] }
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missing: string[] } {
  const missing = requiredFields.filter(
    (field) => !data[field] || (typeof data[field] === 'string' && !data[field].trim())
  ).map(String)

  return {
    isValid: missing.length === 0,
    missing
  }
}
