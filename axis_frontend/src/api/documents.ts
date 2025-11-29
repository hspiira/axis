/**
 * Documents API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all document-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

// =========================================
// Enums
// =========================================

export const DocumentType = {
  CONTRACT: 'contract',
  CERTIFICATION: 'certification',
  KPI_REPORT: 'kpi_report',
  FEEDBACK_SUMMARY: 'feedback_summary',
  BILLING_REPORT: 'billing_report',
  UTILIZATION_REPORT: 'utilization_report',
  OTHER: 'other',
} as const

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType]

export const DocumentStatus = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  EXPIRED: 'Expired',
} as const

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus]

// =========================================
// Types
// =========================================

export interface DocumentList {
  id: string
  title: string
  type: DocumentType
  status: DocumentStatus
  version: number
  is_latest: boolean
  uploaded_by_name: string | null
  client_name: string | null
  contract_start_date: string | null
  expiry_date: string | null
  is_confidential: boolean
  is_expired: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentDetail {
  id: string
  title: string
  description: string | null
  type: DocumentType
  file: string | null
  url: string | null
  file_url: string
  file_size: number | null
  file_type: string | null
  filename: string | null
  file_extension: string | null
  version: number
  is_latest: boolean
  previous_version_id: string | null
  status: DocumentStatus
  expiry_date: string | null
  is_confidential: boolean
  tags: string[]
  uploaded_by_email: string | null
  client_name: string | null
  client_id: string | null
  contract_start_date: string | null
  contract_id: string | null
  metadata: Record<string, unknown> | null
  is_expired: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DocumentVersion {
  id: string
  version: number
  url: string | null
  status: DocumentStatus
  is_latest: boolean
  uploaded_by_email: string | null
  created_at: string
  updated_at: string
}

export interface DocumentCreateInput {
  title: string
  type: DocumentType
  uploaded_by_id: string
  file?: File | null
  url?: string | null
  description?: string | null
  file_size?: number | null
  file_type?: string | null
  client_id?: string | null
  contract_id?: string | null
  expiry_date?: string | null
  is_confidential?: boolean
  tags?: string[]
  metadata?: Record<string, unknown> | null
}

export interface DocumentUpdateInput {
  title?: string
  description?: string | null
  type?: DocumentType
  file_size?: number | null
  file_type?: string | null
  expiry_date?: string | null
  is_confidential?: boolean
  tags?: string[]
  metadata?: Record<string, unknown> | null
}

export interface DocumentSearchParams {
  type?: DocumentType
  status?: DocumentStatus
  client_id?: string
  contract_id?: string
  uploaded_by_id?: string
  is_confidential?: boolean
  is_latest?: boolean
  search?: string
  page?: number
  page_size?: number
}

export interface DocumentExpiryInfo {
  has_expiry: boolean
  is_expired: boolean
  expiry_date: string | null
  days_until_expiry: number | null
  expires_soon: boolean
}

interface PaginatedResponse<T> {
  results: T[]
  count: number
  page?: number
  page_size?: number
  total_pages?: number
}

// =========================================
// API Functions
// =========================================

export const documentsApi = {
  /**
   * List all documents with optional filters
   */
  list: async (params?: DocumentSearchParams): Promise<PaginatedResponse<DocumentList> | DocumentList[]> => {
    const response = await apiClient.get<PaginatedResponse<DocumentList> | DocumentList[]>('/documents/', {
      params,
    })
    return response.data
  },

  /**
   * Get document by ID
   */
  get: async (id: string): Promise<DocumentDetail> => {
    const response = await apiClient.get<DocumentDetail>(`/documents/${id}/`)
    return response.data
  },

  /**
   * Create new document
   */
  create: async (data: DocumentCreateInput): Promise<DocumentDetail> => {
    const formData = new FormData()
    
    formData.append('title', data.title)
    formData.append('type', data.type)
    formData.append('uploaded_by_id', data.uploaded_by_id)
    
    if (data.file) {
      formData.append('file', data.file)
    }
    if (data.url) {
      formData.append('url', data.url)
    }
    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.file_size) {
      formData.append('file_size', data.file_size.toString())
    }
    if (data.file_type) {
      formData.append('file_type', data.file_type)
    }
    if (data.client_id) {
      formData.append('client_id', data.client_id)
    }
    if (data.contract_id) {
      formData.append('contract_id', data.contract_id)
    }
    if (data.expiry_date) {
      formData.append('expiry_date', data.expiry_date)
    }
    if (data.is_confidential !== undefined) {
      formData.append('is_confidential', data.is_confidential.toString())
    }
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tag) => formData.append('tags', tag))
    }
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata))
    }

    const response = await apiClient.post<DocumentDetail>('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Update document
   */
  update: async (id: string, data: DocumentUpdateInput): Promise<DocumentDetail> => {
    const response = await apiClient.patch<DocumentDetail>(`/documents/${id}/`, data)
    return response.data
  },

  /**
   * Delete document (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}/`)
  },

  /**
   * Publish document
   */
  publish: async (id: string): Promise<DocumentDetail> => {
    const response = await apiClient.post<DocumentDetail>(`/documents/${id}/publish/`)
    return response.data
  },

  /**
   * Archive document
   */
  archive: async (id: string, reason?: string): Promise<DocumentDetail> => {
    const response = await apiClient.post<DocumentDetail>(`/documents/${id}/archive/`, { reason })
    return response.data
  },

  /**
   * Create new version of document
   */
  createVersion: async (
    id: string,
    data: {
      file?: File | null
      url?: string | null
      uploaded_by_id: string
      description?: string | null
    }
  ): Promise<DocumentDetail> => {
    const formData = new FormData()
    
    formData.append('uploaded_by_id', data.uploaded_by_id)
    
    if (data.file) {
      formData.append('file', data.file)
    }
    if (data.url) {
      formData.append('url', data.url)
    }
    if (data.description) {
      formData.append('description', data.description)
    }

    const response = await apiClient.post<DocumentDetail>(`/documents/${id}/create-version/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Get version history for document
   */
  getVersionHistory: async (id: string): Promise<DocumentVersion[]> => {
    const response = await apiClient.get<DocumentVersion[]>(`/documents/${id}/version-history/`)
    return response.data
  },

  /**
   * Check document expiry status
   */
  checkExpiry: async (id: string): Promise<DocumentExpiryInfo> => {
    const response = await apiClient.get<DocumentExpiryInfo>(`/documents/${id}/check-expiry/`)
    return response.data
  },

  /**
   * Get documents expiring soon
   */
  getExpiringSoon: async (days: number = 30): Promise<DocumentList[]> => {
    const response = await apiClient.get<DocumentList[]>(`/documents/expiring-soon/?days=${days}`)
    return response.data
  },

  /**
   * Get expired documents
   */
  getExpired: async (): Promise<DocumentList[]> => {
    const response = await apiClient.get<DocumentList[]>('/documents/expired/')
    return response.data
  },

  /**
   * Get published documents
   */
  getPublished: async (): Promise<DocumentList[]> => {
    const response = await apiClient.get<DocumentList[]>('/documents/published/')
    return response.data
  },

  /**
   * Get latest versions only
   */
  getLatestVersions: async (): Promise<DocumentList[]> => {
    const response = await apiClient.get<DocumentList[]>('/documents/latest-versions/')
    return response.data
  },

  /**
   * Get confidential documents
   */
  getConfidential: async (): Promise<DocumentList[]> => {
    const response = await apiClient.get<DocumentList[]>('/documents/confidential/')
    return response.data
  },
}

