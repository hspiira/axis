/**
 * Clients Table Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display clients in a table format
 * - Open/Closed: Extensible with additional columns or actions
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Building2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  Power,
  Archive,
  ShieldCheck,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { type ClientList, BaseStatus } from '@/api/clients'
import { cn } from '@/lib/utils'
import { getStatusColor } from '@/components/ui/StatusBadge'
import { formatShortDate } from '@/utils/formatters'

type SortField = 'name' | 'email' | 'industry_name' | 'status' | 'is_verified' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface ClientsTableProps {
  clients: ClientList[]
  isLoading?: boolean
  onView?: (client: ClientList) => void
  onEdit?: (client: ClientList) => void
  onActivate?: (client: ClientList) => void
  onDeactivate?: (client: ClientList) => void
  onArchive?: (client: ClientList) => void
  onVerify?: (client: ClientList) => void
  onDelete?: (client: ClientList) => void
  pageSize?: number
  selectedIds?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
}

export function ClientsTable({
  clients,
  isLoading = false,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onArchive,
  onVerify,
  onDelete,
  pageSize = 10,
  selectedIds = new Set<string>(),
  onSelectionChange,
}: ClientsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const [menuClient, setMenuClient] = useState<ClientList | null>(null)
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
        top: rect.bottom + 4, // 4px gap (mt-1 equivalent)
        right: window.innerWidth - rect.right,
      })
      
      // Find and store the client data
      const client = clients.find((c) => c.id === openMenuId)
      setMenuClient(client || null)
    } else {
      setMenuPosition(null)
      setMenuClient(null)
    }
  }, [openMenuId, clients])

  // Close menu on scroll
  useEffect(() => {
    if (!openMenuId) return

    const handleScroll = () => {
      setOpenMenuId(null)
    }

    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [openMenuId])

  // Sorting logic
  const sortedClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Special handling for boolean (is_verified)
      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0
        bValue = bValue ? 1 : 0
      }

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Number/Date comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

    return sorted
  }, [clients, sortField, sortDirection])

  // Pagination logic
  const totalPages = Math.ceil(sortedClients.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedClients = sortedClients.slice(startIndex, endIndex)

  // Reset to page 1 when clients change
  useMemo(() => {
    setCurrentPage(1)
  }, [clients])

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

  // Selection handlers
  const handleSelectAll = () => {
    if (!onSelectionChange) return

    const allPageIds = new Set(paginatedClients.map(c => c.id))
    const allSelected = paginatedClients.every(c => selectedIds.has(c.id))

    if (allSelected) {
      // Deselect all on current page
      const newSelection = new Set(selectedIds)
      allPageIds.forEach(id => newSelection.delete(id))
      onSelectionChange(newSelection)
    } else {
      // Select all on current page
      const newSelection = new Set(selectedIds)
      allPageIds.forEach(id => newSelection.add(id))
      onSelectionChange(newSelection)
    }
  }

  const handleSelectRow = (clientId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!onSelectionChange) return

    const newSelection = new Set(selectedIds)
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId)
    } else {
      newSelection.add(clientId)
    }
    onSelectionChange(newSelection)
  }

  // Check if all clients on current page are selected
  const allPageSelected = paginatedClients.length > 0 && paginatedClients.every(c => selectedIds.has(c.id))
  const somePageSelected = paginatedClients.some(c => selectedIds.has(c.id)) && !allPageSelected

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Loading clients...</p>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No clients found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {onSelectionChange && (
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = somePageSelected
                        }
                      }}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded bg-white/5 border-white/10 text-emerald-600 focus:ring-emerald-500/50 cursor-pointer"
                      aria-label="Select all clients on this page"
                    />
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Client Name
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('industry_name')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Industry
                    {getSortIcon('industry_name')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Status
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('is_verified')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Verified
                    {getSortIcon('is_verified')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Created
                    {getSortIcon('created_at')}
                  </button>
                </th>
                <th className="px-3 py-2 w-20 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedClients.map((client) => (
              <tr
                key={client.id}
                className={cn(
                  "hover:bg-white/5 transition-colors cursor-pointer",
                  selectedIds.has(client.id) && "bg-emerald-500/5"
                )}
                onClick={() => onView?.(client)}
              >
                {onSelectionChange && (
                  <td className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(client.id)}
                      onChange={(e) => handleSelectRow(client.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded bg-white/5 border-white/10 text-emerald-600 focus:ring-emerald-500/50 cursor-pointer"
                      aria-label={`Select ${client.name}`}
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  <div className="text-sm font-medium text-white truncate max-w-xs">
                    {client.name}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-sm text-gray-300 truncate max-w-xs">
                    {client.email || <span className="text-gray-500">—</span>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-sm text-gray-300">
                    {client.phone || <span className="text-gray-500">—</span>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-sm text-gray-300 truncate max-w-xs">
                    {client.industry_name || <span className="text-gray-500">—</span>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                      getStatusColor(client.status)
                    )}
                  >
                    {client.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {client.is_verified ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-500" />
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-gray-400">
                  {formatShortDate(client.created_at)}
                </td>
                <td className="px-3 py-2 w-20">
                  <div className="relative flex justify-end items-center">
                    <button
                      ref={(el) => {
                        if (el) buttonRefs.current[client.id] = el
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === client.id ? null : client.id)
                      }}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
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
      </div>

      {/* Floating Action Menu */}
      {openMenuId && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenuId(null)
            }}
          />
          <div
            className="fixed w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-[101]"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
          >
            <div className="py-1">
              {menuClient && (
                <>
                  {onView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(menuClient)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(menuClient)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {menuClient.status === BaseStatus.ACTIVE && onDeactivate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeactivate(menuClient)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Power className="h-4 w-4" />
                      Deactivate
                    </button>
                  )}
                  {menuClient.status !== BaseStatus.ACTIVE && onActivate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onActivate(menuClient)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Power className="h-4 w-4" />
                      Activate
                    </button>
                  )}
                  {!menuClient.is_verified && onVerify && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onVerify(menuClient)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Verify
                    </button>
                  )}
                  {menuClient.status !== BaseStatus.ARCHIVED && onArchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onArchive(menuClient)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(menuClient)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/10 hover:text-rose-300 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-6 py-4">
          <div className="text-sm text-gray-400">
            Showing <span className="font-medium text-white">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-white">{Math.min(endIndex, sortedClients.length)}</span> of{' '}
            <span className="font-medium text-white">{sortedClients.length}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)

                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-gray-600">
                        ...
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === totalPages
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              )}
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

