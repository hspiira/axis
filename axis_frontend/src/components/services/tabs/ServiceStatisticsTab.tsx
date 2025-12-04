/**
 * Service Statistics Tab
 *
 * Displays usage metrics and statistics for the service
 */

import { useMemo } from 'react'
import {
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  DollarSign,
  Target,
  Percent,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { type Service } from '@/api/services'
import { useSearchAssignments, useSearchSessions } from '@/hooks/useServices'
import { SummaryStats } from '@/components/ui'

interface ServiceStatisticsTabProps {
  service: Service
}

export function ServiceStatisticsTab({ service }: ServiceStatisticsTabProps) {
  // Fetch assignments and sessions for this service
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useSearchAssignments({
    service_id: service.id,
  })
  const { data: sessions = [], isLoading: sessionsLoading, error: sessionsError } = useSearchSessions({
    service_id: service.id,
  })

  const isLoading = assignmentsLoading || sessionsLoading
  const error = assignmentsError || sessionsError

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    // Assignment statistics
    const totalAssignments = assignments.length
    const activeAssignments = assignments.filter((a) => a.status === 'Active').length
    const totalSessionsAllocated = assignments.reduce((sum, a) => sum + a.assigned_sessions, 0)
    const totalSessionsUsed = assignments.reduce((sum, a) => sum + a.used_sessions, 0)
    const totalSessionsRemaining = assignments.reduce((sum, a) => sum + a.remaining_sessions, 0)
    const utilizationRate = totalSessionsAllocated > 0
      ? Math.round((totalSessionsUsed / totalSessionsAllocated) * 100)
      : 0

    // Session statistics
    const totalSessions = sessions.length
    const completedSessions = sessions.filter((s) => s.status === 'Completed').length
    const scheduledSessions = sessions.filter((s) => s.status === 'Scheduled' || s.status === 'Rescheduled').length
    const canceledSessions = sessions.filter((s) => s.status === 'Canceled').length
    const noShowSessions = sessions.filter((s) => s.status === 'No Show').length
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    const noShowRate = totalSessions > 0 ? Math.round((noShowSessions / totalSessions) * 100) : 0
    const cancellationRate = totalSessions > 0 ? Math.round((canceledSessions / totalSessions) * 100) : 0

    // Unique clients and persons
    const uniqueClients = new Set(assignments.map((a) => a.client_id)).size
    const uniquePersons = new Set(
      sessions.map((s) => typeof s.person === 'object' ? s.person.id : s.person).filter(Boolean)
    ).size

    // Revenue estimation (if billable)
    const estimatedRevenue = service.is_billable && service.default_price
      ? (parseFloat(service.default_price) * completedSessions).toFixed(2)
      : null

    // Average sessions per person
    const avgSessionsPerPerson = uniquePersons > 0
      ? (completedSessions / uniquePersons).toFixed(1)
      : '0'

    return {
      totalAssignments,
      activeAssignments,
      totalSessionsAllocated,
      totalSessionsUsed,
      totalSessionsRemaining,
      utilizationRate,
      totalSessions,
      completedSessions,
      scheduledSessions,
      canceledSessions,
      noShowSessions,
      completionRate,
      noShowRate,
      cancellationRate,
      uniqueClients,
      uniquePersons,
      estimatedRevenue,
      avgSessionsPerPerson,
    }
  }, [assignments, sessions, service])

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
        <p className="text-gray-400">Failed to load statistics</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Overview Statistics */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cream-400" />
          Usage Overview
        </h3>
        <SummaryStats
          variant="cards"
          columns={4}
          stats={[
            {
              label: 'Total Assignments',
              value: stats.totalAssignments,
              icon: Users,
              iconColor: 'text-cream-400',
              color: 'text-white',
            },
            {
              label: 'Active Assignments',
              value: stats.activeAssignments,
              icon: Users,
              iconColor: 'text-emerald-400',
              color: 'text-white',
            },
            {
              label: 'Unique Clients',
              value: stats.uniqueClients,
              icon: Users,
              iconColor: 'text-purple-400',
              color: 'text-white',
            },
            {
              label: 'Unique Persons',
              value: stats.uniquePersons,
              icon: Users,
              iconColor: 'text-amber-400',
              color: 'text-white',
            },
          ]}
        />
      </div>

      {/* Session Allocation */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-cream-400" />
          Session Allocation
        </h3>
        <SummaryStats
          variant="cards"
          columns={4}
          stats={[
            {
              label: 'Sessions Allocated',
              value: stats.totalSessionsAllocated,
              icon: Calendar,
              iconColor: 'text-cream-400',
              color: 'text-white',
            },
            {
              label: 'Sessions Used',
              value: stats.totalSessionsUsed,
              icon: Calendar,
              iconColor: 'text-emerald-400',
              color: 'text-white',
            },
            {
              label: 'Sessions Remaining',
              value: stats.totalSessionsRemaining,
              icon: Calendar,
              iconColor: 'text-amber-400',
              color: 'text-white',
            },
            {
              label: 'Utilization Rate',
              value: `${stats.utilizationRate}%`,
              icon: Percent,
              iconColor: 'text-purple-400',
              color: 'text-white',
            },
          ]}
        />
      </div>

      {/* Session Statistics */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cream-400" />
          Session Statistics
        </h3>
        <SummaryStats
          variant="cards"
          columns={4}
          stats={[
            {
              label: 'Total Sessions',
              value: stats.totalSessions,
              icon: Calendar,
              iconColor: 'text-cream-400',
              color: 'text-white',
            },
            {
              label: 'Completed Sessions',
              value: stats.completedSessions,
              icon: Calendar,
              iconColor: 'text-emerald-400',
              color: 'text-white',
            },
            {
              label: 'Scheduled Sessions',
              value: stats.scheduledSessions,
              icon: Calendar,
              iconColor: 'text-amber-400',
              color: 'text-white',
            },
            {
              label: 'Avg Sessions/Person',
              value: stats.avgSessionsPerPerson,
              icon: Users,
              iconColor: 'text-purple-400',
              color: 'text-white',
            },
          ]}
        />
      </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-cream-400" />
          Performance Metrics
        </h3>
        <SummaryStats
          variant="cards"
          columns={4}
          stats={[
            {
              label: 'Completion Rate',
              value: `${stats.completionRate}%`,
              icon: Percent,
              iconColor: 'text-emerald-400',
              color: 'text-white',
            },
            {
              label: 'No Show Rate',
              value: `${stats.noShowRate}%`,
              icon: Percent,
              iconColor: 'text-red-400',
              color: 'text-white',
            },
            {
              label: 'Cancellation Rate',
              value: `${stats.cancellationRate}%`,
              icon: Percent,
              iconColor: 'text-amber-400',
              color: 'text-white',
            },
            {
              label: 'Canceled Sessions',
              value: stats.canceledSessions,
              icon: Calendar,
              iconColor: 'text-gray-400',
              color: 'text-white',
            },
          ]}
        />
      </div>

      {/* Revenue Estimation (if billable) */}
      {service.is_billable && stats.estimatedRevenue && (
        <div>
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cream-400" />
            Revenue Estimation
          </h3>
          <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Default Price per Session</p>
                <p className="text-2xl font-bold text-white">${service.default_price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Completed Sessions</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.completedSessions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Estimated Revenue</p>
                <p className="text-2xl font-bold text-cream-400">${stats.estimatedRevenue}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Revenue estimation based on default price and completed sessions. Actual revenue may vary based on contract terms and pricing adjustments.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalAssignments === 0 && stats.totalSessions === 0 && (
        <div className="text-center py-12 bg-white/5 border border-cream-500/10 rounded-lg">
          <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No statistics available yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Statistics will be calculated once this service is assigned and sessions are scheduled
          </p>
        </div>
      )}
    </div>
  )
}
