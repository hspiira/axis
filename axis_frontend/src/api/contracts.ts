/**
 * API functions for interacting with the contracts endpoint.
 *
 * SOLID Principles:
 * - Single Responsibility: Functions for contract-related API calls
 * - Open/Closed: Extensible with new contract API functions
 * - Dependency Inversion: Depends on apiClient abstraction
 */

import { apiClient } from './axios-config'
import type { Paginated } from '@/types/api'

// === Enums & Types ===

export enum ContractStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  RENEWED = 'Renewed',
  TERMINATED = 'Terminated',
}

export enum PaymentStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  OVERDUE = 'Overdue',
}

export interface ContractList {
  id: string
  client_name: string
  start_date: string
  end_date: string
  billing_rate: number
  currency: string
  status: ContractStatus
  payment_status: PaymentStatus
  is_active: boolean
  is_expired: boolean
  days_remaining: number
  created_at: string
  updated_at: string
}

export interface ContractDetail extends Omit<ContractList, 'client_name'> {
  client: {
    id: string
    name: string
    email: string
  }
  renewal_date?: string
  payment_frequency?: string
  payment_terms?: string
  last_billing_date?: string
  next_billing_date?: string
  is_renewable: boolean
  is_auto_renew: boolean
  document_url?: string
  signed_by?: string
  signed_at?: string
  termination_reason?: string
  notes?: string
  is_pending_renewal: boolean
  is_payment_overdue: boolean
}

export type ContractFormData = {
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

export type ContractSearchParams = {
  search?: string
  client_id?: string
  status?: ContractStatus
  payment_status?: PaymentStatus
  is_renewable?: boolean
  is_auto_renew?: boolean
  page?: number
  page_size?: number
}

// === API Functions ===

/**
 * Fetch all contracts
 */
export async function getContracts(): Promise<ContractList[]> {
  const response = await apiClient.get<Paginated<ContractList>>('/contracts/')
  return response.data.results
}

/**
 * Fetch a single contract by ID
 */
export async function getContract(id: string): Promise<ContractDetail> {
  const response = await apiClient.get<ContractDetail>(`/contracts/${id}/`)
  return response.data
}

/**
 * Create a new contract
 */
export async function createContract(data: ContractFormData): Promise<ContractDetail> {
  const response = await apiClient.post<ContractDetail>('/contracts/', data)
  return response.data
}

/**
 * Update an existing contract
 */
export async function updateContract(id: string, data: Partial<ContractFormData>): Promise<ContractDetail> {
  const response = await apiClient.patch<ContractDetail>(`/contracts/${id}/`, data)
  return response.data
}

/**
 * Delete a contract
 */
export async function deleteContract(id: string): Promise<void> {
  await apiClient.delete(`/contracts/${id}/`)
}

/**
 * Search contracts with filters
 */
export async function searchContracts(params: ContractSearchParams): Promise<ContractList[]> {
  const response = await apiClient.get<Paginated<ContractList>>('/contracts/search/', { params })
  return response.data.results
}

/**
 * Activate a contract
 */
export async function activateContract(id: string): Promise<ContractDetail> {
    const response = await apiClient.post(`/contracts/${id}/activate/`);
    return response.data;
}

/**
 * Terminate a contract
 */
export async function terminateContract(id: string, reason: string): Promise<ContractDetail> {
    const response = await apiClient.post(`/contracts/${id}/terminate/`, { reason });
    return response.data;
}

/**
 * Renew a contract
 */
export async function renewContract(id: string, new_end_date: string, new_billing_rate?: number): Promise<ContractDetail> {
    const response = await apiClient.post(`/contracts/${id}/renew/`, { new_end_date, new_billing_rate });
    return response.data;
}

/**
 * Mark a contract payment as paid
 */
export async function markContractPaid(id: string): Promise<ContractDetail> {
    const response = await apiClient.post(`/contracts/${id}/mark_paid/`);
    return response.data;
}

// Export a centralized API object
export const contractsApi = {
  list: getContracts,
  get: getContract,
  create: createContract,
  update: updateContract,
  delete: deleteContract,
  search: searchContracts,
  activate: activateContract,
  terminate: terminateContract,
  renew: renewContract,
  markPaid: markContractPaid,
}