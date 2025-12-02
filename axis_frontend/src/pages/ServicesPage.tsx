/**
 * Services Page
 *
 * Displays and manages EAP services, providers, and sessions.
 */

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
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
  const { setPageTitle } = usePageTitle()
  const { params: urlParams, updateParams } = useURLSearchParams<ServiceSearchParams>()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceList | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
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

  useEffect(() => {
    setPageTitle('Services Management', 'Manage EAP services, providers, and sessions')
    return () => setPageTitle(null)
  }, [setPageTitle])

  // Fetch full service data when editing
  const { data: serviceDetail } = useService(editingService?.id || '')

  const handleCreate = () => {
    setEditingService(null)
    setIsCreateModalOpen(true)
  }

  const handleEdit = (service: ServiceList) => {
    setEditingService(service)
    setIsCreateModalOpen(true)
  }

  const handleActivate = (service: ServiceList) => {
    setConfirmAction({ type: 'activate', service })
  }

  const handleDeactivate = (service: ServiceList) => {
    setConfirmAction({ type: 'deactivate', service })
  }

  const handleDelete = (service: ServiceList) => {
    setConfirmAction({ type: 'delete', service })
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    try {
      switch (confirmAction.type) {
        case 'activate':
          await activateServiceMutation.mutateAsync(confirmAction.service.id)
          break
        case 'deactivate':
          await deactivateServiceMutation.mutateAsync(confirmAction.service.id)
          break
        case 'delete':
          await deleteServiceMutation.mutateAsync(confirmAction.service.id)
          break
      }
      setConfirmAction(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleFormSubmit = async (data: ServiceFormData) => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, data })
      } else {
        await createService.mutateAsync(data)
      }
      setIsCreateModalOpen(false)
      setEditingService(null)
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
    { enabled: !isCreateModalOpen }
  )

  useKeyboardShortcut(
    { key: 'e', metaKey: true },
    handleExport,
    { enabled: !isExporting && services.length > 0 }
  )

  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
        setEditingService(null)
      } else if (confirmAction) {
        setConfirmAction(null)
      }
    },
    { enabled: true }
  )

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Filters */}
        <div className="mb-6">
          <ServicesFilters
            filters={filters}
            onFiltersChange={updateParams}
            onCreate={handleCreate}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </div>

        {/* Services Table */}
        <ServicesTable
          services={services}
          isLoading={isLoading}
          onEdit={handleEdit}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onDelete={handleDelete}
        />
      </div>

      {/* Create/Edit Modal */}
      <ServiceFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingService(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={
          editingService && serviceDetail
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
        title={editingService ? 'Edit Service' : 'Add New Service'}
      />

      {/* Confirm Dialogs */}
      {confirmAction?.type === 'activate' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Activate Service"
          message={`Are you sure you want to activate ${confirmAction.service.name}? This will make the service available for assignments.`}
          confirmText="Activate"
          cancelText="Cancel"
          variant="success"
          isLoading={activateServiceMutation.isPending}
        />
      )}

      {confirmAction?.type === 'deactivate' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Deactivate Service"
          message={`Are you sure you want to deactivate ${confirmAction.service.name}? This will prevent new assignments.`}
          confirmText="Deactivate"
          cancelText="Cancel"
          variant="warning"
          isLoading={deactivateServiceMutation.isPending}
        />
      )}

      {confirmAction?.type === 'delete' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Delete Service"
          message={`Are you sure you want to delete ${confirmAction.service.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteServiceMutation.isPending}
        />
      )}
    </AppLayout>
  )
}
