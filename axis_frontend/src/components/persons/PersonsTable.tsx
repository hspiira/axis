/**
 * Persons Table Component
 *
 * Displays persons (employees, dependents, staff, providers) in a table format
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Users,
  MoreVertical,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'
import { type PersonListItem, PersonType } from '@/api/persons'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/utils/formatters'
import { StatusBadge } from '../ui'

type SortField = 'profile.full_name' | 'person_type' | 'client_name' | 'status' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface PersonsTableProps {
  persons: PersonListItem[]
  isLoading?: boolean
  onView?: (person: PersonListItem) => void
  onEdit?: (person: PersonListItem) => void
  pageSize?: number
}

const personTypeLabels: Record<PersonType, string> = {
  [PersonType.CLIENT_EMPLOYEE]: 'Employee',
  [PersonType.DEPENDENT]: 'Dependent',
  [PersonType.PLATFORM_STAFF]: 'Staff',
  [PersonType.SERVICE_PROVIDER]: 'Provider',
}

const personTypeBadgeColors: Record<PersonType, string> = {
  [PersonType.CLIENT_EMPLOYEE]: 'bg-amber-500/10 text-cream-400 border-cream-500/20',
  [PersonType.DEPENDENT]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [PersonType.PLATFORM_STAFF]: 'bg-amber-500/10 text-cream-400 border-cream-500/20',
  [PersonType.SERVICE_PROVIDER]: 'bg-amber-500/10 text-amber-400 border-cream-500/20',
}

const personStatusColors: Record<string, string> = {
  'Active': 'bg-amber-500/10 text-cream-400 border-cream-500/20',
  'Inactive': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Suspended': 'bg-amber-500/10 text-amber-400 border-cream-500/20',
  'Archived': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function PersonsTable({
  persons,
  isLoading = false,
  onView,
  onEdit,
  pageSize = 10,
}: PersonsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const [menuPerson, setMenuPerson] = useState<PersonListItem | null>(null)
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

      const person = persons.find((p) => p.id === openMenuId)
      setMenuPerson(person || null)
    } else {
      setMenuPosition(null)
      setMenuPerson(null)
    }
  }, [openMenuId, persons])

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
  const sortedPersons = useMemo(() => {
    const sorted = [...persons].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Handle nested field access
      if (sortField === 'profile.full_name') {
        aValue = a.profile?.full_name
        bValue = b.profile?.full_name
      } else if (sortField === 'client_name') {
        aValue = a.client_name
        bValue = b.client_name
      } else {
        aValue = a[sortField as keyof PersonListItem]
        bValue = b[sortField as keyof PersonListItem]
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

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
  }, [persons, sortField, sortDirection])

  // Pagination logic
  const totalPages = Math.ceil(sortedPersons.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedPersons = sortedPersons.slice(startIndex, endIndex)

  // Reset to page 1 when persons change
  useMemo(() => {
    setCurrentPage(1)
  }, [persons])

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
        <p className="text-gray-400">Loading persons...</p>
      </div>
    )
  }

  if (persons.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No persons found</p>
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
                    onClick={() => handleSort('profile.full_name')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Name
                    {getSortIcon('profile.full_name')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('person_type')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Type
                    {getSortIcon('person_type')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('client_name')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Client
                    {getSortIcon('client_name')}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Contact
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
                  Eligible
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
              {paginatedPersons.map((person) => (
                <tr
                  key={person.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onView?.(person)}
                >
                  {/* Name */}
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-white truncate max-w-xs">
                      {person.profile?.full_name || 'Unknown'}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                      personTypeBadgeColors[person.person_type]
                    )}>
                      {personTypeLabels[person.person_type]}
                    </span>
                  </td>

                  {/* Client */}
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-300 truncate max-w-xs">
                      {person.client_name || <span className="text-gray-500">—</span>}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-300 truncate max-w-xs">
                      {person.profile?.email || person.profile?.phone || <span className="text-gray-500">—</span>}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <StatusBadge status={person.status}/>
                  </td>

                  {/* Eligible */}
                  <td className="px-3 py-2">
                    {person.is_eligible ? (
                      <CheckCircle2 className="h-4 w-4 text-cream-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-500" />
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-3 py-2 text-sm text-gray-400">
                    {formatShortDate(person.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 w-20">
                    <div className="relative flex justify-end items-center">
                      <button
                        ref={(el) => {
                          if (el) buttonRefs.current[person.id] = el
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === person.id ? null : person.id)
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
            className="fixed inset-0 z-100"
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenuId(null)
            }}
          />
          <div
            className="fixed w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-101"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
          >
            <div className="py-1">
              {menuPerson && (
                <>
                  {onView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(menuPerson)
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
                        onEdit(menuPerson)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
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
            <span className="font-medium text-white">{Math.min(endIndex, sortedPersons.length)}</span> of{' '}
            <span className="font-medium text-white">{sortedPersons.length}</span> results
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
