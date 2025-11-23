/**
 * Authentication validation schemas.
 * 
 * SOLID Principles:
 * - Single Responsibility: Define validation rules only
 * - Open/Closed: Can be extended with additional validation rules
 */

import { z } from 'zod'

/**
 * Login credentials validation schema.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

