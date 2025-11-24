/**
 * Clients API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all client-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

// =========================================
// Enums
// =========================================

export enum BaseStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING = 'Pending',
  ARCHIVED = 'Archived',
  DELETED = 'Deleted',
}

export enum ContactMethod {
  EMAIL = 'Email',
  PHONE = 'Phone',
  SMS = 'SMS',
  WHATSAPP = 'WhatsApp',
  OTHER = 'Other',
}

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

// =========================================
// Client Types
// =========================================

export interface ClientList {
  id: string
  name: string
  email: string | null
  phone: string | null
  industry_name: string | null
  status: BaseStatus
  is_verified: boolean
  is_active: boolean
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
  notes: string | null
  metadata: Record<string, unknown> | null
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
