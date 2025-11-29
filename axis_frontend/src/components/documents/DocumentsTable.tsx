/**
 * Documents Table Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display documents in a table format
 * - Open/Closed: Extensible with additional columns or actions
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  FileText,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  History,
  Lock,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'
import { type DocumentList, DocumentStatus, DocumentType } from '@/api/documents'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/utils/formatters'

type SortField = 'title' | 'type' | 'status' | 'created_at' | 'expiry_date'
type SortDirection = 'asc' | 'desc'

interface DocumentsTableProps {
  documents: DocumentList[]
  isLoading?: boolean
  onView?: (document: DocumentList) => void
  onDownload?: (document: DocumentList) => void
  onDelete?: (document: DocumentList) => void
  onViewVersions?: (document: DocumentList) => void
  pageSize?: number
}

const STATUS_COLORS: Record<DocumentStatus, string> = {
  Draft: 'bg-gray-500/20 text-gray-400',
  Published: 'bg-emerald-500/20 text-emerald-400',
  Archived: 'bg-yellow-500/20 text-yellow-400',
  Expired: 'bg-red-500/20 text-red-400',
}

const TYPE_LABELS: Record<DocumentType, string> = {
  contract: 'Contract',
  certification: 'Certification',
  kpi_report: 'KPI Report',
  feedback_summary: 'Feedback Summary',
  billing_report: 'Billing Report',
  utilization_report: 'Utilization Report',
  other: 'Other',
}

export function DocumentsTable({
  documents,
  isLoading = false,
  onView,
  onDownload,
  onDelete,
  onViewVersions,
  pageSize = 10,
}: DocumentsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const [menuDocument, setMenuDocument] = useState<DocumentList | null>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement>>({})
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate menu position when it opens
  useEffect(() => {
    if (openMenuId && buttonRefs.current[openMenuId]) {
      const button = buttonRefs.current[openMenuId]
      const rect = button.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })

      const document = documents.find((d) => d.id === openMenuId)
      setMenuDocument(document || null)
    } else {
      setMenuPosition(null)
      setMenuDocument(null)
    }
  }, [openMenuId, documents])

  // Close menu on scroll
  useEffect(() => {
    if (!openMenuId) return

    const handleScroll = () => {
      setOpenMenuId(null)
    }

    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [openMenuId])

  // Close menu on click outside
  useEffect(() => {
    if (!openMenuId) return

    const handleClickOutside = (e: MouseEvent) => {
      if (!buttonRefs.current[openMenuId]?.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  // Sort documents
  const sortedDocuments = useMemo(() => {
    const sorted = [...documents].sort((a, b) => {
      let aValue: string | number | null
      let bValue: string | number | null

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'expiry_date':
          aValue = a.expiry_date ? new Date(a.expiry_date).getTime() : 0
          bValue = b.expiry_date ? new Date(b.expiry_date).getTime() : 0
          break
        default:
          return 0
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [documents, sortField, sortDirection])

  // Paginate
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedDocuments.slice(start, start + pageSize)
  }, [sortedDocuments, currentPage, pageSize])

  const totalPages = Math.ceil(sortedDocuments.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-500" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-emerald-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-emerald-400" />
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading documents...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No documents found</p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Title
                  {getSortIcon('title')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Type
                  {getSortIcon('type')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Status
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Client</th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Created
                  {getSortIcon('created_at')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('expiry_date')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Expires
                  {getSortIcon('expiry_date')}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedDocuments.map((document) => (
              <tr
                key={document.id}
                className="hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => onView?.(document)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{document.title}</p>
                      {!document.is_latest && (
                        <p className="text-xs text-gray-500">v{document.version}</p>
                      )}
                    </div>
                    {document.is_confidential && (
                      <Lock className="h-3 w-3 text-yellow-400" title="Confidential" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400">{TYPE_LABELS[document.type]}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      STATUS_COLORS[document.status]
                    )}
                  >
                    {document.status}
                  </span>
                  {document.is_expired && (
                    <span className="ml-2 text-xs text-red-400">Expired</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-400">{document.client_name || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-400">{formatShortDate(document.created_at)}</span>
                </td>
                <td className="px-4 py-3">
                  {document.expiry_date ? (
                    <span
                      className={cn(
                        'text-sm',
                        document.is_expired ? 'text-red-400' : 'text-gray-400'
                      )}
                    >
                      {formatShortDate(document.expiry_date)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      ref={(el) => {
                        if (el) buttonRefs.current[document.id] = el
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === document.id ? null : document.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedDocuments.length)} of{' '}
            {sortedDocuments.length} documents
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Action Menu */}
      {openMenuId && menuDocument && menuPosition && (
        <div
          className="fixed z-50 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView(menuDocument)
                setOpenMenuId(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
          )}
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDownload(menuDocument)
                setOpenMenuId(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
          {onViewVersions && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewVersions(menuDocument)
                setOpenMenuId(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Version History
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(menuDocument)
                setOpenMenuId(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

