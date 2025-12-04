/**
 * Service Providers Page
 *
 * Displays and manages service providers for EAP services.
 */

import { useState } from 'react'
import { ResourcePageLayout } from '@/components/layouts/ResourcePageLayout'
import { useModal } from '@/hooks/useModal'
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

export function ServiceProvidersPage() {
  const { params: urlParams, updateParams } = useURLSearchParams<ProviderSearchParams>()

  // Modal management
  const formModal = useModal<ServiceProviderList>()
  const verifyModal = useModal<ServiceProviderList>()
  const deleteModal = useModal<ServiceProviderList>()
  const [isExporting, setIsExporting] = useState(false)

  // Initialize filters from URL params
  const filters = urlParams
  const hasFilters = Object.keys(filters).length > 0
  const providersQuery = useSearchProviders(filters)
  const allProvidersQuery = useProviders()
  const { data: providers = [], isLoading } = hasFilters ? providersQuery : allProvidersQuery

  const createProvider = useCreateProvider()
  const updateProvider = useUpdateProvider()
  const deleteProviderMutation = useDeleteProvider()
  const verifyProviderMutation = useVerifyProvider()
  const { data: providerDetail } = useProvider(formModal.data?.id || '')

  const handleCreate = () => {
    formModal.open()
  }

  const handleEdit = (provider: ServiceProviderList) => {
    formModal.open(provider)
  }

  const handleDelete = (provider: ServiceProviderList) => {
    deleteModal.open(provider)
  }

  const handleVerify = (provider: ServiceProviderList) => {
    verifyModal.open(provider)
  }

  const confirmDelete = async () => {
    if (!deleteModal.data) return
    await deleteProviderMutation.mutateAsync(deleteModal.data.id)
    deleteModal.close()
  }

  const confirmVerify = async () => {
    if (!verifyModal.data) return
    await verifyProviderMutation.mutateAsync(verifyModal.data.id)
    verifyModal.close()
  }

  const handleSubmit = async (data: ServiceProviderFormData) => {
    try {
      if (formModal.data) {
        await updateProvider.mutateAsync({ id: formModal.data.id, data })
      } else {
        await createProvider.mutateAsync(data)
      }
      formModal.close()
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  const handleExport = () => {
    setIsExporting(true)
    try {
      const data = providers.map((provider) => ({
        name: provider.name,
        type: provider.type,
        email: provider.contact_email || '',
        phone: provider.contact_phone || '',
        location: provider.location || '',
        status: provider.status,
        rating: provider.rating || '',
        verified: provider.is_verified ? 'Yes' : 'No',
        available: provider.is_available ? 'Yes' : 'No',
        created_date: formatDateForExport(provider.created_at),
      }))

      const columns = [
        { key: 'name' as const, label: 'Name' },
        { key: 'type' as const, label: 'Type' },
        { key: 'email' as const, label: 'Email' },
        { key: 'phone' as const, label: 'Phone' },
        { key: 'location' as const, label: 'Location' },
        { key: 'status' as const, label: 'Status' },
        { key: 'rating' as const, label: 'Rating' },
        { key: 'verified' as const, label: 'Verified' },
        { key: 'available' as const, label: 'Available' },
        { key: 'created_date' as const, label: 'Created Date' },
      ]

      exportToCSV(data, columns, `service-providers-${new Date().toISOString().split('T')[0]}.csv`)
      toast.success('Providers exported successfully')
    } catch (error) {
      toast.error('Failed to export providers')
    } finally {
      setIsExporting(false)
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcut(
    { key: 'n', metaKey: true },
    () => formModal.open(),
    { enabled: !formModal.isOpen }
  )
  useKeyboardShortcut(
    { key: 'e', metaKey: true },
    handleExport,
    { enabled: !isExporting && providers.length > 0 }
  )
  useKeyboardShortcut(
    { key: 'Escape' },
    () => formModal.close(),
    { enabled: formModal.isOpen }
  )

  return (
    <ResourcePageLayout
      title="Service Providers"
      subtitle="Manage EAP service providers"
      filters={
        <ServiceProvidersFilters
          filters={filters}
          onFiltersChange={updateParams}
          onExport={handleExport}
          isExporting={isExporting}
          onCreate={handleCreate}
        />
      }
      modals={
        <>
          {/* Create/Edit Modal */}
          <ServiceProviderFormModal
            {...formModal.props}
            onSubmit={handleSubmit}
            initialData={
              formModal.data && providerDetail
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
            title={formModal.data ? 'Edit Service Provider' : 'Create New Service Provider'}
          />

          {/* Verify Confirm Dialog */}
          <ConfirmDialog
            {...verifyModal.props}
            onConfirm={confirmVerify}
            title="Verify Provider"
            message={verifyModal.data ? `Are you sure you want to verify "${verifyModal.data.name}" as a qualified service provider?` : ''}
            confirmText="Verify"
            cancelText="Cancel"
            variant="success"
            isLoading={verifyProviderMutation.isPending}
          />

          {/* Delete Confirm Dialog */}
          <ConfirmDialog
            {...deleteModal.props}
            onConfirm={confirmDelete}
            title="Delete Provider"
            message={deleteModal.data ? `Are you sure you want to delete "${deleteModal.data.name}"? This action cannot be undone.` : ''}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={deleteProviderMutation.isPending}
          />
        </>
      }
    >
      <ServiceProvidersTable
        providers={providers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onVerify={handleVerify}
      />
    </ResourcePageLayout>
  )
}
