/**
 * Service Assignments Page
 *
 * Manages service assignments linking services to clients and persons
 */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ResourcePageLayout } from '@/components/layouts/ResourcePageLayout'
import { useModal } from '@/hooks/useModal'
import { ServiceAssignmentsTable } from '@/components/service-assignments/ServiceAssignmentsTable'
import { ServiceAssignmentsFilters } from '@/components/service-assignments/ServiceAssignmentsFilters'
import { ServiceAssignmentFormModal } from '@/components/service-assignments/ServiceAssignmentFormModal'
import { useSearchAssignments } from '@/hooks/useServices'
import type { AssignmentSearchParams } from '@/api/services'

export function ServiceAssignmentsPage() {

  // Modal management
  const createModal = useModal()
  const editModal = useModal<string>()
  const [filters, setFilters] = useState<AssignmentSearchParams>({})

  // Fetch assignments with filters
  const { data: assignments = [], isLoading } = useSearchAssignments(filters)

  const handleCreateSuccess = () => {
    createModal.close()
  }

  const handleEditSuccess = () => {
    editModal.close()
  }

  const handleEdit = (assignmentId: string) => {
    editModal.open(assignmentId)
  }

  return (
    <ResourcePageLayout
      title="Service Assignments"
      subtitle={`${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`}
      filters={<ServiceAssignmentsFilters filters={filters} onFiltersChange={setFilters} />}
      actions={
        <button
          onClick={() => createModal.open()}
          className="flex items-center gap-2 px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Assign Service
        </button>
      }
      modals={
        <>
          {/* Create Modal */}
          <ServiceAssignmentFormModal
            {...createModal.props}
            onSuccess={handleCreateSuccess}
          />

          {/* Edit Modal */}
          <ServiceAssignmentFormModal
            {...editModal.props}
            assignmentId={editModal.data || undefined}
            onSuccess={handleEditSuccess}
          />
        </>
      }
    >
      <ServiceAssignmentsTable
        assignments={assignments}
        isLoading={isLoading}
        onEdit={handleEdit}
      />
    </ResourcePageLayout>
  )
}
