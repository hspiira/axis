/**
 * React Query Hooks for Services API
 *
 * SOLID Principles:
 * - Single Responsibility: Handle service data fetching and mutations
 * - Dependency Inversion: Depends on services API abstraction
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  // Services
  getServices,
  getService,
  searchServices,
  getAvailableServices,
  getCatalogServices,
  createService,
  updateService,
  activateService,
  deactivateService,
  deleteService,
  // Categories
  getServiceCategories,
  getServiceCategory,
  searchServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  // Providers
  getProviders,
  getProvider,
  searchProviders,
  getAvailableProviders,
  createProvider,
  updateProvider,
  verifyProvider,
  deleteProvider,
  // Assignments
  getAssignments,
  getAssignment,
  searchAssignments,
  getCurrentAssignments,
  getClientAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  // Sessions
  getSessions,
  getSession,
  searchSessions,
  getUpcomingSessions,
  getPersonSessions,
  createSession,
  updateSession,
  completeSession,
  cancelSession,
  rescheduleSession,
  deleteSession,
  // Feedback
  getFeedbacks,
  getFeedback,
  getProviderAverageRating,
  getServiceAverageRating,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  type ServiceFormData,
  type ServiceSearchParams,
  type ServiceCategoryFormData,
  type ServiceProviderFormData,
  type ProviderSearchParams,
  type ServiceAssignmentFormData,
  type AssignmentSearchParams,
  type ServiceSessionFormData,
  type SessionSearchParams,
  type SessionFeedbackFormData,
} from '@/api/services'
import { queryKeys } from '@/lib/react-query'
import { toast } from '@/lib/toast'

// =========================================
// Service Queries
// =========================================

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.list(),
    queryFn: () => getServices(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => getService(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSearchServices(params: ServiceSearchParams) {
  return useQuery({
    queryKey: [...queryKeys.services.all, 'search', params],
    queryFn: () => searchServices(params),
    enabled: Object.keys(params).length > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useAvailableServices() {
  return useQuery({
    queryKey: [...queryKeys.services.all, 'available'],
    queryFn: () => getAvailableServices(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCatalogServices() {
  return useQuery({
    queryKey: [...queryKeys.services.all, 'catalog'],
    queryFn: () => getCatalogServices(),
    staleTime: 1000 * 60 * 10,
  })
}

// =========================================
// Service Mutations
// =========================================

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceFormData) => createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      toast.success('Service created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create service')
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormData }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      toast.success('Service updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update service')
    },
  })
}

export function useActivateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activateService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      toast.success('Service activated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate service')
    },
  })
}

export function useDeactivateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      toast.success('Service deactivated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate service')
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      toast.success('Service deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete service')
    },
  })
}

// =========================================
// Service Category Queries
// =========================================

export function useServiceCategories() {
  return useQuery({
    queryKey: queryKeys.serviceCategories.list(),
    queryFn: () => getServiceCategories(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useServiceCategory(id: string) {
  return useQuery({
    queryKey: queryKeys.serviceCategories.detail(id),
    queryFn: () => getServiceCategory(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  })
}

export function useSearchServiceCategories(search?: string) {
  return useQuery({
    queryKey: [...queryKeys.serviceCategories.all, 'search', search],
    queryFn: () => searchServiceCategories({ search }),
    enabled: !!search,
    staleTime: 1000 * 60 * 5,
  })
}

// =========================================
// Service Category Mutations
// =========================================

export function useCreateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceCategoryFormData) => createServiceCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceCategories.all })
      toast.success('Category created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category')
    },
  })
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceCategoryFormData }) => updateServiceCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceCategories.all })
      toast.success('Category updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category')
    },
  })
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteServiceCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceCategories.all })
      toast.success('Category deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category')
    },
  })
}

// =========================================
// Service Provider Queries
// =========================================

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.serviceProviders.list(),
    queryFn: () => getProviders(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: queryKeys.serviceProviders.detail(id),
    queryFn: () => getProvider(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSearchProviders(params: ProviderSearchParams) {
  return useQuery({
    queryKey: [...queryKeys.serviceProviders.all, 'search', params],
    queryFn: () => searchProviders(params),
    enabled: Object.keys(params).length > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useAvailableProviders() {
  return useQuery({
    queryKey: [...queryKeys.serviceProviders.all, 'available'],
    queryFn: () => getAvailableProviders(),
    staleTime: 1000 * 60 * 5,
  })
}

// =========================================
// Service Provider Mutations
// =========================================

export function useCreateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceProviderFormData) => createProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceProviders.all })
      toast.success('Provider created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create provider')
    },
  })
}

export function useUpdateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceProviderFormData }) => updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceProviders.all })
      toast.success('Provider updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update provider')
    },
  })
}

export function useVerifyProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => verifyProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceProviders.all })
      toast.success('Provider verified successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify provider')
    },
  })
}

export function useDeleteProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceProviders.all })
      toast.success('Provider deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete provider')
    },
  })
}

// =========================================
// Service Assignment Queries
// =========================================

export function useAssignments() {
  return useQuery({
    queryKey: queryKeys.serviceAssignments.list(),
    queryFn: () => getAssignments(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: queryKeys.serviceAssignments.detail(id),
    queryFn: () => getAssignment(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSearchAssignments(params: AssignmentSearchParams) {
  return useQuery({
    queryKey: [...queryKeys.serviceAssignments.all, 'search', params],
    queryFn: () => searchAssignments(params),
    enabled: Object.keys(params).length > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCurrentAssignments() {
  return useQuery({
    queryKey: [...queryKeys.serviceAssignments.all, 'current'],
    queryFn: () => getCurrentAssignments(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useClientAssignments(clientId: string) {
  return useQuery({
    queryKey: [...queryKeys.serviceAssignments.all, 'client', clientId],
    queryFn: () => getClientAssignments(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  })
}

// =========================================
// Service Assignment Mutations
// =========================================

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceAssignmentFormData) => createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceAssignments.all })
      toast.success('Assignment created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create assignment')
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceAssignmentFormData }) => updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceAssignments.all })
      toast.success('Assignment updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update assignment')
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceAssignments.all })
      toast.success('Assignment deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete assignment')
    },
  })
}

// =========================================
// Service Session Queries
// =========================================

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.serviceSessions.list(),
    queryFn: () => getSessions(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: queryKeys.serviceSessions.detail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

export function useSearchSessions(params: SessionSearchParams) {
  return useQuery({
    queryKey: [...queryKeys.serviceSessions.all, 'search', params],
    queryFn: () => searchSessions(params),
    enabled: Object.keys(params).length > 0,
    staleTime: 1000 * 60 * 1,
  })
}

export function useUpcomingSessions() {
  return useQuery({
    queryKey: [...queryKeys.serviceSessions.all, 'upcoming'],
    queryFn: () => getUpcomingSessions(),
    staleTime: 1000 * 60 * 2,
  })
}

export function usePersonSessions(personId: string) {
  return useQuery({
    queryKey: [...queryKeys.serviceSessions.all, 'person', personId],
    queryFn: () => getPersonSessions(personId),
    enabled: !!personId,
    staleTime: 1000 * 60 * 2,
  })
}

// =========================================
// Service Session Mutations
// =========================================

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceSessionFormData) => createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceSessions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceAssignments.all })
      toast.success('Session created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create session')
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceSessionFormData }) => updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceSessions.all })
      toast.success('Session updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update session')
    },
  })
}

export function useCompleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => completeSession(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceSessions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceAssignments.all })
      toast.success('Session completed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete session')
    },
  })
}

export function useCancelSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelSession(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceSessions.all })
      toast.success('Session cancelled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel session')
    },
  })
}

export function useRescheduleSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, scheduled_date, scheduled_time }: { id: string; scheduled_date: string; scheduled_time?: string }) =>
      rescheduleSession(id, scheduled_date, scheduled_time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceSessions.all })
      toast.success('Session rescheduled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reschedule session')
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceSessions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceAssignments.all })
      toast.success('Session deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete session')
    },
  })
}

// =========================================
// Session Feedback Queries
// =========================================

export function useFeedbacks() {
  return useQuery({
    queryKey: queryKeys.sessionFeedbacks.list(),
    queryFn: () => getFeedbacks(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useFeedback(id: string) {
  return useQuery({
    queryKey: queryKeys.sessionFeedbacks.detail(id),
    queryFn: () => getFeedback(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useProviderAverageRating(providerId: string) {
  return useQuery({
    queryKey: [...queryKeys.sessionFeedbacks.all, 'provider-rating', providerId],
    queryFn: () => getProviderAverageRating(providerId),
    enabled: !!providerId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useServiceAverageRating(serviceId: string) {
  return useQuery({
    queryKey: [...queryKeys.sessionFeedbacks.all, 'service-rating', serviceId],
    queryFn: () => getServiceAverageRating(serviceId),
    enabled: !!serviceId,
    staleTime: 1000 * 60 * 10,
  })
}

// =========================================
// Session Feedback Mutations
// =========================================

export function useCreateFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SessionFeedbackFormData) => createFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionFeedbacks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceProviders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      toast.success('Feedback submitted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback')
    },
  })
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SessionFeedbackFormData }) => updateFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionFeedbacks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceProviders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      toast.success('Feedback updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update feedback')
    },
  })
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionFeedbacks.all })
      toast.success('Feedback deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete feedback')
    },
  })
}
