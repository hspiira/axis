/**
 * React Query Hooks for Cases API
 *
 * SOLID Principles:
 * - Single Responsibility: Handle case data fetching and mutations
 * - Dependency Inversion: Depends on cases API abstraction
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  type Case,
} from '@/api/cases'
import { queryKeys } from '@/lib/react-query'

/**
 * Fetch all cases
 *
 * Features:
 * - Automatic caching and revalidation
 * - Loading and error states
 * - Refetch on window focus
 */
export function useCases(filters?: string) {
  return useQuery({
    queryKey: queryKeys.cases.list(filters),
    queryFn: () => getCases(),
    staleTime: 1000 * 60 * 3, // 3 minutes (cases change more frequently)
  })
}

/**
 * Fetch a single case by ID
 *
 * Features:
 * - Automatic caching per case
 * - Loading and error states
 */
export function useCase(id: string) {
  return useQuery({
    queryKey: queryKeys.cases.detail(id),
    queryFn: () => getCaseById(id),
    enabled: !!id, // Only fetch if ID exists
    staleTime: 1000 * 60 * 3, // 3 minutes
  })
}

/**
 * Create a new case
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useCreateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Case>) => createCase(data),
    onSuccess: () => {
      // Invalidate and refetch cases list
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all })
    },
  })
}

/**
 * Update an existing case
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useUpdateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Case> }) =>
      updateCase(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific case and list
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.lists() })
    },
  })
}

/**
 * Delete a case (soft delete)
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Success/error callbacks
 */
export function useDeleteCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCase(id),
    onSuccess: () => {
      // Invalidate cases list
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all })
    },
  })
}
