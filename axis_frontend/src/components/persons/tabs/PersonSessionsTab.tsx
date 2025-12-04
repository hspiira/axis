/**
 * Person Sessions Tab Component
 *
 * Displays session history for a specific person
 */

import { useState } from 'react'
import { Stethoscope, Clock, Filter, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPersonSessions, SessionStatus } from '@/api/services'
import { formatDate } from '@/lib/utils'
import type { Person } from '@/api/persons'

interface PersonSessionsTabProps {
  person: Person
}

export function PersonSessionsTab({ person }: PersonSessionsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch sessions for this person
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', 'person', person.id, statusFilter],
    queryFn: () => getPersonSessions(person.id),
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'Scheduled':
      case 'Rescheduled':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'Canceled':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'No Show':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'Postponed':
        return 'text-cream-400 bg-yellow-500/10 border-yellow-500/20'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const filteredSessions = sessions.filter((session) => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-secondary">Loading sessions...</div>
      </div>
    )
  }

  const upcomingSessions = filteredSessions.filter(
    (s) => s.status === 'Scheduled' || s.status === 'Rescheduled'
  )
  const completedSessions = filteredSessions.filter((s) => s.status === 'Completed')
  const canceledSessions = filteredSessions.filter(
    (s) => s.status === 'Canceled' || s.status === 'No Show'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-theme">Session History</h2>
          <p className="text-sm text-theme-secondary mt-1">
            All sessions for {person.profile?.full_name || 'this person'}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-theme-secondary rounded-lg border border-theme">
          <div className="text-center">
            <div className="text-2xl font-bold text-theme">{sessions.length}</div>
            <div className="text-xs text-theme-tertiary">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{upcomingSessions.length}</div>
            <div className="text-xs text-theme-tertiary">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{completedSessions.length}</div>
            <div className="text-xs text-theme-tertiary">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{canceledSessions.length}</div>
            <div className="text-xs text-theme-tertiary">Canceled/No Show</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-theme-secondary rounded-lg border border-theme">
        <Filter className="h-5 w-5 text-theme-tertiary" />
        <div className="flex-1">
          <label className="text-xs text-theme-tertiary mb-1 block">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-theme border border-theme rounded-lg text-theme text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
          >
            <option value="all">All Statuses</option>
            <option value={SessionStatus.SCHEDULED}>Scheduled</option>
            <option value={SessionStatus.COMPLETED}>Completed</option>
            <option value={SessionStatus.CANCELED}>Canceled</option>
            <option value={SessionStatus.NO_SHOW}>No Show</option>
            <option value={SessionStatus.RESCHEDULED}>Rescheduled</option>
            <option value={SessionStatus.POSTPONED}>Postponed</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-theme-secondary rounded-lg border border-theme">
          <AlertCircle className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">No Sessions Found</h3>
          <p className="text-theme-secondary mb-4">
            {statusFilter !== 'all'
              ? 'No sessions match the selected filter.'
              : 'No sessions have been scheduled for this person yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className="block bg-theme-secondary border border-theme rounded-lg p-6 hover:border-cream-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-theme">{session.service_name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                    {session.is_group_session && (
                      <span className="px-2 py-1 text-xs font-medium rounded-md border text-purple-400 bg-purple-500/10 border-purple-500/20">
                        Group
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-theme">
                    {formatDate(session.scheduled_at)}
                  </div>
                  {session.duration && (
                    <div className="text-xs text-theme-tertiary mt-1">{session.duration} min</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {session.provider_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="h-4 w-4 text-theme-tertiary" />
                    <div>
                      <div className="text-theme-tertiary">Provider</div>
                      <div className="text-theme">{session.provider_name}</div>
                    </div>
                  </div>
                )}

                {session.completed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-theme-tertiary" />
                    <div>
                      <div className="text-theme-tertiary">Completed</div>
                      <div className="text-theme">{formatDate(session.completed_at)}</div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
