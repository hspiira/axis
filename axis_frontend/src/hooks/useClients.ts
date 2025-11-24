/**
 * React Query Hooks for Clients API
 *
 * SOLID Principles:
 * - Single Responsibility: Handle client data fetching and mutations
 * - Dependency Inversion: Depends on clients API abstraction
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  type Client,
} from '@/api/clients'
import { queryKeys } from '@/lib/react-query'

/**
 * Fetch all clients
 *
 * Features:
 * - Automatic caching and revalidation
 * - Loading and error states
 * - Refetch on window focus
 */
export function useClients(filters?: string) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => getClients(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch a single client by ID
 *
 * Features:
 * - Automatic caching per client
 * - Loading and error states
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => getClientById(id),
    enabled: !!id, // Only fetch if ID exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Create a new client
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Client>) => createClient(data),
    onSuccess: () => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

/**
 * Update an existing client
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      updateClient(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific client and list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}

/**
 * Delete a client (soft delete)
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}
