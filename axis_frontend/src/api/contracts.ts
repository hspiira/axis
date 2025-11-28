/**
 * Contracts API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all contract-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

// =========================================
// Enums
// =========================================

export const ContractStatus = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  RENEWED: 'Renewed',
  TERMINATED: 'Terminated',
} as const

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus]

export const PaymentStatus = {
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

// =========================================
// Types
// =========================================

export interface ContractClient {
  id: string
  name: string
  email: string | null
}

export interface ContractListItem {
  id: string
  client_name: string
  start_date: string
  end_date: string
  billing_rate: string
  currency: string
  status: ContractStatus
  payment_status: PaymentStatus
  is_active: boolean
  is_expired: boolean
  days_remaining: number
  created_at: string
  updated_at: string
}

export interface ContractDetail {
  id: string
  client: ContractClient | null
  start_date: string
  end_date: string
  renewal_date: string | null
  billing_rate: string
  currency: string
  payment_frequency: string | null
  payment_terms: string | null
  payment_status: PaymentStatus
  last_billing_date: string | null
  next_billing_date: string | null
  is_renewable: boolean
  is_auto_renew: boolean
  document_url: string | null
  signed_by: string | null
  signed_at: string | null
  status: ContractStatus
  termination_reason: string | null
  notes: string | null
  is_active: boolean
  is_expired: boolean
  is_pending_renewal: boolean
  days_remaining: number
  is_payment_overdue: boolean
  created_at: string
  updated_at: string
}

export interface ContractCreateInput {
  client_id: string
  start_date: string
  end_date: string
  billing_rate: number
  currency?: string
  payment_frequency?: string
  payment_terms?: string
  renewal_date?: string
  is_renewable?: boolean
  is_auto_renew?: boolean
  document_url?: string
  signed_by?: string
  signed_at?: string
  notes?: string
}

export interface ContractUpdateInput {
  start_date?: string
  end_date?: string
  billing_rate?: number
  currency?: string
  payment_frequency?: string
  payment_terms?: string
  renewal_date?: string
  is_renewable?: boolean
  is_auto_renew?: boolean
  document_url?: string
  signed_by?: string
  signed_at?: string
  notes?: string
}

// =========================================
// API Functions
// =========================================

export const contractsApi = {
  /**
   * List all contracts
   */
  list: async (): Promise<ContractListItem[]> => {
    const response = await apiClient.get<ContractListItem[]>('/contracts/')
    return response.data
  },

  /**
   * Get contract by ID
   */
  get: async (id: string): Promise<ContractDetail> => {
    const response = await apiClient.get<ContractDetail>(`/contracts/${id}/`)
    return response.data
  },

  /**
   * Create new contract
   */
  create: async (data: ContractCreateInput): Promise<ContractDetail> => {
    const response = await apiClient.post<ContractDetail>('/contracts/', data)
    return response.data
  },

  /**
   * Update contract
   */
  update: async (id: string, data: ContractUpdateInput): Promise<ContractDetail> => {
    const response = await apiClient.patch<ContractDetail>(`/contracts/${id}/`, data)
    return response.data
  },

  /**
   * Delete contract (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contracts/${id}/`)
  },

  /**
   * Get active contracts
   */
  getActive: async (): Promise<ContractListItem[]> => {
    const response = await apiClient.get<ContractListItem[]>('/contracts/active/')
    return response.data
  },

  /**
   * Get contracts by client
   */
  getByClient: async (clientId: string): Promise<ContractListItem[]> => {
    const response = await apiClient.get<ContractListItem[]>(`/contracts/client/${clientId}/`)
    return response.data
  },

  /**
   * Get contracts expiring soon
   */
  getExpiringSoon: async (days: number = 30): Promise<ContractListItem[]> => {
    const response = await apiClient.get<ContractListItem[]>(`/contracts/expiring_soon/?days=${days}`)
    return response.data
  },

  /**
   * Get contracts pending renewal
   */
  getPendingRenewal: async (): Promise<ContractListItem[]> => {
    const response = await apiClient.get<ContractListItem[]>('/contracts/pending_renewal/')
    return response.data
  },

  /**
   * Get contracts with overdue payments
   */
  getOverduePayments: async (): Promise<ContractListItem[]> => {
    const response = await apiClient.get<ContractListItem[]>('/contracts/overdue_payments/')
    return response.data
  },

  /**
   * Activate contract
   */
  activate: async (id: string): Promise<ContractDetail> => {
    const response = await apiClient.post<ContractDetail>(`/contracts/${id}/activate/`)
    return response.data
  },

  /**
   * Terminate contract
   */
  terminate: async (id: string, reason: string): Promise<ContractDetail> => {
    const response = await apiClient.post<ContractDetail>(`/contracts/${id}/terminate/`, { reason })
    return response.data
  },

  /**
   * Renew contract
   */
  renew: async (id: string, newEndDate: string, newBillingRate?: number): Promise<ContractDetail> => {
    const response = await apiClient.post<ContractDetail>(`/contracts/${id}/renew/`, {
      new_end_date: newEndDate,
      new_billing_rate: newBillingRate,
    })
    return response.data
  },

  /**
   * Mark payment as paid
   */
  markPaid: async (id: string): Promise<ContractDetail> => {
    const response = await apiClient.post<ContractDetail>(`/contracts/${id}/mark_paid/`)
    return response.data
  },

  /**
   * Mark payment as overdue
   */
  markOverdue: async (id: string): Promise<ContractDetail> => {
    const response = await apiClient.post<ContractDetail>(`/contracts/${id}/mark_overdue/`)
    return response.data
  },
}
