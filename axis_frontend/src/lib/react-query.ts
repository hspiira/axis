/**
 * React Query Configuration
 *
 * SOLID Principles:
 * - Single Responsibility: Configure TanStack Query for data fetching and caching
 * - Open/Closed: Easily extensible with custom query/mutation options
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Global Query Client Configuration
 *
 * Settings optimized for:
 * - User experience (stale time, refetch on window focus)
 * - Performance (caching, garbage collection)
 * - Error handling (retry logic, error propagation)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching Strategy
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - cache garbage collection (formerly cacheTime)

      // Refetch Strategy
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts

      // Error Handling
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Network
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      // Error Handling
      retry: 1, // Retry mutations once
      retryDelay: 1000, // Wait 1 second before retry

      // Network
      networkMode: 'online', // Only run mutations when online
    },
  },
})

/**
 * Query Keys Factory
 *
 * Centralized query key management for:
 * - Consistency across the application
 * - Easy cache invalidation
 * - Type safety
 */
export const queryKeys = {
  // Authentication
  auth: {
    user: ['auth', 'user'] as const,
    token: ['auth', 'token'] as const,
  },

  // Cases
  cases: {
    all: ['cases'] as const,
    lists: () => [...queryKeys.cases.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.cases.lists(), filters] as const,
    details: () => [...queryKeys.cases.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cases.details(), id] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },

  // Contracts
  contracts: {
    all: ['contracts'] as const,
    lists: () => [...queryKeys.contracts.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.contracts.lists(), filters] as const,
    details: () => [...queryKeys.contracts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contracts.details(), id] as const,
  },

  // Services
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.services.lists(), filters] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
  },

  // Service Categories
  serviceCategories: {
    all: ['service-categories'] as const,
    lists: () => [...queryKeys.serviceCategories.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.serviceCategories.lists(), filters] as const,
    details: () => [...queryKeys.serviceCategories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.serviceCategories.details(), id] as const,
  },

  // Service Providers
  serviceProviders: {
    all: ['service-providers'] as const,
    lists: () => [...queryKeys.serviceProviders.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.serviceProviders.lists(), filters] as const,
    details: () => [...queryKeys.serviceProviders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.serviceProviders.details(), id] as const,
  },

  // Service Assignments
  serviceAssignments: {
    all: ['service-assignments'] as const,
    lists: () => [...queryKeys.serviceAssignments.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.serviceAssignments.lists(), filters] as const,
    details: () => [...queryKeys.serviceAssignments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.serviceAssignments.details(), id] as const,
  },

  // Service Sessions
  serviceSessions: {
    all: ['service-sessions'] as const,
    lists: () => [...queryKeys.serviceSessions.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.serviceSessions.lists(), filters] as const,
    details: () => [...queryKeys.serviceSessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.serviceSessions.details(), id] as const,
  },

  // Session Feedback
  sessionFeedbacks: {
    all: ['session-feedbacks'] as const,
    lists: () => [...queryKeys.sessionFeedbacks.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.sessionFeedbacks.lists(), filters] as const,
    details: () => [...queryKeys.sessionFeedbacks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessionFeedbacks.details(), id] as const,
  },

  // Persons
  persons: {
    all: ['persons'] as const,
    lists: () => [...queryKeys.persons.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.persons.lists(), filters] as const,
    details: () => [...queryKeys.persons.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.persons.details(), id] as const,
    byClient: (clientId: string, filters?: string) => [...queryKeys.persons.all, 'by-client', clientId, filters] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.documents.lists(), filters] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
  },
}

/**
 * Query Client Provider Export
 *
 * Re-export for cleaner imports
 */
export { QueryClientProvider }
