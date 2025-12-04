/**
 * Service Assignments Page
 *
 * Manages service assignments linking services to clients and persons
 */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ServiceAssignmentsTable } from '@/components/service-assignments/ServiceAssignmentsTable'
import { ServiceAssignmentsFilters } from '@/components/service-assignments/ServiceAssignmentsFilters'
import { ServiceAssignmentFormModal } from '@/components/service-assignments/ServiceAssignmentFormModal'
import { useSearchAssignments } from '@/hooks/useServices'
import type { AssignmentSearchParams } from '@/api/services'

export function ServiceAssignmentsPage() {
  usePageTitle(
    'Service Assignments',
    'Manage service assignments for clients and persons'
  )

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [filters, setFilters] = useState<AssignmentSearchParams>({})

  // Fetch assignments with filters
  const { data: assignments = [], isLoading } = useSearchAssignments(filters)

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
  }

  const handleEditSuccess = () => {
    setEditingAssignmentId(null)
  }

  const handleEdit = (assignmentId: string) => {
    setEditingAssignmentId(assignmentId)
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6 border-b border-theme">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-theme">Service Assignments</h1>
              <p className="text-sm text-theme-secondary mt-1">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Assign Service
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-theme">
          <ServiceAssignmentsFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden">
          <ServiceAssignmentsTable
            assignments={assignments}
            isLoading={isLoading}
            onEdit={handleEdit}
          />
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <ServiceAssignmentFormModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {/* Edit Modal */}
        {editingAssignmentId && (
          <ServiceAssignmentFormModal
            isOpen={true}
            assignmentId={editingAssignmentId}
            onClose={() => setEditingAssignmentId(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </AppLayout>
  )
}
