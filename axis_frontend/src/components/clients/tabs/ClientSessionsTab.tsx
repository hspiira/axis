/**
 * Client Sessions Tab Component
 *
 * Displays all sessions for a client across all persons
 */

import { useState } from 'react'
import { Calendar, User, Stethoscope, Clock, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchSessions, SessionStatus } from '@/api/services'
import { formatDate } from '@/lib/utils'
import { SessionStatusBadge, SummaryStats, sessionStatPresets } from '@/components/ui'
import type { Client } from '@/api/clients'

interface ClientSessionsTabProps {
  client: Client
}

export function ClientSessionsTab({ client }: ClientSessionsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [personFilter, setPersonFilter] = useState<string>('all')

  // Fetch all sessions for this client
  // Note: We'll need to filter by client in the backend or fetch all client persons first
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', 'client', client.id, statusFilter],
    queryFn: async () => {
      // For now, we'll fetch all sessions and rely on backend filtering
      // In production, backend should support client_id filter
      const allSessions = await searchSessions({
        // We would ideally pass client_id here if backend supports it
      })
      return allSessions
    },
  })

  const filteredSessions = sessions.filter((session) => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false
    // Additional filtering would be applied here
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-secondary">Loading sessions...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-theme">Sessions</h2>
          <p className="text-sm text-theme-secondary mt-1">
            All sessions for {client.name} and associated persons
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-theme-secondary rounded-lg border border-theme">
        <Filter className="h-5 w-5 text-theme-tertiary" />

        <div className="flex-1">
          <label className="text-xs text-theme-tertiary mb-1 block">Status</label>
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

        <div className="flex-1">
          <label className="text-xs text-theme-tertiary mb-1 block">Person</label>
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="w-full px-3 py-2 bg-theme border border-theme rounded-lg text-theme text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
          >
            <option value="all">All Persons</option>
            {/* TODO: Populate with client's persons */}
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-theme-secondary rounded-lg border border-theme">
          <Calendar className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">No Sessions Found</h3>
          <p className="text-theme-secondary mb-4">
            {statusFilter !== 'all'
              ? 'No sessions match the selected filters.'
              : 'No sessions have been scheduled yet.'}
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
                    <SessionStatusBadge status={session.status} variant="card" />
                    {session.is_group_session && (
                      <span className="px-2 py-1 text-xs font-medium rounded-md border text-purple-400 bg-purple-500/10 border-purple-500/20">
                        Group
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-theme-secondary">
                    {formatDate(session.scheduled_at)}
                  </div>
                  {session.duration && (
                    <div className="text-xs text-theme-tertiary mt-1">{session.duration} min</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-theme-tertiary" />
                  <div>
                    <div className="text-theme-tertiary">Person</div>
                    <div className="text-theme">{session.person_name}</div>
                  </div>
                </div>

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

      {/* Summary Stats */}
      {filteredSessions.length > 0 && (
        <SummaryStats stats={[
          sessionStatPresets.total(filteredSessions.length),
          sessionStatPresets.completed(filteredSessions.filter((s) => s.status === 'Completed').length),
          sessionStatPresets.upcoming(filteredSessions.filter((s) => s.status === 'Scheduled' || s.status === 'Rescheduled').length),
          sessionStatPresets.canceled(filteredSessions.filter((s) => s.status === 'Canceled' || s.status === 'No Show').length)
        ]} />
      )}
    </div>
  )
}
