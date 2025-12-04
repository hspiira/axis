/**
 * Services Table Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display services in a table format
 * - Open/Closed: Extensible with additional columns or actions
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Stethoscope,
  MoreVertical,
  Edit,
  Power,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { type ServiceList, ServiceStatus } from '@/api/services'
import { cn } from '@/lib/utils'
import { getStatusColor } from '@/components/ui/StatusBadge'
import { formatShortDate } from '@/utils/formatters'

type SortField = 'name' | 'category_name' | 'status' | 'duration_minutes' | 'default_price' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface ServicesTableProps {
  services: ServiceList[]
  isLoading?: boolean
  onEdit?: (service: ServiceList) => void
  onActivate?: (service: ServiceList) => void
  onDeactivate?: (service: ServiceList) => void
  onDelete?: (service: ServiceList) => void
  pageSize?: number
}

export function ServicesTable({
  services,
  isLoading = false,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  pageSize = 10,
}: ServicesTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const [menuService, setMenuService] = useState<ServiceList | null>(null)
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

      const service = services.find((s) => s.id === openMenuId)
      setMenuService(service || null)
    } else {
      setMenuPosition(null)
      setMenuService(null)
    }
  }, [openMenuId, services])

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
  const sortedServices = useMemo(() => {
    const sorted = [...services].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

    return sorted
  }, [services, sortField, sortDirection])

  // Pagination logic
  const totalPages = Math.ceil(sortedServices.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedServices = sortedServices.slice(startIndex, endIndex)

  useMemo(() => {
    setCurrentPage(1)
  }, [services])

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
      <ChevronUp className="h-4 w-4 text-cream-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-cream-400" />
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-cream-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Loading services...</p>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <Stethoscope className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No services found</p>
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
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Service Name
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('category_name')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Category
                    {getSortIcon('category_name')}
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
                  Details
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Usage
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
              {paginatedServices.map((service) => (
                <tr key={service.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-white truncate max-w-xs">
                      {service.name}
                    </div>
                    {service.description && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">
                        {service.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-300 truncate max-w-xs">
                      {service.category_name || <span className="text-gray-500">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getStatusColor(service.status)
                      )}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {service.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {service.duration_minutes}m
                        </div>
                      )}
                      {service.default_price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {service.default_price}
                        </div>
                      )}
                      {service.is_billable ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-cream-400" aria-label="Billable" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-gray-500" aria-label="Non-billable" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-300">
                      <span className="text-cream-400">{service.active_assignments}</span>
                      <span className="text-gray-500 mx-1">/</span>
                      <span>{service.total_sessions} sessions</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-400">
                    {formatShortDate(service.created_at)}
                  </td>
                  <td className="px-3 py-2 w-20">
                    <div className="relative flex justify-end items-center">
                      <button
                        ref={(el) => {
                          if (el) buttonRefs.current[service.id] = el
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === service.id ? null : service.id)
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
              {menuService && (
                <>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(menuService)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {menuService.status === ServiceStatus.ACTIVE && onDeactivate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeactivate(menuService)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Power className="h-4 w-4" />
                      Deactivate
                    </button>
                  )}
                  {menuService.status !== ServiceStatus.ACTIVE && onActivate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onActivate(menuService)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Power className="h-4 w-4" />
                      Activate
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(menuService)
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
            <span className="font-medium text-white">{Math.min(endIndex, sortedServices.length)}</span> of{' '}
            <span className="font-medium text-white">{sortedServices.length}</span> results
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

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)

                if (!showPage) {
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
                        ? 'bg-cream-500 text-gray-900 font-medium'
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
