/**
 * Clients API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all client-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

// =========================================
// Enums (as const objects for erasableSyntaxOnly compatibility)
// =========================================

export const BaseStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
} as const

export type BaseStatus = (typeof BaseStatus)[keyof typeof BaseStatus]

export const ContactMethod = {
  EMAIL: 'Email',
  PHONE: 'Phone',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  OTHER: 'Other',
} as const

export type ContactMethod = (typeof ContactMethod)[keyof typeof ContactMethod]

export const ContactRole = {
  PRIMARY: 'Primary',
  BILLING: 'Billing',
  TECHNICAL: 'Technical',
  EXECUTIVE: 'Executive',
  LEGAL: 'Legal',
  OTHER: 'Other',
} as const

export type ContactRole = (typeof ContactRole)[keyof typeof ContactRole]

export const ActivityType = {
  NOTE: 'Note',
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  STATUS_CHANGE: 'StatusChange',
  CONTRACT_SIGNED: 'ContractSigned',
  PAYMENT_RECEIVED: 'PaymentReceived',
  DOCUMENT_UPLOADED: 'DocumentUploaded',
  VERIFICATION: 'Verification',
  OTHER: 'Other',
} as const

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType]

export const DocumentType = {
  CONTRACT: 'Contract',
  AGREEMENT: 'Agreement',
  INVOICE: 'Invoice',
  QUOTE: 'Quote',
  PROPOSAL: 'Proposal',
  REPORT: 'Report',
  CERTIFICATE: 'Certificate',
  LICENSE: 'License',
  ID_DOCUMENT: 'IDDocument',
  OTHER: 'Other',
} as const

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType]

// =========================================
// Industry Types
// =========================================

export interface Industry {
  id: string
  name: string
  code: string | null
  description: string | null
  parent: Industry | null
  external_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface IndustryFormData {
  name: string
  code?: string
  description?: string
  parent_id?: string
  external_id?: string
  metadata?: Record<string, unknown>
}

// =========================================
// Client Tag Types
// =========================================

export interface ClientTag {
  id: string
  name: string
  slug: string
  color: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface ClientTagList {
  id: string
  name: string
  slug: string
  color: string
  client_count?: number
}

export interface ClientTagFormData {
  name: string
  color?: string
  description?: string | null
}

// =========================================
// Client Contact Types
// =========================================

export interface ClientContact {
  id: string
  client: string
  client_name: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  mobile: string | null
  role: ContactRole | null
  title: string | null
  department: string | null
  is_primary: boolean
  preferred_contact_method: ContactMethod | null
  is_active: boolean
  notes: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ClientContactList {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  role: ContactRole | null
  title: string | null
  is_primary: boolean
  is_active: boolean
}

export interface ClientContactFormData {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  role?: ContactRole | null
  title?: string | null
  department?: string | null
  is_primary?: boolean
  preferred_contact_method?: ContactMethod | null
  is_active?: boolean
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

// =========================================
// Client Activity Types
// =========================================

export interface ClientActivity {
  id: string
  client: string
  client_name: string
  activity_type: ActivityType
  title: string
  description: string | null
  activity_date: string
  contact: string | null
  contact_name: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ClientActivityList {
  id: string
  activity_type: ActivityType
  title: string
  activity_date: string
  contact_name: string | null
  created_at: string
}

export interface ClientActivityFormData {
  activity_type: ActivityType
  title: string
  description?: string | null
  activity_date: string
  contact?: string | null
  metadata?: Record<string, unknown> | null
}

// =========================================
// Client Types
// =========================================
// Note: Client documents are now managed through the unified Document model
// See /api/documents/ with client filter: /api/documents/?client=<client_id>

export interface ClientList {
  id: string
  name: string
  email: string | null
  phone: string | null
  industry_name: string | null
  status: BaseStatus
  is_verified: boolean
  is_active: boolean
  tags: ClientTagList[]
  parent_client_name: string | null
  subsidiaries_count: number
  last_contact_date: string | null
  created_at: string
  updated_at: string
}

export interface ClientDetail extends ClientList {
  website: string | null
  address: string | null
  billing_address: string | null
  timezone: string | null
  tax_id: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  industry: {
    id: string
    name: string
    code: string | null
  } | null
  preferred_contact_method: ContactMethod | null
  verified_status: boolean
  primary_contact: {
    name?: string
    email?: string
    phone?: string
  } | null
  parent_client: string | null
  contacts_count: number
  activities_count: number
  documents_count: number
  notes: string | null
  metadata: Record<string, unknown> | null
  total_employees?: number
  active_contracts_count?: number
}

// For backward compatibility
export type Client = ClientDetail

// =========================================
// Form Types
// =========================================

export interface ClientFormData {
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  billing_address?: string | null
  timezone?: string | null
  tax_id?: string | null
  contact_person?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  industry_id?: string | null
  status?: BaseStatus
  preferred_contact_method?: ContactMethod | null
  is_verified?: boolean
  tag_ids?: string[]
  parent_client?: string | null
  last_contact_date?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

// =========================================
// Search & Filter Types
// =========================================

export interface ClientSearchParams {
  name?: string
  email?: string
  status?: BaseStatus
  industry_id?: string
  is_verified?: boolean
  contact_method?: ContactMethod
}

export interface StatusChangeData {
  reason?: string
  verified_by?: string
}

// =========================================
// API Response Types
// =========================================

interface PaginatedResponse<T> {
  results: T[]
  count: number
  page?: number
  page_size?: number
  total_pages?: number
}

// =========================================
// Client CRUD Operations
// =========================================

/**
 * Fetch all clients
 */
export async function getClients(): Promise<ClientList[]> {
  const response = await apiClient.get<PaginatedResponse<ClientList>>('/clients/')
  return response.data.results || response.data
}

/**
 * Fetch a single client by ID
 */
export async function getClientById(id: string): Promise<ClientDetail> {
  const response = await apiClient.get<ClientDetail>(`/clients/${id}/`)
  return response.data
}

/**
 * Create a new client
 */
export async function createClient(data: ClientFormData): Promise<ClientDetail> {
  const response = await apiClient.post<ClientDetail>('/clients/', data)
  return response.data
}

/**
 * Update an existing client
 */
export async function updateClient(id: string, data: Partial<ClientFormData>): Promise<ClientDetail> {
  const response = await apiClient.patch<ClientDetail>(`/clients/${id}/`, data)
  return response.data
}

/**
 * Delete a client (soft delete)
 */
export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}/`)
}

// =========================================
// Client Query Endpoints
// =========================================

/**
 * Get active clients
 */
export async function getActiveClients(): Promise<ClientList[]> {
  const response = await apiClient.get<ClientList[]>('/clients/active/')
  return response.data
}

/**
 * Get verified clients
 */
export async function getVerifiedClients(): Promise<ClientList[]> {
  const response = await apiClient.get<ClientList[]>('/clients/verified/')
  return response.data
}

/**
 * Get clients needing verification
 */
export async function getClientsNeedingVerification(): Promise<ClientList[]> {
  const response = await apiClient.get<ClientList[]>('/clients/needs_verification/')
  return response.data
}

/**
 * Get recent clients
 */
export async function getRecentClients(days: number = 30): Promise<ClientList[]> {
  const response = await apiClient.get<ClientList[]>('/clients/recent/', {
    params: { days },
  })
  return response.data
}

/**
 * Get clients by industry
 */
export async function getClientsByIndustry(industryId: string): Promise<ClientList[]> {
  const response = await apiClient.get<ClientList[]>(`/clients/industry/${industryId}/`)
  return response.data
}

/**
 * Search clients with filters
 */
export async function searchClients(params: ClientSearchParams): Promise<ClientList[]> {
  const response = await apiClient.get<ClientList[]>('/clients/search/', { params })
  return response.data
}

// =========================================
// Client Status Actions
// =========================================

/**
 * Activate a client
 */
export async function activateClient(id: string): Promise<ClientDetail> {
  const response = await apiClient.post<ClientDetail>(`/clients/${id}/activate/`)
  return response.data
}

/**
 * Deactivate a client
 */
export async function deactivateClient(id: string, reason?: string): Promise<ClientDetail> {
  const response = await apiClient.post<ClientDetail>(`/clients/${id}/deactivate/`, { reason })
  return response.data
}

/**
 * Archive a client
 */
export async function archiveClient(id: string, reason?: string): Promise<ClientDetail> {
  const response = await apiClient.post<ClientDetail>(`/clients/${id}/archive/`, { reason })
  return response.data
}

/**
 * Verify a client
 */
export async function verifyClient(id: string, verifiedBy?: string): Promise<ClientDetail> {
  const response = await apiClient.post<ClientDetail>(`/clients/${id}/verify/`, { verified_by: verifiedBy })
  return response.data
}

// =========================================
// Industry Operations
// =========================================

/**
 * Fetch all industries
 */
export async function getIndustries(): Promise<Industry[]> {
  const response = await apiClient.get<PaginatedResponse<Industry>>('/industries/')
  // Handle paginated response
  if (response.data.results) {
    return response.data.results
  }
  // Fallback for non-paginated response
  return Array.isArray(response.data) ? response.data : []
}

/**
 * Fetch a single industry by ID
 */
export async function getIndustryById(id: string): Promise<Industry> {
  const response = await apiClient.get<Industry>(`/industries/${id}/`)
  return response.data
}

/**
 * Create a new industry
 */
export async function createIndustry(data: IndustryFormData): Promise<Industry> {
  const response = await apiClient.post<Industry>('/industries/', data)
  return response.data
}

/**
 * Update an existing industry
 */
export async function updateIndustry(id: string, data: IndustryFormData): Promise<Industry> {
  const response = await apiClient.put<Industry>(`/industries/${id}/`, data)
  return response.data
}

/**
 * Delete an industry
 */
export async function deleteIndustry(id: string): Promise<void> {
  await apiClient.delete(`/industries/${id}/`)
}
