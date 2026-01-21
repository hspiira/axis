/**
 * Custom hooks for contract data management using React Query.
 *
 * SOLID Principles:
 * - Single Responsibility: Each hook manages a specific data operation
 * - Open/Closed: Easy to add new hooks without modifying existing ones
 * - Dependency Inversion: Depends on API abstractions, not direct fetch calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi, type ContractSearchParams, type ContractFormData } from '@/api/contracts'
import { toast } from '@/lib/toast'

const contractsQueryKey = 'contracts'

/**
 * Hook to fetch all contracts
 */
export function useContracts() {
  return useQuery({
    queryKey: [contractsQueryKey],
    queryFn: contractsApi.list,
    onError: (error) => {
      toast.error('Failed to fetch contracts', error)
    },
  })
}

/**
 * Hook to fetch a single contract
 */
export function useContract(id: string) {
  return useQuery({
    queryKey: [contractsQueryKey, id],
    queryFn: () => contractsApi.get(id),
    enabled: !!id, // Only run query if ID is provided
    onError: (error) => {
      toast.error(`Failed to fetch contract ${id}`, error)
    },
  })
}

/**
 * Hook to search contracts with filters
 */
export function useSearchContracts(params: ContractSearchParams) {
  return useQuery({
    queryKey: [contractsQueryKey, 'search', params],
    queryFn: () => contractsApi.search(params),
    enabled: Object.keys(params).length > 0, // Only run if filters are active
    onError: (error) => {
      toast.error('Failed to search contracts', error)
    },
  })
}

/**
 * Hook to create a new contract
 */
export function useCreateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ContractFormData) => contractsApi.create(data),
    onSuccess: (newContract) => {
      toast.success(`Contract for ${newContract.client.name} created successfully`)
      // Invalidate the main contracts list to refetch
      queryClient.invalidateQueries({ queryKey: [contractsQueryKey] })
    },
    onError: (error) => {
      toast.error('Failed to create contract', error)
    },
  })
}

/**
 * Hook to update a contract
 */
export function useUpdateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractFormData> }) =>
      contractsApi.update(id, data),
    onSuccess: (updatedContract) => {
      toast.success(`Contract for ${updatedContract.client.name} updated successfully`)
      // Invalidate both the list and the specific contract detail query
      queryClient.invalidateQueries({ queryKey: [contractsQueryKey] })
    },
    onError: (error) => {
      toast.error('Failed to update contract', error)
    },
  })
}

/**
 * Hook to delete a contract
 */
export function useDeleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contractsApi.delete(id),
    onSuccess: () => {
      toast.success('Contract deleted successfully')
      queryClient.invalidateQueries({ queryKey: [contractsQueryKey] })
    },
    onError: (error) => {
      toast.error('Failed to delete contract', error)
    },
  })
}

/**
 * Hook for contract lifecycle actions (activate, terminate, etc.)
 */
export function useContractAction<T = void>(
  action: (id: string, params?: T) => Promise<any>,
  actionName: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: T }) => action(id, params),
    onSuccess: (data, variables) => {
      toast.success(`Contract ${variables.id} ${actionName} successfully`)
      queryClient.invalidateQueries({ queryKey: [contractsQueryKey] })
    },
    onError: (error, variables) => {
      toast.error(`Failed to ${actionName.toLowerCase()} contract ${variables.id}`, error)
    },
  })
}