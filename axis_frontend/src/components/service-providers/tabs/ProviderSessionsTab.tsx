/**
 * Provider Sessions Tab
 *
 * Lists all sessions conducted by this provider
 */

import { useState, useMemo } from 'react'
import { Calendar, Search, AlertCircle, Loader2 } from 'lucide-react'
import { type ServiceProvider, SessionStatus } from '@/api/services'
import { useSearchSessions } from '@/hooks/useServices'
import { SessionsTable } from '@/components/sessions/SessionsTable'
import { SummaryStats } from '@/components/ui'

interface ProviderSessionsTabProps {
  provider: ServiceProvider
}

export function ProviderSessionsTab({ provider }: ProviderSessionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all')

  // Fetch sessions for this provider
  const { data: sessions = [], isLoading, error } = useSearchSessions({
    provider_id: provider.id,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions

    const query = searchQuery.toLowerCase()
    return sessions.filter((session) => {
      const personName = session.person_name?.toLowerCase() || ''
      const serviceName = session.service_name?.toLowerCase() || ''
      return personName.includes(query) || serviceName.includes(query)
    })
  }, [sessions, searchQuery])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSessions = sessions.length
    const completed = sessions.filter((s) => s.status === 'Completed').length
    const scheduled = sessions.filter((s) => s.status === 'Scheduled' || s.status === 'Rescheduled').length
    const canceled = sessions.filter((s) => s.status === 'Canceled').length
    const noShow = sessions.filter((s) => s.status === 'No Show').length
    const completionRate = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0

    return {
      totalSessions,
      completed,
      scheduled,
      canceled,
      noShow,
      completionRate,
    }
  }, [sessions])

  // Status options
  const statusOptions: { value: SessionStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: SessionStatus.SCHEDULED, label: 'Scheduled' },
    { value: SessionStatus.COMPLETED, label: 'Completed' },
    { value: SessionStatus.CANCELED, label: 'Canceled' },
    { value: SessionStatus.NO_SHOW, label: 'No Show' },
    { value: SessionStatus.RESCHEDULED, label: 'Rescheduled' },
    { value: SessionStatus.POSTPONED, label: 'Postponed' },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cream-500" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">Failed to load sessions</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Statistics Cards */}
      <SummaryStats
        variant="cards"
        columns={6}
        stats={[
          {
            label: 'Total Sessions',
            value: stats.totalSessions,
            icon: Calendar,
            iconColor: 'text-cream-400',
            color: 'text-white',
          },
          {
            label: 'Completed',
            value: stats.completed,
            icon: Calendar,
            iconColor: 'text-emerald-400',
            color: 'text-white',
          },
          {
            label: 'Scheduled',
            value: stats.scheduled,
            icon: Calendar,
            iconColor: 'text-amber-400',
            color: 'text-white',
          },
          {
            label: 'Canceled',
            value: stats.canceled,
            icon: Calendar,
            iconColor: 'text-red-400',
            color: 'text-white',
          },
          {
            label: 'No Show',
            value: stats.noShow,
            icon: Calendar,
            iconColor: 'text-gray-400',
            color: 'text-white',
          },
          {
            label: 'Completion Rate',
            value: `${stats.completionRate}%`,
            icon: Calendar,
            iconColor: 'text-purple-400',
            color: 'text-white',
          },
        ]}
      />

      {/* Sessions List Section */}
      <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Provider Sessions</h3>
            <p className="text-sm text-gray-400 mt-1">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'} conducted by {provider.name}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by person or service..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-cream-500/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50 transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
              className="px-3 py-2 bg-white/5 border border-cream-500/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50 transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sessions Table */}
        {filteredSessions.length > 0 ? (
          <SessionsTable sessions={filteredSessions} isLoading={isLoading} />
        ) : (
          <div className="text-center py-12">
            {searchQuery || statusFilter !== 'all' ? (
              <>
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No sessions found matching your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                  className="mt-2 text-sm text-cream-400 hover:text-cream-300 transition-colors"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No sessions found for this provider</p>
                <p className="text-sm text-gray-500 mt-1">
                  Sessions will appear here once they are scheduled with this provider
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
