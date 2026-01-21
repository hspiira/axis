/**
 * Cases API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all case-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

export interface Case {
  id: string
  client: string
  beneficiary: string
  status: string
  created_at: string
  updated_at: string
}

/**
 * Fetch all cases
 */
export async function getCases(): Promise<Case[]> {
  const response = await apiClient.get<Case[]>('/cases/')
  return response.data
}

/**
 * Fetch a single case by ID
 */
export async function getCaseById(id: string): Promise<Case> {
  const response = await apiClient.get<Case>(`/cases/${id}/`)
  return response.data
}

/**
 * Create a new case
 */
export async function createCase(data: Partial<Case>): Promise<Case> {
  const response = await apiClient.post<Case>('/cases/', data)
  return response.data
}

/**
 * Update an existing case
 */
export async function updateCase(id: string, data: Partial<Case>): Promise<Case> {
  const response = await apiClient.patch<Case>(`/cases/${id}/`, data)
  return response.data
}

/**
 * Delete a case (soft delete)
 */
export async function deleteCase(id: string): Promise<void> {
  await apiClient.delete(`/cases/${id}/`)
}
