/**
 * Services API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all service-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

// =========================================
// API Response Types
// =========================================

interface PaginatedResponse<T> {
  results: T[]
  count: number
  page?: number
  page_size?: number
  total_pages?: number
  next?: string | null
  previous?: string | null
}

// =========================================
// Enums
// =========================================

export const ServiceStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  ARCHIVED: 'Archived',
} as const

export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus]

export const SessionStatus = {
  SCHEDULED: 'Scheduled',
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
  NO_SHOW: 'No Show',
  POSTPONED: 'Postponed',
} as const

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]

export const ProviderStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
  SUSPENDED: 'Suspended',
  RESIGNED: 'Resigned',
} as const

export type ProviderStatus = (typeof ProviderStatus)[keyof typeof ProviderStatus]

export const ServiceProviderType = {
  COUNSELOR: 'Counselor',
  CLINIC: 'Clinic',
  HOTLINE: 'Hotline',
  COACH: 'Coach',
  OTHER: 'Other',
} as const

export type ServiceProviderType = (typeof ServiceProviderType)[keyof typeof ServiceProviderType]

// =========================================
// Service Category Types
// =========================================

export interface ServiceCategory {
  id: string
  name: string
  description: string | null
  parent: ServiceCategory | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ServiceCategoryList {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  parent_name: string | null
  service_count: number
  created_at: string
}

export interface ServiceCategoryFormData {
  name: string
  description?: string
  parent_id?: string
  metadata?: Record<string, unknown>
}

// =========================================
// Service Types
// =========================================

export interface Service {
  id: string
  name: string
  description: string | null
  category: ServiceCategory | null
  status: ServiceStatus
  duration_minutes: number | null
  default_price: string | null
  is_billable: boolean
  requires_provider: boolean
  max_sessions_per_person: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ServiceList {
  id: string
  name: string
  description: string | null
  category_id: string | null
  category_name: string | null
  status: ServiceStatus
  duration_minutes: number | null
  default_price: string | null
  is_billable: boolean
  requires_provider: boolean
  active_assignments: number
  total_sessions: number
  created_at: string
}

export interface ServiceFormData {
  name: string
  description?: string
  category_id?: string
  status: ServiceStatus
  duration_minutes?: number
  default_price?: string
  is_billable?: boolean
  requires_provider?: boolean
  max_sessions_per_person?: number
  metadata?: Record<string, unknown>
}

// =========================================
// Service Provider Types
// =========================================

export interface ServiceProvider {
  id: string
  name: string
  type: ServiceProviderType
  contact_email: string | null
  contact_phone: string | null
  location: string | null
  qualifications: unknown[] | null
  specializations: unknown[] | null
  availability: Record<string, unknown> | null
  rating: string | null
  is_verified: boolean
  status: ProviderStatus
  is_available: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ServiceProviderList {
  id: string
  name: string
  type: ServiceProviderType
  contact_email: string | null
  contact_phone: string | null
  location: string | null
  rating: string | null
  is_verified: boolean
  status: ProviderStatus
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface ServiceProviderFormData {
  name: string
  type: ServiceProviderType
  contact_email?: string
  contact_phone?: string
  location?: string
  qualifications?: unknown[]
  specializations?: unknown[]
  availability?: Record<string, unknown>
  rating?: string
  is_verified?: boolean
  status?: ProviderStatus
  metadata?: Record<string, unknown>
}

// =========================================
// Service Assignment Types
// =========================================

export interface ServiceAssignment {
  id: string
  service: Service
  client_id: string
  client_name: string
  contract_id: string | null
  contract_name: string | null
  person_id: string | null
  person_name: string | null
  assigned_sessions: number
  used_sessions: number
  start_date: string | null
  end_date: string | null
  status: ServiceStatus
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ServiceAssignmentList {
  id: string
  service_id: string
  service_name: string
  client_id: string
  client_name: string
  contract_id: string | null
  person_id: string | null
  person_name: string | null
  assigned_sessions: number
  used_sessions: number
  remaining_sessions: number
  start_date: string | null
  end_date: string | null
  status: ServiceStatus
  created_at: string
}

export interface ServiceAssignmentFormData {
  service_id: string
  client_id: string
  contract_id?: string
  person_id?: string
  assigned_sessions: number
  start_date?: string
  end_date?: string
  status?: ServiceStatus
  metadata?: Record<string, unknown>
}

// =========================================
// Service Session Types
// =========================================

export interface ServiceSession {
  id: string
  service: { id: string; name: string }
  provider: { id: string; name: string } | null
  person: { id: string; name: string }
  scheduled_at: string
  completed_at: string | null
  status: SessionStatus
  notes: string | null
  feedback: string | null
  duration: number | null
  location: string | null
  cancellation_reason: string | null
  reschedule_count: number
  is_group_session: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ServiceSessionList {
  id: string
  service_name: string
  provider_name: string | null
  person_name: string
  scheduled_at: string
  completed_at: string | null
  status: SessionStatus
  duration: number | null
  is_group_session: boolean
  created_at: string
  updated_at: string
}

export interface ServiceSessionFormData {
  service_id: string
  provider_id: string
  person_id: string
  scheduled_at: string
  status?: SessionStatus
  location?: string
  is_group_session?: boolean
  notes?: string
  metadata?: Record<string, unknown>
}

// =========================================
// Session Feedback Types
// =========================================

export interface SessionFeedback {
  id: string
  session: ServiceSession
  rating: number
  comments: string | null
  provider_rating: number | null
  service_rating: number | null
  would_recommend: boolean | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface SessionFeedbackList {
  id: string
  session_id: string
  service_name: string
  provider_name: string | null
  rating: number
  provider_rating: number | null
  service_rating: number | null
  would_recommend: boolean | null
  created_at: string
}

export interface SessionFeedbackFormData {
  session_id: string
  rating: number
  comments?: string
  provider_rating?: number
  service_rating?: number
  would_recommend?: boolean
  metadata?: Record<string, unknown>
}

// =========================================
// Search Parameters
// =========================================

export interface ServiceSearchParams {
  search?: string
  category_id?: string
  status?: ServiceStatus
  is_billable?: boolean
  requires_provider?: boolean
}

export interface ProviderSearchParams {
  search?: string
  type?: ServiceProviderType
  status?: ProviderStatus
  is_verified?: boolean
  location?: string
}

export interface AssignmentSearchParams {
  search?: string
  client_id?: string
  service_id?: string
  status?: ServiceStatus
}

export interface SessionSearchParams {
  search?: string
  service_id?: string
  provider_id?: string
  person_id?: string
  status?: SessionStatus
  is_group_session?: boolean
  date_from?: string
  date_to?: string
}

// =========================================
// Service Category API Functions
// =========================================

export const getServiceCategories = async (): Promise<ServiceCategoryList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceCategoryList>>('/services/categories/')
  // Handle paginated response
  if (response.data.results) {
    return response.data.results
  }
  // Fallback for non-paginated response
  return response.data as unknown as ServiceCategoryList[]
}

export const getServiceCategory = async (id: string): Promise<ServiceCategory> => {
  const response = await apiClient.get(`/services/categories/${id}/`)
  return response.data
}

export const searchServiceCategories = async (params: { search?: string }): Promise<ServiceCategoryList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceCategoryList>>('/services/categories/search/', { params })
  // Handle paginated response
  if (response.data.results) {
    return response.data.results
  }
  // Fallback for non-paginated response
  return response.data as unknown as ServiceCategoryList[]
}

export const createServiceCategory = async (data: ServiceCategoryFormData): Promise<ServiceCategory> => {
  const response = await apiClient.post('/services/categories/', data)
  return response.data
}

export const updateServiceCategory = async (id: string, data: ServiceCategoryFormData): Promise<ServiceCategory> => {
  const response = await apiClient.put(`/services/categories/${id}/`, data)
  return response.data
}

export const deleteServiceCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/categories/${id}/`)
}

// =========================================
// Service API Functions
// =========================================

export const getServices = async (): Promise<ServiceList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceList>>('/services/services/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceList[]
}

export const getService = async (id: string): Promise<Service> => {
  const response = await apiClient.get(`/services/services/${id}/`)
  return response.data
}

export const searchServices = async (params: ServiceSearchParams): Promise<ServiceList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceList>>('/services/services/search/', { params })
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceList[]
}

export const getAvailableServices = async (): Promise<ServiceList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceList>>('/services/services/available/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceList[]
}

export const getCatalogServices = async (): Promise<ServiceList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceList>>('/services/services/catalog/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceList[]
}

export const createService = async (data: ServiceFormData): Promise<Service> => {
  const response = await apiClient.post('/services/services/', data)
  return response.data
}

export const updateService = async (id: string, data: ServiceFormData): Promise<Service> => {
  const response = await apiClient.put(`/services/services/${id}/`, data)
  return response.data
}

export const activateService = async (id: string): Promise<Service> => {
  const response = await apiClient.post(`/services/services/${id}/activate/`)
  return response.data
}

export const deactivateService = async (id: string): Promise<Service> => {
  const response = await apiClient.post(`/services/services/${id}/deactivate/`)
  return response.data
}

export const deleteService = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/services/${id}/`)
}

// =========================================
// Service Provider API Functions
// =========================================

export const getProviders = async (): Promise<ServiceProviderList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceProviderList>>('/services/providers/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceProviderList[]
}

export const getProvider = async (id: string): Promise<ServiceProvider> => {
  const response = await apiClient.get(`/services/providers/${id}/`)
  return response.data
}

export const searchProviders = async (params: ProviderSearchParams): Promise<ServiceProviderList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceProviderList>>('/services/providers/search/', { params })
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceProviderList[]
}

export const getAvailableProviders = async (): Promise<ServiceProviderList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceProviderList>>('/services/providers/available/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceProviderList[]
}

export const createProvider = async (data: ServiceProviderFormData): Promise<ServiceProvider> => {
  const response = await apiClient.post('/services/providers/', data)
  return response.data
}

export const updateProvider = async (id: string, data: ServiceProviderFormData): Promise<ServiceProvider> => {
  const response = await apiClient.put(`/services/providers/${id}/`, data)
  return response.data
}

export const verifyProvider = async (id: string): Promise<ServiceProvider> => {
  const response = await apiClient.post(`/services/providers/${id}/verify/`)
  return response.data
}

export const updateProviderRating = async (id: string, rating: number): Promise<ServiceProvider> => {
  const response = await apiClient.post(`/services/providers/${id}/update_rating/`, { rating })
  return response.data
}

export const deleteProvider = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/providers/${id}/`)
}

// =========================================
// Service Assignment API Functions
// =========================================

export const getAssignments = async (): Promise<ServiceAssignmentList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceAssignmentList>>('/services/assignments/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceAssignmentList[]
}

export const getAssignment = async (id: string): Promise<ServiceAssignment> => {
  const response = await apiClient.get(`/services/assignments/${id}/`)
  return response.data
}

export const searchAssignments = async (params: AssignmentSearchParams): Promise<ServiceAssignmentList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceAssignmentList>>('/services/assignments/search/', { params })
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceAssignmentList[]
}

export const getCurrentAssignments = async (): Promise<ServiceAssignmentList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceAssignmentList>>('/services/assignments/current/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceAssignmentList[]
}

export const getClientAssignments = async (clientId: string): Promise<ServiceAssignmentList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceAssignmentList>>(`/services/assignments/client/${clientId}/`)
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceAssignmentList[]
}

export const createAssignment = async (data: ServiceAssignmentFormData): Promise<ServiceAssignment> => {
  const response = await apiClient.post('/services/assignments/', data)
  return response.data
}

export const updateAssignment = async (id: string, data: ServiceAssignmentFormData): Promise<ServiceAssignment> => {
  const response = await apiClient.put(`/services/assignments/${id}/`, data)
  return response.data
}

export const deleteAssignment = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/assignments/${id}/`)
}

// =========================================
// Service Session API Functions
// =========================================

export const getSessions = async (): Promise<ServiceSessionList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceSessionList>>('/services/sessions/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceSessionList[]
}

export const getSession = async (id: string): Promise<ServiceSession> => {
  const response = await apiClient.get(`/services/sessions/${id}/`)
  return response.data
}

export const searchSessions = async (params: SessionSearchParams): Promise<ServiceSessionList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceSessionList>>('/services/sessions/search/', { params })
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceSessionList[]
}

export const getUpcomingSessions = async (): Promise<ServiceSessionList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceSessionList>>('/services/sessions/upcoming/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceSessionList[]
}

export const getPersonSessions = async (personId: string): Promise<ServiceSessionList[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceSessionList>>(`/services/sessions/person/${personId}/`)
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as ServiceSessionList[]
}

export const createSession = async (data: ServiceSessionFormData): Promise<ServiceSession> => {
  const response = await apiClient.post('/services/sessions/', data)
  return response.data
}

export const updateSession = async (id: string, data: ServiceSessionFormData): Promise<ServiceSession> => {
  const response = await apiClient.post(`/services/sessions/${id}/`, data)
  return response.data
}

export const completeSession = async (id: string, notes?: string): Promise<ServiceSession> => {
  const response = await apiClient.post(`/services/sessions/${id}/complete/`, { notes })
  return response.data
}

export const cancelSession = async (id: string, reason: string): Promise<ServiceSession> => {
  const response = await apiClient.post(`/services/sessions/${id}/cancel/`, { reason })
  return response.data
}

export const rescheduleSession = async (id: string, scheduled_at: string): Promise<ServiceSession> => {
  const response = await apiClient.post(`/services/sessions/${id}/reschedule/`, { scheduled_at })
  return response.data
}

export const deleteSession = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/sessions/${id}/`)
}

// =========================================
// Session Feedback API Functions
// =========================================

export const getFeedbacks = async (): Promise<SessionFeedbackList[]> => {
  const response = await apiClient.get<PaginatedResponse<SessionFeedbackList>>('/services/feedback/')
  if (response.data.results) {
    return response.data.results
  }
  return response.data as unknown as SessionFeedbackList[]
}

export const getFeedback = async (id: string): Promise<SessionFeedback> => {
  const response = await apiClient.get(`/services/feedback/${id}/`)
  return response.data
}

export const getProviderAverageRating = async (providerId: string): Promise<{ average_rating: number }> => {
  const response = await apiClient.get(`/services/feedback/provider-rating/${providerId}/`)
  return response.data
}

export const getServiceAverageRating = async (serviceId: string): Promise<{ average_rating: number }> => {
  const response = await apiClient.get(`/services/feedback/service-rating/${serviceId}/`)
  return response.data
}

export const createFeedback = async (data: SessionFeedbackFormData): Promise<SessionFeedback> => {
  const response = await apiClient.post('/services/feedback/', data)
  return response.data
}

export const updateFeedback = async (id: string, data: SessionFeedbackFormData): Promise<SessionFeedback> => {
  const response = await apiClient.put(`/services/feedback/${id}/`, data)
  return response.data
}

export const deleteFeedback = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/feedback/${id}/`)
}
