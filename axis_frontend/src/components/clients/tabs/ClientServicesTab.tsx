/**
 * Client Services Tab Component
 *
 * Displays service assignments for a client with session tracking
 */

import { useState } from 'react'
import { Plus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getClientAssignments } from '@/api/services'
import { formatDate } from '@/lib/utils'
import type { Client } from '@/api/clients'

interface ClientServicesTabProps {
  client: Client
}

export function ClientServicesTab({ client }: ClientServicesTabProps) {
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)

  // Fetch service assignments for this client
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['service-assignments', 'client', client.id],
    queryFn: () => getClientAssignments(client.id),
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'Inactive':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'Pending':
        return 'text-cream-400 bg-yellow-500/10 border-yellow-500/20'
      case 'Archived':
        return 'text-gray-500 bg-gray-600/10 border-gray-600/20'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getUsageColor = (used: number, total: number) => {
    const percentage = (used / total) * 100
    if (percentage >= 90) return 'text-red-400'
    if (percentage >= 70) return 'text-cream-400'
    return 'text-cream-400'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-secondary">Loading service assignments...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-theme">Service Assignments</h2>
          <p className="text-sm text-theme-secondary mt-1">
            Manage services assigned to this client
          </p>
        </div>
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Assign Service
        </button>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-theme-secondary rounded-lg border border-theme">
          <AlertCircle className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">No Services Assigned</h3>
          <p className="text-theme-secondary mb-4">
            This client doesn't have any services assigned yet.
          </p>
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors"
          >
            Assign First Service
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-theme-secondary border border-theme rounded-lg p-6 hover:border-cream-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/services/${assignment.service_id}`}
                      className="text-lg font-semibold text-theme hover:text-cream-400 transition-colors"
                    >
                      {assignment.service_name}
                    </Link>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(
                        assignment.status
                      )}`}
                    >
                      {assignment.status}
                    </span>
                  </div>

                  {assignment.person_name && (
                    <Link
                      to={`/persons/${assignment.person_id}`}
                      className="text-sm text-theme-secondary hover:text-theme transition-colors"
                    >
                      For: {assignment.person_name}
                    </Link>
                  )}
                </div>

                {/* Session Usage */}
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${getUsageColor(
                      assignment.used_sessions,
                      assignment.assigned_sessions
                    )}`}
                  >
                    {assignment.used_sessions} / {assignment.assigned_sessions}
                  </div>
                  <div className="text-xs text-theme-tertiary">Sessions Used</div>
                  <div className="text-sm text-theme-secondary mt-1">
                    {assignment.remaining_sessions} remaining
                  </div>
                </div>
              </div>

              {/* Details Row */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-theme">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-theme-tertiary" />
                  <div>
                    <div className="text-theme-tertiary">Start Date</div>
                    <div className="text-theme">
                      {assignment.start_date ? formatDate(assignment.start_date) : 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-theme-tertiary" />
                  <div>
                    <div className="text-theme-tertiary">End Date</div>
                    <div className="text-theme">
                      {assignment.end_date ? formatDate(assignment.end_date) : 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-theme-tertiary" />
                  <div>
                    <div className="text-theme-tertiary">Created</div>
                    <div className="text-theme">{formatDate(assignment.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-theme">
                <button
                  onClick={() => {
                    // TODO: Open session creation modal with pre-filled assignment
                    toast.info('Session scheduling coming soon')
                  }}
                  className="flex-1 px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors text-sm font-medium"
                >
                  Schedule Session
                </button>
                <button
                  onClick={() => {
                    // TODO: Open edit assignment modal
                    toast.info('Edit assignment coming soon')
                  }}
                  className="px-4 py-2 bg-white/10 text-theme rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <Link
                  to={`/sessions?assignment=${assignment.id}`}
                  className="px-4 py-2 bg-white/10 text-theme rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                >
                  View Sessions
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add ServiceAssignmentFormModal when created */}
      {showAssignmentModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowAssignmentModal(false)}
        >
          <div
            className="bg-theme border border-theme rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-theme mb-4">Assign Service</h3>
            <p className="text-theme-secondary">
              Service assignment modal will be implemented next.
            </p>
            <button
              onClick={() => setShowAssignmentModal(false)}
              className="mt-4 px-4 py-2 bg-white/10 text-theme rounded-lg hover:bg-white/20 transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
