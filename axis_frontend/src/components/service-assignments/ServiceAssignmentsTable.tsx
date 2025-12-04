/**
 * Service Assignments Table Component
 *
 * Displays list of service assignments with client, person, and usage information
 */

import { Link } from 'react-router-dom'
import { Building2, User, Calendar, Edit, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { useDeleteAssignment } from '@/hooks/useServices'
import type { ServiceAssignmentList } from '@/api/services'

interface ServiceAssignmentsTableProps {
  assignments: ServiceAssignmentList[]
  isLoading: boolean
  onEdit: (assignmentId: string) => void
}

export function ServiceAssignmentsTable({
  assignments,
  isLoading,
  onEdit,
}: ServiceAssignmentsTableProps) {
  const deleteAssignmentMutation = useDeleteAssignment()

  const handleDelete = async (assignmentId: string, serviceName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the assignment for "${serviceName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      await deleteAssignmentMutation.mutateAsync(assignmentId)
      toast.success('Assignment deleted successfully')
    } catch (error) {
      toast.error('Failed to delete assignment')
    }
  }

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
        <div className="text-theme-secondary">Loading assignments...</div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">No Assignments Found</h3>
          <p className="text-theme-secondary">
            No service assignments match the current filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto h-full">
      <table className="w-full">
        <thead className="bg-theme-secondary sticky top-0 z-10">
          <tr className="border-b border-theme">
            <th className="text-left p-4 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
              Service
            </th>
            <th className="text-left p-4 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
              Client
            </th>
            <th className="text-left p-4 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
              Person
            </th>
            <th className="text-center p-4 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
              Sessions
            </th>
            <th className="text-left p-4 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
              Date Range
            </th>
            <th className="text-center p-4 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
              Status
            </th>
            <th className="text-right p-4 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme">
          {assignments.map((assignment) => (
            <tr key={assignment.id} className="hover:bg-theme-secondary transition-colors">
              {/* Service */}
              <td className="p-4">
                <Link
                  to={`/services/${assignment.service_id}`}
                  className="text-theme hover:text-cream-400 transition-colors font-medium"
                >
                  {assignment.service_name}
                </Link>
              </td>

              {/* Client */}
              <td className="p-4">
                <Link
                  to={`/clients/${assignment.client_id}`}
                  className="flex items-center gap-2 text-theme-secondary hover:text-theme transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  {assignment.client_name}
                </Link>
              </td>

              {/* Person */}
              <td className="p-4">
                {assignment.person_id && assignment.person_name ? (
                  <Link
                    to={`/persons/${assignment.person_id}`}
                    className="flex items-center gap-2 text-theme-secondary hover:text-theme transition-colors"
                  >
                    <User className="h-4 w-4" />
                    {assignment.person_name}
                  </Link>
                ) : (
                  <span className="text-theme-tertiary text-sm">All persons</span>
                )}
              </td>

              {/* Sessions */}
              <td className="p-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`text-lg font-bold ${getUsageColor(
                      assignment.used_sessions,
                      assignment.assigned_sessions
                    )}`}
                  >
                    {assignment.used_sessions} / {assignment.assigned_sessions}
                  </div>
                  <div className="text-xs text-theme-tertiary">
                    {assignment.remaining_sessions} remaining
                  </div>
                </div>
              </td>

              {/* Date Range */}
              <td className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-theme-tertiary" />
                  <div>
                    <div className="text-theme-secondary">
                      {assignment.start_date ? formatDate(assignment.start_date) : 'No start'}
                    </div>
                    {assignment.end_date && (
                      <div className="text-theme-tertiary text-xs">
                        to {formatDate(assignment.end_date)}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="p-4 text-center">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(
                    assignment.status
                  )}`}
                >
                  {assignment.status}
                </span>
              </td>

              {/* Actions */}
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(assignment.id)}
                    className="p-2 text-theme-secondary hover:text-theme hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit assignment"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id, assignment.service_name)}
                    className="p-2 text-theme-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete assignment"
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
  )
}
