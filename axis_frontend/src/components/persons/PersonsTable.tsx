/**
 * Persons Table Component
 *
 * Displays persons (employees, dependents, staff, providers) in a table format
 */

import { useState } from 'react'
import {
  Users,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { type PersonListItem, PersonType } from '@/api/persons'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/utils/formatters'

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
  [PersonType.CLIENT_EMPLOYEE]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [PersonType.DEPENDENT]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [PersonType.PLATFORM_STAFF]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [PersonType.SERVICE_PROVIDER]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const personStatusColors: Record<string, string> = {
  'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Inactive': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Suspended': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Archived': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function PersonsTable({
  persons,
  isLoading = false,
  onView,
  onEdit,
  pageSize = 10,
}: PersonsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Pagination logic
  const totalPages = Math.ceil(persons.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedPersons = persons.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <div className="animate-pulse">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Loading persons...</p>
        </div>
      </div>
    )
  }

  if (persons.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No persons found</h3>
        <p className="text-gray-400">Try adjusting your filters or add a new person</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Client</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Contact</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Sessions</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedPersons.map((person) => (
                <tr
                  key={person.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onView?.(person)}
                >
                  {/* Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
                        {person.profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{person.profile?.full_name || 'Unknown'}</div>
                        {person.is_eligible && (
                          <div className="text-xs text-emerald-400">Eligible for services</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-4 px-6">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                      personTypeBadgeColors[person.person_type]
                    )}>
                      {personTypeLabels[person.person_type]}
                    </span>
                  </td>

                  {/* Client */}
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-300">
                      {person.client_name || '-'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
                      personStatusColors[person.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    )}>
                      {person.status === 'Active' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {person.status}
                    </span>
                  </td>

                  {/* Contact */}
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-300 space-y-0.5">
                      {person.profile?.email && (
                        <div className="truncate max-w-[200px]">{person.profile.email}</div>
                      )}
                      {person.profile?.phone && (
                        <div className="text-gray-400">{person.profile.phone}</div>
                      )}
                      {!person.profile?.email && !person.profile?.phone && '-'}
                    </div>
                  </td>

                  {/* Sessions */}
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <div className="text-gray-300">{person.total_sessions} sessions</div>
                      {person.last_service_date && (
                        <div className="text-xs text-gray-400">
                          Last: {formatShortDate(person.last_service_date)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onView?.(person)
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit?.(person)
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, persons.length)} of {persons.length} persons
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
