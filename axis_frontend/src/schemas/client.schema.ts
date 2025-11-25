/**
 * Client Validation Schemas
 *
 * Centralized Zod schemas for client entity validation
 * Aligned with backend Django model
 *
 * @see /Users/piira/dev/axis/axis_backend/apps/clients/migrations/0001_initial.py
 */

import { z } from 'zod'
import { BaseStatus, ContactMethod } from '@/api/clients'
import {
  requiredTextField,
  optionalEmail,
  optionalPhone,
  optionalUrl,
  optionalTextarea,
  optionalTextField,
  optionalTimezone,
  metadata,
  requireAtLeastOne,
} from './utils'

/**
 * Client form validation schema
 *
 * Matches Django Client model fields:
 * - name: CharField(max_length=255, required)
 * - email: EmailField(optional)
 * - phone: CharField(max_length=20, optional)
 * - website: URLField(max_length=255, optional)
 * - address: TextField(optional)
 * - billing_address: TextField(optional)
 * - timezone: CharField(max_length=50, optional)
 * - tax_id: CharField(max_length=50, optional)
 * - contact_person: CharField(max_length=255, optional)
 * - contact_email: EmailField(optional)
 * - contact_phone: CharField(max_length=20, optional)
 * - industry_id: ForeignKey(optional)
 * - status: CharField(choices, default='Active')
 * - preferred_contact_method: CharField(choices, optional)
 * - is_verified: BooleanField(default=False)
 * - notes: TextField(optional)
 * - metadata: JSONField(optional)
 */
export const clientFormSchema = z
  .object({
    // Required fields
    name: requiredTextField(255, 'Client name'),

    // Contact information (at least one required via refinement)
    email: optionalEmail,
    phone: optionalPhone,
    contact_email: optionalEmail,
    contact_phone: optionalPhone,

    // Optional text fields with max length
    website: optionalUrl,
    contact_person: optionalTextField(255, 'Contact person'),
    tax_id: optionalTextField(50, 'Tax ID'),
    timezone: optionalTimezone,

    // Optional text areas (no max length)
    address: optionalTextarea,
    billing_address: optionalTextarea,
    notes: optionalTextarea,

    // Foreign key
    industry_id: z.string().optional(),

    // Enums
    status: z.enum(Object.values(BaseStatus) as [BaseStatus, ...BaseStatus[]]).default(BaseStatus.ACTIVE),
    preferred_contact_method: z.enum(Object.values(ContactMethod) as [ContactMethod, ...ContactMethod[]]).optional().nullable(),

    // Boolean
    is_verified: z.boolean().default(false),

    // Metadata
    metadata: metadata,
  })
  .refine(
    requireAtLeastOne(
      ['email', 'phone', 'contact_email', 'contact_phone'],
      'At least one contact method (email or phone) is required'
    ),
    {
      message: 'At least one contact method (email or phone) is required',
      path: ['email'],
    }
  )

/**
 * Infer TypeScript type from schema
 */
export type ClientFormValues = z.infer<typeof clientFormSchema>

/**
 * Client search/filter schema
 */
export const clientSearchSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  status: z.enum(Object.values(BaseStatus) as [BaseStatus, ...BaseStatus[]]).optional(),
  industry_id: z.string().optional(),
  is_verified: z.boolean().optional(),
})

/**
 * Infer TypeScript type for search params
 */
export type ClientSearchValues = z.infer<typeof clientSearchSchema>

/**
 * Client ID validation schema
 */
export const clientIdSchema = z.string().length(25, 'Invalid client ID')

/**
 * Bulk operation schema
 */
export const bulkClientOperationSchema = z.object({
  client_ids: z.array(clientIdSchema).min(1, 'At least one client must be selected'),
  operation: z.enum(['activate', 'deactivate', 'archive', 'delete']),
  reason: z.string().optional(),
})

/**
 * Infer TypeScript type for bulk operations
 */
export type BulkClientOperationValues = z.infer<typeof bulkClientOperationSchema>
