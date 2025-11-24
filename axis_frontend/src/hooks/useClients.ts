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
  getActiveClients,
  getVerifiedClients,
  getClientsNeedingVerification,
  getRecentClients,
  getClientsByIndustry,
  searchClients,
  activateClient,
  deactivateClient,
  archiveClient,
  verifyClient,
  getIndustries,
  getIndustryById,
  type ClientFormData,
  type ClientSearchParams,
} from '@/api/clients'
import { queryKeys } from '@/lib/react-query'
import { toast } from '@/lib/toast'

// =========================================
// Client Queries
// =========================================

/**
 * Fetch all clients
 */
export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients.list(),
    queryFn: () => getClients(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch a single client by ID
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => getClientById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get active clients
 */
export function useActiveClients() {
  return useQuery({
    queryKey: [...queryKeys.clients.all, 'active'],
    queryFn: () => getActiveClients(),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get verified clients
 */
export function useVerifiedClients() {
  return useQuery({
    queryKey: [...queryKeys.clients.all, 'verified'],
    queryFn: () => getVerifiedClients(),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get clients needing verification
 */
export function useClientsNeedingVerification() {
  return useQuery({
    queryKey: [...queryKeys.clients.all, 'needs-verification'],
    queryFn: () => getClientsNeedingVerification(),
    staleTime: 1000 * 60 * 2, // 2 minutes - more frequent for actionable data
  })
}

/**
 * Get recent clients
 */
export function useRecentClients(days: number = 30) {
  return useQuery({
    queryKey: [...queryKeys.clients.all, 'recent', days],
    queryFn: () => getRecentClients(days),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Get clients by industry
 */
export function useClientsByIndustry(industryId: string) {
  return useQuery({
    queryKey: [...queryKeys.clients.all, 'industry', industryId],
    queryFn: () => getClientsByIndustry(industryId),
    enabled: !!industryId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Search clients with filters
 */
export function useSearchClients(params: ClientSearchParams) {
  return useQuery({
    queryKey: [...queryKeys.clients.all, 'search', params],
    queryFn: () => searchClients(params),
    enabled: Object.keys(params).length > 0, // Only search if params exist
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
  })
}

// =========================================
// Client Mutations
// =========================================

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClientFormData) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      toast.success('Client created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create client')
    },
  })
}

/**
 * Update an existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientFormData> }) =>
      updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      toast.success('Client updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update client')
    },
  })
}

/**
 * Delete a client (soft delete)
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      toast.success('Client deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete client')
    },
  })
}

// =========================================
// Client Status Actions
// =========================================

/**
 * Activate a client
 */
export function useActivateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activateClient(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      toast.success('Client activated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate client')
    },
  })
}

/**
 * Deactivate a client
 */
export function useDeactivateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      deactivateClient(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      toast.success('Client deactivated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate client')
    },
  })
}

/**
 * Archive a client
 */
export function useArchiveClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      archiveClient(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      toast.success('Client archived successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive client')
    },
  })
}

/**
 * Verify a client
 */
export function useVerifyClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, verifiedBy }: { id: string; verifiedBy?: string }) =>
      verifyClient(id, verifiedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      toast.success('Client verified successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify client')
    },
  })
}

// =========================================
// Industry Queries
// =========================================

/**
 * Fetch all industries
 */
export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: () => getIndustries(),
    staleTime: 1000 * 60 * 10, // 10 minutes - industries don't change often
  })
}

/**
 * Fetch a single industry by ID
 */
export function useIndustry(id: string) {
  return useQuery({
    queryKey: ['industries', id],
    queryFn: () => getIndustryById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  })
}
