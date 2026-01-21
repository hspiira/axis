/**
 * Service Assignments Tab
 *
 * Lists all assignments for this service
 */

import { useState, useMemo } from 'react'
import { Users, Search, AlertCircle, Loader2 } from 'lucide-react'
import { type Service } from '@/api/services'
import { useSearchAssignments } from '@/hooks/useServices'
import { ServiceAssignmentsTable } from '@/components/service-assignments/ServiceAssignmentsTable'
import { SummaryStats } from '@/components/ui'

interface ServiceAssignmentsTabProps {
  service: Service
}

export function ServiceAssignmentsTab({ service }: ServiceAssignmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch assignments for this service
  const { data: assignments = [], isLoading, error } = useSearchAssignments({ service_id: service.id })

  // Filter assignments by search query
  const filteredAssignments = useMemo(() => {
    if (!searchQuery.trim()) return assignments

    const query = searchQuery.toLowerCase()
    return assignments.filter((assignment) => {
      const clientName = assignment.client_name?.toLowerCase() || ''
      const personName = assignment.person_name?.toLowerCase() || ''
      return clientName.includes(query) || personName.includes(query)
    })
  }, [assignments, searchQuery])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAssignments = assignments.length
    const activeAssignments = assignments.filter((a) => a.status === 'Active').length
    const totalSessions = assignments.reduce((sum, a) => sum + a.assigned_sessions, 0)
    const usedSessions = assignments.reduce((sum, a) => sum + a.used_sessions, 0)
    const remainingSessions = assignments.reduce((sum, a) => sum + a.remaining_sessions, 0)

    return {
      totalAssignments,
      activeAssignments,
      totalSessions,
      usedSessions,
      remainingSessions,
    }
  }, [assignments])

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
        <p className="text-gray-400">Failed to load assignments</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <SummaryStats
        variant="cards"
        columns={5}
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
            label: 'Total Sessions',
            value: stats.totalSessions,
            icon: Users,
            iconColor: 'text-cream-400',
            color: 'text-white',
          },
          {
            label: 'Used Sessions',
            value: stats.usedSessions,
            icon: Users,
            iconColor: 'text-purple-400',
            color: 'text-white',
          },
          {
            label: 'Remaining Sessions',
            value: stats.remainingSessions,
            icon: Users,
            iconColor: 'text-amber-400',
            color: 'text-white',
          },
        ]}
      />

      {/* Assignments List Section */}
      <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
        {/* Header with Search */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Service Assignments</h3>
            <p className="text-sm text-gray-400 mt-1">
              {filteredAssignments.length} {filteredAssignments.length === 1 ? 'assignment' : 'assignments'} for {service.name}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client or person name..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-cream-500/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50 transition-all"
            />
          </div>
        </div>

        {/* Assignments Table */}
        {filteredAssignments.length > 0 ? (
          <ServiceAssignmentsTable
            assignments={filteredAssignments}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No assignments found matching your search</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-cream-400 hover:text-cream-300 transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No assignments found for this service</p>
                <p className="text-sm text-gray-500 mt-1">
                  Assignments will appear here once this service is assigned to clients
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
