/**
 * React Query Hooks for Persons API
 *
 * SOLID Principles:
 * - Single Responsibility: Handle person data fetching and mutations
 * - Dependency Inversion: Depends on persons API abstraction
 * - Open/Closed: Easy to extend with new queries/mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personsApi, type PersonListItem, type EmploymentStatus } from '@/api/persons'
import { queryKeys } from '@/lib/react-query'
import { toast } from '@/lib/toast'

// =========================================
// Person Queries
// =========================================

/**
 * Fetch persons by client ID
 * 
 * Single Responsibility: Fetch persons for a specific client
 * 
 * @param clientId - Client ID to fetch persons for
 * @param filters - Optional filters (status, page, page_size)
 */
export function usePersonsByClient(
  clientId: string,
  filters?: {
    status?: EmploymentStatus
    page?: number
    page_size?: number
  }
) {
  return useQuery({
    queryKey: queryKeys.persons.byClient(
      clientId,
      filters ? JSON.stringify(filters) : undefined
    ),
    queryFn: () => personsApi.getByClient(clientId, filters),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch all persons with optional filters
 * 
 * Single Responsibility: Fetch all persons with filtering
 */
export function usePersons(filters?: {
  person_type?: string
  status?: string
  employment_status?: string
  client_id?: string
  is_eligible?: boolean
  search?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: queryKeys.persons.list(filters ? JSON.stringify(filters) : undefined),
    queryFn: () => personsApi.list(filters),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch a single person by ID
 * 
 * Single Responsibility: Fetch person details
 */
export function usePerson(id: string) {
  return useQuery({
    queryKey: queryKeys.persons.detail(id),
    queryFn: () => personsApi.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// =========================================
// Person Mutations
// =========================================

/**
 * Create employee mutation
 * 
 * Single Responsibility: Handle employee creation
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: personsApi.createEmployee,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
      toast.success('Employee created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee')
    },
  })
}

/**
 * Create dependent mutation
 * 
 * Single Responsibility: Handle dependent creation
 */
export function useCreateDependent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: personsApi.createDependent,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
      toast.success('Dependent created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create dependent')
    },
  })
}

/**
 * Delete person mutation
 * 
 * Single Responsibility: Handle person deletion
 */
export function useDeletePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: personsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
      toast.success('Person deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete person')
    },
  })
}

/**
 * Activate person mutation
 * 
 * Single Responsibility: Handle person activation
 */
export function useActivatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: personsApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
      toast.success('Person activated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate person')
    },
  })
}

/**
 * Deactivate person mutation
 * 
 * Single Responsibility: Handle person deactivation
 */
export function useDeactivatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => personsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.persons.all })
      toast.success('Person deactivated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate person')
    },
  })
}

