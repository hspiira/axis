/**
 * Services Page
 *
 * Displays and manages EAP services, providers, and sessions.
 */

import { useState } from 'react'
import { ResourcePageLayout } from '@/components/layouts/ResourcePageLayout'
import { useModal } from '@/hooks/useModal'
import { ServicesTable } from '@/components/services/ServicesTable'
import { ServicesFilters } from '@/components/services/ServicesFilters'
import { ServiceFormModal } from '@/components/services/ServiceFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useServices,
  useSearchServices,
  useDeleteService,
  useActivateService,
  useDeactivateService,
  useCreateService,
  useUpdateService,
  useService,
} from '@/hooks/useServices'
import type { ServiceList, ServiceFormData, ServiceSearchParams } from '@/api/services'
import { toast } from '@/lib/toast'
import { exportToCSV, formatDateForExport } from '@/utils/export'
import { useURLSearchParams } from '@/hooks/useURLSearchParams'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

type ConfirmAction =
  | { type: 'deactivate'; service: ServiceList }
  | { type: 'activate'; service: ServiceList }
  | { type: 'delete'; service: ServiceList }
  | null

export function ServicesPage() {
  const { params: urlParams, updateParams } = useURLSearchParams<ServiceSearchParams>()

  // Modal management
  const formModal = useModal<ServiceList>()
  const activateModal = useModal<ServiceList>()
  const deactivateModal = useModal<ServiceList>()
  const deleteModal = useModal<ServiceList>()
  const [isExporting, setIsExporting] = useState(false)

  // Initialize filters from URL params
  const filters = urlParams
  const hasFilters = Object.keys(filters).length > 0
  const servicesQuery = useSearchServices(filters)
  const allServicesQuery = useServices()
  const { data: services = [], isLoading } = hasFilters ? servicesQuery : allServicesQuery

  const deleteServiceMutation = useDeleteService()
  const activateServiceMutation = useActivateService()
  const deactivateServiceMutation = useDeactivateService()
  const createService = useCreateService()
  const updateService = useUpdateService()


  // Fetch full service data when editing
  const { data: serviceDetail } = useService(formModal.data?.id || '')

  const handleCreate = () => {
    formModal.open()
  }

  const handleEdit = (service: ServiceList) => {
    formModal.open(service)
  }

  const handleActivate = (service: ServiceList) => {
    activateModal.open(service)
  }

  const handleDeactivate = (service: ServiceList) => {
    deactivateModal.open(service)
  }

  const handleDelete = (service: ServiceList) => {
    deleteModal.open(service)
  }

  const confirmActivate = async () => {
    if (!activateModal.data) return
    await activateServiceMutation.mutateAsync(activateModal.data.id)
    activateModal.close()
  }

  const confirmDeactivate = async () => {
    if (!deactivateModal.data) return
    await deactivateServiceMutation.mutateAsync(deactivateModal.data.id)
    deactivateModal.close()
  }

  const confirmDelete = async () => {
    if (!deleteModal.data) return
    await deleteServiceMutation.mutateAsync(deleteModal.data.id)
    deleteModal.close()
  }

  const handleFormSubmit = async (data: ServiceFormData) => {
    try {
      if (formModal.data) {
        await updateService.mutateAsync({ id: formModal.data.id, data })
      } else {
        await createService.mutateAsync(data)
      }
      formModal.close()
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleExport = () => {
    try {
      setIsExporting(true)

      const columns = [
        { key: 'name' as keyof ServiceList, label: 'Service Name' },
        { key: 'category_name' as keyof ServiceList, label: 'Category' },
        { key: 'status' as keyof ServiceList, label: 'Status' },
        { key: 'duration_minutes' as keyof ServiceList, label: 'Duration (mins)' },
        { key: 'default_price' as keyof ServiceList, label: 'Default Price' },
        { key: 'is_billable' as keyof ServiceList, label: 'Billable' },
        { key: 'requires_provider' as keyof ServiceList, label: 'Requires Provider' },
        { key: 'active_assignments' as keyof ServiceList, label: 'Active Assignments' },
        { key: 'total_sessions' as keyof ServiceList, label: 'Total Sessions' },
        { key: 'created_at' as keyof ServiceList, label: 'Created Date' },
      ]

      const exportData = services.map((service) => ({
        ...service,
        is_billable: service.is_billable ? 'Yes' : 'No',
        requires_provider: service.requires_provider ? 'Yes' : 'No',
        created_at: formatDateForExport(service.created_at),
      }))

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `services-export-${timestamp}.csv`

      exportToCSV(exportData, columns, filename)

      toast.success(`Exported ${services.length} service${services.length > 1 ? 's' : ''} to CSV`)
    } catch (error) {
      toast.error('Failed to export services')
    } finally {
      setIsExporting(false)
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcut(
    { key: 'n', metaKey: true },
    handleCreate,
    { enabled: !formModal.isOpen }
  )

  useKeyboardShortcut(
    { key: 'e', metaKey: true },
    handleExport,
    { enabled: !isExporting && services.length > 0 }
  )

  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      if (formModal.isOpen) {
        formModal.close()
      }
    },
    { enabled: true }
  )

  return (
    <ResourcePageLayout
      title="Services Management"
      subtitle="Manage EAP services, providers, and sessions"
      filters={
        <ServicesFilters
          filters={filters}
          onFiltersChange={updateParams}
          onCreate={handleCreate}
          onExport={handleExport}
          isExporting={isExporting}
        />
      }
      modals={
        <>
          {/* Create/Edit Modal */}
          <ServiceFormModal
            {...formModal.props}
            onSubmit={handleFormSubmit}
            initialData={
              formModal.data && serviceDetail
                ? {
                    name: serviceDetail.name,
                    description: serviceDetail.description || undefined,
                    category_id: serviceDetail.category?.id || undefined,
                    status: serviceDetail.status,
                    duration_minutes: serviceDetail.duration_minutes || undefined,
                    default_price: serviceDetail.default_price || undefined,
                    is_billable: serviceDetail.is_billable,
                    requires_provider: serviceDetail.requires_provider,
                    max_sessions_per_person: serviceDetail.max_sessions_per_person || undefined,
                    metadata: serviceDetail.metadata || undefined,
                  }
                : undefined
            }
            isLoading={createService.isPending || updateService.isPending}
            title={formModal.data ? 'Edit Service' : 'Add New Service'}
          />

          {/* Confirm Dialogs */}
          <ConfirmDialog
            {...activateModal.props}
            onConfirm={confirmActivate}
            title="Activate Service"
            message={activateModal.data ? `Are you sure you want to activate ${activateModal.data.name}? This will make the service available for assignments.` : ''}
            confirmText="Activate"
            cancelText="Cancel"
            variant="success"
            isLoading={activateServiceMutation.isPending}
          />

          <ConfirmDialog
            {...deactivateModal.props}
            onConfirm={confirmDeactivate}
            title="Deactivate Service"
            message={deactivateModal.data ? `Are you sure you want to deactivate ${deactivateModal.data.name}? This will prevent new assignments.` : ''}
            confirmText="Deactivate"
            cancelText="Cancel"
            variant="warning"
            isLoading={deactivateServiceMutation.isPending}
          />

          <ConfirmDialog
            {...deleteModal.props}
            onConfirm={confirmDelete}
            title="Delete Service"
            message={deleteModal.data ? `Are you sure you want to delete ${deleteModal.data.name}? This action cannot be undone.` : ''}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={deleteServiceMutation.isPending}
          />
        </>
      }
    >
      <ServicesTable
        services={services}
        isLoading={isLoading}
        onEdit={handleEdit}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onDelete={handleDelete}
      />
    </ResourcePageLayout>
  )
}
