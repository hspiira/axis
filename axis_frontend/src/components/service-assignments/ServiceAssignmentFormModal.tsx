/**
 * Service Assignment Form Modal Component
 *
 * Modal for creating and editing service assignments
 */

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import {
  useCreateAssignment,
  useUpdateAssignment,
} from '@/hooks/useServices'
import { useClients } from '@/hooks/useClients'
import { useServices } from '@/hooks/useServices'
import { personsApi } from '@/api/persons'
import { contractsApi } from '@/api/contracts'
import { getAssignment, ServiceStatus, type ServiceAssignmentFormData } from '@/api/services'

interface ServiceAssignmentFormModalProps {
  isOpen: boolean
  assignmentId?: string
  onClose: () => void
  onSuccess: () => void
  prefilledClientId?: string
  prefilledPersonId?: string
}

export function ServiceAssignmentFormModal({
  isOpen,
  assignmentId,
  onClose,
  onSuccess,
  prefilledClientId,
  prefilledPersonId,
}: ServiceAssignmentFormModalProps) {
  const isEditing = !!assignmentId

  // Fetch data for dropdowns
  const { data: clients = [] } = useClients()
  const { data: services = [] } = useServices()
  const { data: assignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => getAssignment(assignmentId!),
    enabled: isEditing && !!assignmentId,
  })

  // Fetch persons and contracts based on selected client
  const [selectedClientId, setSelectedClientId] = useState(prefilledClientId || '')
  const { data: personsResponse } = useQuery({
    queryKey: ['persons', 'client', selectedClientId],
    queryFn: () => personsApi.list(),
    enabled: !!selectedClientId,
  })
  const persons = personsResponse?.results || []

  const { data: contractsResponse } = useQuery({
    queryKey: ['contracts', 'client', selectedClientId],
    queryFn: () => contractsApi.list(),
    enabled: !!selectedClientId,
  })
  const contracts = contractsResponse?.results || []

  // Form state
  const [formData, setFormData] = useState<ServiceAssignmentFormData>({
    service_id: '',
    client_id: prefilledClientId || '',
    person_id: prefilledPersonId,
    contract_id: undefined,
    assigned_sessions: 10,
    start_date: undefined,
    end_date: undefined,
    status: ServiceStatus.ACTIVE,
  })

  // Mutations
  const createMutation = useCreateAssignment()
  const updateMutation = useUpdateAssignment()

  // Load assignment data for editing
  useEffect(() => {
    if (assignment) {
      setFormData({
        service_id: assignment.service.id,
        client_id: assignment.client_id,
        person_id: assignment.person_id || undefined,
        contract_id: assignment.contract_id || undefined,
        assigned_sessions: assignment.assigned_sessions,
        start_date: assignment.start_date || undefined,
        end_date: assignment.end_date || undefined,
        status: assignment.status as ServiceStatus,
      })
      setSelectedClientId(assignment.client_id)
    }
  }, [assignment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing && assignmentId) {
        await updateMutation.mutateAsync({ id: assignmentId, data: formData })
        toast.success('Assignment updated successfully')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Assignment created successfully')
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save assignment')
    }
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    setFormData({
      ...formData,
      client_id: clientId,
      person_id: undefined,
      contract_id: undefined,
    })
  }

  if (!isOpen) return null

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme border border-theme rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme">
          <h2 className="text-xl font-semibold text-theme">
            {isEditing ? 'Edit Assignment' : 'Assign Service'}
          </h2>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Client *
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => handleClientChange(e.target.value)}
              required
              disabled={isEditing}
              className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {isEditing && (
              <p className="mt-1 text-xs text-theme-tertiary">
                Client cannot be changed after creation
              </p>
            )}
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Service *
            </label>
            <select
              value={formData.service_id}
              onChange={(e) =>
                setFormData({ ...formData, service_id: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                  {service.default_price && ` - $${service.default_price}`}
                </option>
              ))}
            </select>
          </div>

          {/* Person Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Person (Optional)
            </label>
            <select
              value={formData.person_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, person_id: e.target.value || undefined })
              }
              disabled={!selectedClientId}
              className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500 disabled:opacity-50"
            >
              <option value="">All persons (not specific)</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.profile?.full_name || 'Unknown'}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-theme-tertiary">
              Leave empty to assign to all persons under this client
            </p>
          </div>

          {/* Contract Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Contract (Optional)
            </label>
            <select
              value={formData.contract_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, contract_id: e.target.value || undefined })
              }
              disabled={!selectedClientId}
              className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500 disabled:opacity-50"
            >
              <option value="">No specific contract</option>
              {contracts.map((contract: any) => (
                <option key={contract.id} value={contract.id}>
                  Contract - {contract.status || 'Active'}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Sessions */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Assigned Sessions *
            </label>
            <input
              type="number"
              min="1"
              value={formData.assigned_sessions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assigned_sessions: parseInt(e.target.value) || 0,
                })
              }
              required
              className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
            />
            <p className="mt-1 text-xs text-theme-tertiary">
              Total number of sessions allocated for this assignment
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value || undefined })
                }
                className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value || undefined })
                }
                className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as ServiceStatus })
              }
              required
              className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
            >
              <option value={ServiceStatus.ACTIVE}>Active</option>
              <option value={ServiceStatus.INACTIVE}>Inactive</option>
              <option value={ServiceStatus.PENDING}>Pending</option>
              <option value={ServiceStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-theme-secondary hover:text-theme transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
