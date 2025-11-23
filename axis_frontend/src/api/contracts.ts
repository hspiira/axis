/**
 * Contracts API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all contract-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

export interface Contract {
  id: string
  client: string
  provider_name: string
  status: string
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Fetch all contracts
 */
export async function getContracts(): Promise<Contract[]> {
  const response = await apiClient.get<Contract[]>('/contracts/')
  return response.data
}

/**
 * Fetch a single contract by ID
 */
export async function getContractById(id: string): Promise<Contract> {
  const response = await apiClient.get<Contract>(`/contracts/${id}/`)
  return response.data
}

/**
 * Create a new contract
 */
export async function createContract(data: Partial<Contract>): Promise<Contract> {
  const response = await apiClient.post<Contract>('/contracts/', data)
  return response.data
}

/**
 * Update an existing contract
 */
export async function updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
  const response = await apiClient.patch<Contract>(`/contracts/${id}/`, data)
  return response.data
}

/**
 * Delete a contract (soft delete)
 */
export async function deleteContract(id: string): Promise<void> {
  await apiClient.delete(`/contracts/${id}/`)
}
