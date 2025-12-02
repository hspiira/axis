/**
 * Service Providers Page
 *
 * Displays and manages service providers for EAP services.
 */

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ServiceProvidersTable } from '@/components/service-providers/ServiceProvidersTable'
import { ServiceProvidersFilters } from '@/components/service-providers/ServiceProvidersFilters'
import { ServiceProviderFormModal } from '@/components/service-providers/ServiceProviderFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useProviders,
  useSearchProviders,
  useDeleteProvider,
  useVerifyProvider,
  useCreateProvider,
  useUpdateProvider,
  useProvider,
} from '@/hooks/useServices'
import type { ServiceProviderList, ServiceProviderFormData, ProviderSearchParams } from '@/api/services'
import { toast } from '@/lib/toast'
import { exportToCSV, formatDateForExport } from '@/utils/export'
import { useURLSearchParams } from '@/hooks/useURLSearchParams'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

type ConfirmAction =
  | { type: 'verify'; provider: ServiceProviderList }
  | { type: 'delete'; provider: ServiceProviderList }
  | null

export function ServiceProvidersPage() {
  const { setPageTitle } = usePageTitle()
  const { params: urlParams, updateParams } = useURLSearchParams<ProviderSearchParams>()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ServiceProviderList | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Initialize filters from URL params
  const filters = urlParams
  const hasFilters = Object.keys(filters).length > 0
  const providersQuery = useSearchProviders(filters)
  const allProvidersQuery = useProviders()
  const { data: providers = [], isLoading } = hasFilters ? providersQuery : allProvidersQuery

  const createProvider = useCreateProvider()
  const updateProvider = useUpdateProvider()
  const deleteProvider = useDeleteProvider()
  const verifyProvider = useVerifyProvider()
  const { data: providerDetail } = useProvider(editingProvider?.id || '')

  useEffect(() => {
    setPageTitle('Service Providers', 'Manage EAP service providers')
    return () => setPageTitle(null)
  }, [setPageTitle])

  // Keyboard shortcuts
  useKeyboardShortcut(
    { key: 'n', metaKey: true },
    () => setIsCreateModalOpen(true)
  )
  useKeyboardShortcut(
    { key: 'e', metaKey: true },
    () => {
      if (editingProvider) {
        setIsCreateModalOpen(true)
      }
    }
  )
  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      setIsCreateModalOpen(false)
      setEditingProvider(null)
    }
  )

  const handleCreate = () => {
    setEditingProvider(null)
    setIsCreateModalOpen(true)
  }

  const handleEdit = (provider: ServiceProviderList) => {
    setEditingProvider(provider)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (provider: ServiceProviderList) => {
    setConfirmAction({ type: 'delete', provider })
  }

  const handleVerify = (provider: ServiceProviderList) => {
    setConfirmAction({ type: 'verify', provider })
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'delete') {
        await deleteProvider.mutateAsync(confirmAction.provider.id)
      } else if (confirmAction.type === 'verify') {
        await verifyProvider.mutateAsync(confirmAction.provider.id)
      }
      setConfirmAction(null)
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  const handleSubmit = async (data: ServiceProviderFormData) => {
    try {
      if (editingProvider) {
        await updateProvider.mutateAsync({ id: editingProvider.id, data })
      } else {
        await createProvider.mutateAsync(data)
      }
      setIsCreateModalOpen(false)
      setEditingProvider(null)
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  const handleExport = () => {
    setIsExporting(true)
    try {
      const data = providers.map((provider) => ({
        Name: provider.name,
        Type: provider.type,
        Email: provider.contact_email || '',
        Phone: provider.contact_phone || '',
        Location: provider.location || '',
        Status: provider.status,
        Rating: provider.rating || '',
        Verified: provider.is_verified ? 'Yes' : 'No',
        Available: provider.is_available ? 'Yes' : 'No',
        'Created Date': formatDateForExport(provider.created_at),
      }))
      exportToCSV(data, `service-providers-${new Date().toISOString().split('T')[0]}.csv`)
      toast.success('Providers exported successfully')
    } catch (error) {
      toast.error('Failed to export providers')
    } finally {
      setIsExporting(false)
    }
  }

  const getConfirmMessage = () => {
    if (!confirmAction) return ''

    if (confirmAction.type === 'delete') {
      return `Are you sure you want to delete "${confirmAction.provider.name}"? This action cannot be undone.`
    } else if (confirmAction.type === 'verify') {
      return `Are you sure you want to verify "${confirmAction.provider.name}" as a qualified service provider?`
    }
    return ''
  }

  const getConfirmTitle = () => {
    if (!confirmAction) return ''

    if (confirmAction.type === 'delete') return 'Delete Provider'
    if (confirmAction.type === 'verify') return 'Verify Provider'
    return ''
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Filters */}
        <ServiceProvidersFilters
          filters={filters}
          onFiltersChange={updateParams}
          onExport={handleExport}
          isExporting={isExporting}
          onCreate={handleCreate}
        />

        {/* Providers Table */}
        <ServiceProvidersTable
          providers={providers}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onVerify={handleVerify}
        />
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <ServiceProviderFormModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setEditingProvider(null)
          }}
          onSubmit={handleSubmit}
          initialData={
            editingProvider && providerDetail
              ? {
                  name: providerDetail.name,
                  type: providerDetail.type,
                  contact_email: providerDetail.contact_email || undefined,
                  contact_phone: providerDetail.contact_phone || undefined,
                  location: providerDetail.location || undefined,
                  qualifications: providerDetail.qualifications || undefined,
                  specializations: providerDetail.specializations || undefined,
                  availability: providerDetail.availability || undefined,
                  rating: providerDetail.rating || undefined,
                  is_verified: providerDetail.is_verified,
                  status: providerDetail.status,
                  metadata: providerDetail.metadata || undefined,
                }
              : undefined
          }
          loading={createProvider.isPending || updateProvider.isPending}
          title={editingProvider ? 'Edit Service Provider' : 'Create New Service Provider'}
        />
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title={getConfirmTitle()}
          message={getConfirmMessage()}
          confirmText={confirmAction.type === 'delete' ? 'Delete' : 'Verify'}
          cancelText="Cancel"
          variant={confirmAction.type === 'delete' ? 'danger' : 'success'}
          isLoading={deleteProvider.isPending || verifyProvider.isPending}
        />
      )}
    </AppLayout>
  )
}
