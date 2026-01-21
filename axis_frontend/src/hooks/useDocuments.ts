/**
 * React Query Hooks for Documents API
 *
 * SOLID Principles:
 * - Single Responsibility: Handle document data fetching and mutations
 * - Dependency Inversion: Depends on documents API abstraction
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  documentsApi,
  type DocumentSearchParams,
  type DocumentCreateInput,
  type DocumentUpdateInput,
} from '@/api/documents'
import { queryKeys } from '@/lib/react-query'
import { toast } from 'sonner'

// =========================================
// Document Queries
// =========================================

/**
 * Fetch all documents with optional filters
 */
export function useDocuments(params?: DocumentSearchParams) {
  return useQuery({
    queryKey: queryKeys.documents.list(JSON.stringify(params)),
    queryFn: async () => {
      const response = await documentsApi.list(params)
      // Handle both paginated and array responses
      return Array.isArray(response) ? response : response.results
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single document by ID
 */
export function useDocument(id: string) {
  return useQuery({
    queryKey: queryKeys.documents.detail(id),
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch documents expiring soon
 */
export function useExpiringSoonDocuments(days: number = 30) {
  return useQuery({
    queryKey: [...queryKeys.documents.all, 'expiring-soon', days],
    queryFn: () => documentsApi.getExpiringSoon(days),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch expired documents
 */
export function useExpiredDocuments() {
  return useQuery({
    queryKey: [...queryKeys.documents.all, 'expired'],
    queryFn: () => documentsApi.getExpired(),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch published documents
 */
export function usePublishedDocuments() {
  return useQuery({
    queryKey: [...queryKeys.documents.all, 'published'],
    queryFn: () => documentsApi.getPublished(),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch latest document versions
 */
export function useLatestDocuments() {
  return useQuery({
    queryKey: [...queryKeys.documents.all, 'latest'],
    queryFn: () => documentsApi.getLatestVersions(),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch confidential documents
 */
export function useConfidentialDocuments() {
  return useQuery({
    queryKey: [...queryKeys.documents.all, 'confidential'],
    queryFn: () => documentsApi.getConfidential(),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch version history for a document
 */
export function useDocumentVersionHistory(id: string) {
  return useQuery({
    queryKey: [...queryKeys.documents.detail(id), 'versions'],
    queryFn: () => documentsApi.getVersionHistory(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Check document expiry status
 */
export function useDocumentExpiry(id: string) {
  return useQuery({
    queryKey: [...queryKeys.documents.detail(id), 'expiry'],
    queryFn: () => documentsApi.checkExpiry(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// =========================================
// Document Mutations
// =========================================

/**
 * Create new document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DocumentCreateInput) => documentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })
      toast.success('Document uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`)
    },
  })
}

/**
 * Update document
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdateInput }) =>
      documentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(variables.id) })
      toast.success('Document updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update document: ${error.message}`)
    },
  })
}

/**
 * Delete document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })
      toast.success('Document deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`)
    },
  })
}

/**
 * Publish document
 */
export function usePublishDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => documentsApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(id) })
      toast.success('Document published successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish document: ${error.message}`)
    },
  })
}

/**
 * Archive document
 */
export function useArchiveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      documentsApi.archive(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(variables.id) })
      toast.success('Document archived successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to archive document: ${error.message}`)
    },
  })
}

/**
 * Create new version of document
 */
export function useCreateDocumentVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: {
        file?: File | null
        url?: string | null
        uploaded_by_id: string
        description?: string | null
      }
    }) => documentsApi.createVersion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(variables.id) })
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.documents.detail(variables.id), 'versions'],
      })
      toast.success('New document version created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create document version: ${error.message}`)
    },
  })
}
