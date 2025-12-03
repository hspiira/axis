/**
 * Sessions Table Component
 *
 * Displays service sessions in a sortable, paginated table.
 */

import { useState } from 'react'
import { Edit, Trash2, CheckCircle, X, Calendar, Users } from 'lucide-react'
import type { ServiceSessionList } from '@/api/services'
import { formatShortDate, formatTime } from '@/utils/formatters'

interface SessionsTableProps {
  sessions: ServiceSessionList[]
  isLoading: boolean
  onEdit: (session: ServiceSessionList) => void
  onDelete: (session: ServiceSessionList) => void
  onComplete: (session: ServiceSessionList) => void
  onCancel: (session: ServiceSessionList) => void
}

type SortField = 'service_name' | 'person_name' | 'status' | 'scheduled_at'
type SortDirection = 'asc' | 'desc'

export function SessionsTable({
  sessions,
  isLoading,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
}: SessionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('scheduled_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    let aValue: string | number = ''
    let bValue: string | number = ''

    switch (sortField) {
      case 'service_name':
        aValue = a.service_name.toLowerCase()
        bValue = b.service_name.toLowerCase()
        break
      case 'person_name':
        aValue = a.person_name.toLowerCase()
        bValue = b.person_name.toLowerCase()
        break
      case 'status':
        aValue = a.status.toLowerCase()
        bValue = b.status.toLowerCase()
        break
      case 'scheduled_at':
        aValue = new Date(a.scheduled_at).getTime()
        bValue = new Date(b.scheduled_at).getTime()
        break
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSessions = sortedSessions.slice(startIndex, startIndex + itemsPerPage)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'text-blue-400'
      case 'Rescheduled':
        return 'text-yellow-400'
      case 'Completed':
        return 'text-emerald-400'
      case 'Canceled':
        return 'text-rose-400'
      case 'No Show':
        return 'text-orange-400'
      case 'Postponed':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Loading sessions...</p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg mb-2">No sessions found</p>
        <p className="text-gray-500 text-sm">
          Try adjusting your filters or create a new session
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th
                onClick={() => handleSort('scheduled_at')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Date/Time <SortIcon field="scheduled_at" />
              </th>
              <th
                onClick={() => handleSort('service_name')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Service <SortIcon field="service_name" />
              </th>
              <th
                onClick={() => handleSort('person_name')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Person <SortIcon field="person_name" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Provider
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Status <SortIcon field="status" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 w-32 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedSessions.map((session) => (
              <tr
                key={session.id}
                className="hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => onEdit(session)}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-white">
                      {formatShortDate(session.scheduled_at)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(session.scheduled_at)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-white">{session.service_name}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{session.person_name}</td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {session.provider_name || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    {session.is_group_session && (
                      <Users className="h-3.5 w-3.5 text-purple-400" aria-label="Group Session" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {session.duration ? `${session.duration} min` : '—'}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(session)}
                      className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {session.status === 'Scheduled' && (
                      <button
                        onClick={() => onComplete(session)}
                        className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                        aria-label="Complete"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {(session.status === 'Scheduled' || session.status === 'Rescheduled') && (
                      <button
                        onClick={() => onCancel(session)}
                        className="p-1 text-gray-400 hover:text-orange-400 transition-colors"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(session)}
                      className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
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
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sessions.length)} of{' '}
            {sessions.length} sessions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
