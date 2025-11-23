/**
 * Clients API Client
 *
 * SOLID Principles:
 * - Single Responsibility: Handle all client-related API requests
 * - Dependency Inversion: Depends on configured axios instance
 */

import { apiClient } from './axios-config'

export interface Client {
  id: string
  name: string
  industry: string
  status: string
  created_at: string
  updated_at: string
}

/**
 * Fetch all clients
 */
export async function getClients(): Promise<Client[]> {
  const response = await apiClient.get<Client[]>('/clients/')
  return response.data
}

/**
 * Fetch a single client by ID
 */
export async function getClientById(id: string): Promise<Client> {
  const response = await apiClient.get<Client>(`/clients/${id}/`)
  return response.data
}

/**
 * Create a new client
 */
export async function createClient(data: Partial<Client>): Promise<Client> {
  const response = await apiClient.post<Client>('/clients/', data)
  return response.data
}

/**
 * Update an existing client
 */
export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  const response = await apiClient.patch<Client>(`/clients/${id}/`, data)
  return response.data
}

/**
 * Delete a client (soft delete)
 */
export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}/`)
}
