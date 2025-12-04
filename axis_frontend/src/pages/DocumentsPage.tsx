/**
 * Documents Page
 *
 * Standalone page for managing documents library
 */

import { useState, useMemo } from 'react'
import { ResourcePageLayout } from '@/components/layouts/ResourcePageLayout'
import { FileText, Search, Download, Upload, Folder, File, X, FileCheck, Archive, Clock } from 'lucide-react'
import { type DocumentList, type DocumentDetail, DocumentType, DocumentStatus } from '@/api/documents'
import { useDocuments, useDocument, useCreateDocument, useDeleteDocument } from '@/hooks/useDocuments'
import { useModal } from '@/hooks/useModal'
import { DocumentsTable } from '@/components/documents/DocumentsTable'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { DocumentDetailModal } from '@/components/documents/DocumentDetailModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SummaryStats } from '@/components/ui'
import { cn } from '@/lib/utils'

export function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{
    type?: DocumentType
    status?: DocumentStatus
    is_confidential?: boolean
    is_latest?: boolean
  }>({})

  // Modal management
  const uploadModal = useModal()
  const detailModal = useModal<DocumentList>()
  const deleteModal = useModal<DocumentList>()

  // Fetch documents with React Query
  const { data: documents = [], isLoading } = useDocuments({
    is_latest: true,
    search: searchQuery || undefined,
    ...filters,
  })

  // Fetch selected document details when detail modal is open
  const { data: selectedDocument } = useDocument(detailModal.data?.id || '')

  // Mutations
  const createDocumentMutation = useCreateDocument()
  const deleteDocumentMutation = useDeleteDocument()

  // Documents are already filtered by React Query, no need for client-side filtering
  const filteredDocuments = documents

  // Stats
  const stats = useMemo(() => {
    const total = documents.length
    const published = documents.filter((d) => d.status === 'Published').length
    const confidential = documents.filter((d) => d.is_confidential).length
    const expired = documents.filter((d) => d.is_expired).length

    return { total, published, confidential, expired }
  }, [documents])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    documents.forEach((doc) => {
      const type = doc.type
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [documents])

  const handleUpload = async (data: any) => {
    await createDocumentMutation.mutateAsync(data)
    uploadModal.close()
  }

  const handleView = (document: DocumentList) => {
    detailModal.open(document)
  }

  const handleDownload = (document: DocumentList) => {
    // We need to fetch the full document details to get the file URL
    // For now, we'll open the detail modal which has download functionality
    detailModal.open(document)
  }

  const handleDelete = (document: DocumentList) => {
    deleteModal.open(document)
  }

  const confirmDelete = async () => {
    if (!deleteModal.data) return
    await deleteDocumentMutation.mutateAsync(deleteModal.data.id)
    deleteModal.close()
  }

  const handleViewVersions = (document: DocumentList) => {
    detailModal.open(document)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0

  return (
    <ResourcePageLayout
      title="Documents"
      subtitle="Manage your document library"
      stats={
        <SummaryStats
          variant="cards"
          columns={4}
          stats={[
            { label: 'Total Documents', value: stats.total, icon: FileText, iconColor: 'text-cream-400', color: 'text-white' },
            { label: 'Published', value: stats.published, icon: File, iconColor: 'text-cream-400', color: 'text-white' },
            { label: 'Confidential', value: stats.confidential, icon: Folder, iconColor: 'text-purple-400', color: 'text-white' },
            { label: 'Expired', value: stats.expired, icon: FileText, iconColor: 'text-cream-400', color: 'text-white' },
          ]}
        />
      }
      filters={
        <div className="space-y-3">
          {/* Search Bar with Status Filters and Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, status: undefined }))}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full transition-all',
                  !filters.status
                    ? 'bg-cream-500 text-gray-900 font-medium'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                )}
                title="All Statuses"
              >
                All
              </button>
              {(['Draft', 'Published', 'Archived', 'Expired'] as DocumentStatus[]).map((status) => {
                const statusIcons: Record<DocumentStatus, React.ReactNode> = {
                  Draft: <FileText className="h-3 w-3" />,
                  Published: <FileCheck className="h-3 w-3" />,
                  Archived: <Archive className="h-3 w-3" />,
                  Expired: <Clock className="h-3 w-3" />,
                }
                return (
                  <button
                    key={status}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        status: filters.status === status ? undefined : status,
                      }))
                    }
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1',
                      filters.status === status
                        ? 'bg-cream-500 text-gray-900 font-medium'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    )}
                    title={status}
                  >
                    {statusIcons[status]}
                    {status}
                  </button>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => uploadModal.open()}
                className="px-2.5 py-1.5 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Upload Document"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                onClick={() => {}}
                className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Export Documents"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white flex items-center gap-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Clear Filters"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Type Filters - Compact Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(categoryCounts).map(([type, count]) => {
              const typeLabels: Record<string, string> = {
                contract: 'Contracts',
                certification: 'Certifications',
                kpi_report: 'KPI Reports',
                feedback_summary: 'Feedback',
                billing_report: 'Billing',
                utilization_report: 'Utilization',
                other: 'Other',
              }
              return (
                <button
                  key={type}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: filters.type === type ? undefined : (type as DocumentType),
                    }))
                  }
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full transition-all',
                    filters.type === type
                      ? 'bg-cream-500 text-gray-900 font-medium'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {typeLabels[type] || type} ({count})
                </button>
              )
            })}
          </div>
        </div>
      }
      modals={
        <>
          {/* Upload Modal */}
          <DocumentUploadModal
            {...uploadModal.props}
            onSubmit={handleUpload}
          />

          {/* Detail Modal */}
          <DocumentDetailModal
            {...detailModal.props}
            document={selectedDocument || null}
            onDownload={() => selectedDocument && handleDownload(detailModal.data!)}
            onViewVersions={() => selectedDocument && handleViewVersions(detailModal.data!)}
          />

          {/* Delete Confirmation */}
          <ConfirmDialog
            {...deleteModal.props}
            onConfirm={confirmDelete}
            title="Delete Document"
            message={`Are you sure you want to delete "${deleteModal.data?.title}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={deleteDocumentMutation.isPending}
          />
        </>
      }
    >
      <DocumentsTable
        documents={filteredDocuments}
        isLoading={isLoading}
        onView={handleView}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onViewVersions={handleViewVersions}
      />
    </ResourcePageLayout>
  )
}
