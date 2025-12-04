/**
 * Documents Page
 *
 * Standalone page for managing documents library
 */

import { useEffect, useState, useMemo } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { FileText, Search, Download, Upload, Folder, File, X, FileCheck, Archive, Clock } from 'lucide-react'
import { documentsApi, type DocumentList, type DocumentDetail, DocumentType, DocumentStatus } from '@/api/documents'
import { DocumentsTable } from '@/components/documents/DocumentsTable'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { DocumentDetailModal } from '@/components/documents/DocumentDetailModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SummaryStats } from '@/components/ui'
import { cn } from '@/lib/utils'

export function DocumentsPage() {
  const { setPageTitle } = usePageTitle()
  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<DocumentList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentList | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filters, setFilters] = useState<{
    type?: DocumentType
    status?: DocumentStatus
    is_confidential?: boolean
    is_latest?: boolean
  }>({})

  useEffect(() => {
    setPageTitle('Documents', 'Manage your document library')
    return () => setPageTitle(null)
  }, [setPageTitle])

  // Load documents
  useEffect(() => {
    loadDocuments()
  }, [filters, searchQuery])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        is_latest: true,
        ...filters,
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      const response = await documentsApi.list(params)
      const docs = Array.isArray(response) ? response : response.results
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          doc.title.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.client_name?.toLowerCase().includes(query) ||
          false
        )
      }
      return true
    })
  }, [documents, searchQuery])

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
    try {
      await documentsApi.create(data)
      await loadDocuments()
    } catch (error) {
      console.error('Failed to upload document:', error)
      throw error
    }
  }

  const handleView = async (document: DocumentList) => {
    try {
      const detail = await documentsApi.get(document.id)
      setSelectedDocument(detail)
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error('Failed to load document details:', error)
    }
  }

  const handleDownload = async (document: DocumentList) => {
    try {
      const detail = await documentsApi.get(document.id)
      const url = detail.file_url || detail.url
      if (url) {
        // Validate URL to prevent javascript: pseudo-protocol XSS
        if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
          alert('Invalid or malicious URL detected.')
          return
        }
        window.open(url, '_blank')
      } else {
        alert('No file URL available for this document')
      }
    } catch (error) {
      console.error('Failed to download document:', error)
      alert('Failed to download document')
    }
  }

  const handleDelete = (document: DocumentList) => {
    setDocumentToDelete(document)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    setIsDeleting(true)
    try {
      await documentsApi.delete(documentToDelete.id)
      await loadDocuments()
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewVersions = async (document: DocumentList) => {
    try {
      const detail = await documentsApi.get(document.id)
      setSelectedDocument(detail)
      setIsDetailModalOpen(true)
      // TODO: Show version history in detail modal
    } catch (error) {
      console.error('Failed to load document versions:', error)
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Stats Grid */}
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

        {/* Search and Filters */}
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
                onClick={() => setIsUploadModalOpen(true)}
                className="px-2.5 py-1.5 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors flex items-center gap-1.5 text-xs font-medium"
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

        {/* Documents Table */}
        <DocumentsTable
          documents={filteredDocuments}
          isLoading={isLoading}
          onView={handleView}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onViewVersions={handleViewVersions}
        />
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUpload}
      />

      {/* Detail Modal */}
      <DocumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedDocument(null)
        }}
        document={selectedDocument}
        onDownload={() => selectedDocument && handleDownload(selectedDocument as any)}
        onViewVersions={() => selectedDocument && handleViewVersions(selectedDocument as any)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </AppLayout>
  )
}
