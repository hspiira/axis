/**
 * Client Documents Tab
 *
 * Documents related to this client
 */

import { useState, useEffect } from 'react'
import { type ClientDetail } from '@/api/clients'
import { FileText, Upload, Search } from 'lucide-react'
import { documentsApi, type DocumentList, type DocumentDetail } from '@/api/documents'
import { DocumentsTable } from '@/components/documents/DocumentsTable'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { DocumentDetailModal } from '@/components/documents/DocumentDetailModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface ClientDocumentsTabProps {
  client: ClientDetail
}

export function ClientDocumentsTab({ client }: ClientDocumentsTabProps) {
  const [documents, setDocuments] = useState<DocumentList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentList | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [client.id])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await documentsApi.list({
        client_id: client.id,
        is_latest: true,
      })
      const docs = Array.isArray(response) ? response : response.results
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query) ||
        false
      )
    }
    return true
  })

  const handleUpload = async (data: any) => {
    try {
      await documentsApi.create({
        ...data,
        client_id: client.id,
      })
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
    } catch (error) {
      console.error('Failed to load document versions:', error)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Documents</h3>
            <p className="text-sm text-gray-400 mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''} for this client
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50"
            />
          </div>
        </div>

        {/* Documents Table */}
        {filteredDocuments.length > 0 ? (
          <DocumentsTable
            documents={filteredDocuments}
            isLoading={isLoading}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onViewVersions={handleViewVersions}
          />
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No documents found for this client</p>
            <p className="text-sm text-gray-500 mt-1">Upload documents to get started</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUpload}
        clientId={client.id}
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
        onViewVersions={handleViewVersions}
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
    </div>
  )
}
