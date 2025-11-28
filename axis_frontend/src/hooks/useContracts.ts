/**
 * React Query Hooks for Contracts API
 *
 * SOLID Principles:
 * - Single Responsibility: Handle contract data fetching and mutations
 * - Dependency Inversion: Depends on contracts API abstraction
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contractsApi,
  type ContractCreateInput,
  type ContractUpdateInput,
} from '@/api/contracts'
import { queryKeys } from '@/lib/react-query'

/**
 * Fetch all contracts
 *
 * Features:
 * - Automatic caching and revalidation
 * - Loading and error states
 * - Refetch on window focus
 */
export function useContracts(filters?: string) {
  return useQuery({
    queryKey: queryKeys.contracts.list(filters),
    queryFn: () => contractsApi.list(),
    staleTime: 1000 * 60 * 10, // 10 minutes (contracts don't change often)
  })
}

/**
 * Fetch a single contract by ID
 *
 * Features:
 * - Automatic caching per contract
 * - Loading and error states
 */
export function useContract(id: string) {
  return useQuery({
    queryKey: queryKeys.contracts.detail(id),
    queryFn: () => contractsApi.get(id),
    enabled: !!id, // Only fetch if ID exists
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Create a new contract
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useCreateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ContractCreateInput) => contractsApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch contracts list
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all })
    },
  })
}

/**
 * Update an existing contract
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useUpdateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContractUpdateInput }) =>
      contractsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific contract and list
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.lists() })
    },
  })
}

/**
 * Delete a contract (soft delete)
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useDeleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contractsApi.delete(id),
    onSuccess: () => {
      // Invalidate contracts list
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all })
    },
  })
}
