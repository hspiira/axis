/**
 * Clients Page
 *
 * Displays and manages client organizations.
 */

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ResourcePageLayout } from '@/components/layouts/ResourcePageLayout'
import { useURLSearchParams } from '@/hooks/useURLSearchParams'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useModal } from '@/hooks/useModal'
import { ClientsTable } from '@/components/clients/ClientsTable'
import { ClientsFilters } from '@/components/clients/ClientsFilters'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BulkActionsToolbar } from '@/components/clients/BulkActionsToolbar'
import {
  useClients,
  useSearchClients,
  useDeleteClient,
  useActivateClient,
  useDeactivateClient,
  useArchiveClient,
  useVerifyClient,
  useCreateClient,
  useUpdateClient,
  useClient,
} from '@/hooks/useClients'
import type { ClientList, ClientSearchParams, ClientFormData } from '@/api/clients'
import { toast } from '@/lib/toast'
import { activateClient, deactivateClient, archiveClient, deleteClient } from '@/api/clients'
import { exportToCSV, formatDateForExport } from '@/utils/export'

export function ClientsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { params: urlParams, updateParams } = useURLSearchParams<ClientSearchParams>()

  // Modal management
  const formModal = useModal<ClientList>()
  const deactivateModal = useModal<ClientList>()
  const archiveModal = useModal<ClientList>()
  const deleteModal = useModal<ClientList>()
  const bulkActivateModal = useModal<string[]>()
  const bulkDeactivateModal = useModal<string[]>()
  const bulkArchiveModal = useModal<string[]>()
  const bulkDeleteModal = useModal<string[]>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Initialize filters from URL params
  const filters = useMemo(() => urlParams, [urlParams])

  // Use search if filters are active, otherwise use regular list
  const hasFilters = Object.keys(filters).length > 0
  const clientsQuery = useSearchClients(filters)
  const allClientsQuery = useClients()
  const { data: clients = [], isLoading } = hasFilters ? clientsQuery : allClientsQuery

  const deleteClientMutation = useDeleteClient()
  const activateClientMutation = useActivateClient()
  const deactivateClientMutation = useDeactivateClient()
  const archiveClientMutation = useArchiveClient()
  const verifyClient = useVerifyClient()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()

  const handleView = (client: ClientList) => {
    // Navigate to dedicated client detail page
    navigate(`/clients/${client.id}`)
  }

  const handleEdit = (client: ClientList) => {
    formModal.open(client)
  }

  // Fetch full client data when editing
  const { data: clientDetail } = useClient(formModal.data?.id || '')

  const handleActivate = async (client: ClientList) => {
    try {
      await activateClientMutation.mutateAsync(client.id)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDeactivate = (client: ClientList) => {
    deactivateModal.open(client)
  }

  const handleArchive = (client: ClientList) => {
    archiveModal.open(client)
  }

  const handleVerify = async (client: ClientList) => {
    try {
      await verifyClient.mutateAsync({ id: client.id })
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = (client: ClientList) => {
    deleteModal.open(client)
  }

  const confirmDeactivate = async () => {
    if (!deactivateModal.data) return
    await deactivateClientMutation.mutateAsync({ id: deactivateModal.data.id })
    deactivateModal.close()
  }

  const confirmArchive = async (inputValue?: string) => {
    if (!archiveModal.data || !inputValue?.trim()) return
    await archiveClientMutation.mutateAsync({ id: archiveModal.data.id, reason: inputValue })
    archiveModal.close()
  }

  const confirmDelete = async () => {
    if (!deleteModal.data) return
    await deleteClientMutation.mutateAsync(deleteModal.data.id)
    deleteModal.close()
  }

  const confirmBulkActivate = async () => {
    if (!bulkActivateModal.data) return

    setIsProcessingBulk(true)
    const clientIds = bulkActivateModal.data
    let successful = 0
    let failed = 0

    for (const clientId of clientIds) {
      try {
        await activateClient(clientId)
        successful++
      } catch (error) {
        failed++
      }
    }

    queryClient.invalidateQueries({ queryKey: ['clients'] })

    if (failed === 0) {
      toast.success(`Successfully activated ${successful} client${successful > 1 ? 's' : ''}`)
    } else if (successful === 0) {
      toast.error(`Failed to activate ${failed} client${failed > 1 ? 's' : ''}`)
    } else {
      toast.warning(`Activated ${successful} client${successful > 1 ? 's' : ''}, ${failed} failed`)
    }

    setIsProcessingBulk(false)
    setSelectedIds(new Set())
    bulkActivateModal.close()
  }

  const confirmBulkDeactivate = async () => {
    if (!bulkDeactivateModal.data) return

    setIsProcessingBulk(true)
    const clientIds = bulkDeactivateModal.data
    let successful = 0
    let failed = 0

    for (const clientId of clientIds) {
      try {
        await deactivateClient(clientId)
        successful++
      } catch (error) {
        failed++
      }
    }

    queryClient.invalidateQueries({ queryKey: ['clients'] })

    if (failed === 0) {
      toast.success(`Successfully deactivated ${successful} client${successful > 1 ? 's' : ''}`)
    } else if (successful === 0) {
      toast.error(`Failed to deactivate ${failed} client${failed > 1 ? 's' : ''}`)
    } else {
      toast.warning(`Deactivated ${successful} client${successful > 1 ? 's' : ''}, ${failed} failed`)
    }

    setIsProcessingBulk(false)
    setSelectedIds(new Set())
    bulkDeactivateModal.close()
  }

  const confirmBulkArchive = async (inputValue?: string) => {
    if (!bulkArchiveModal.data || !inputValue?.trim()) return

    setIsProcessingBulk(true)
    const clientIds = bulkArchiveModal.data
    let successful = 0
    let failed = 0

    for (const clientId of clientIds) {
      try {
        await archiveClient(clientId, inputValue)
        successful++
      } catch (error) {
        failed++
      }
    }

    queryClient.invalidateQueries({ queryKey: ['clients'] })

    if (failed === 0) {
      toast.success(`Successfully archived ${successful} client${successful > 1 ? 's' : ''}`)
    } else if (successful === 0) {
      toast.error(`Failed to archive ${failed} client${failed > 1 ? 's' : ''}`)
    } else {
      toast.warning(`Archived ${successful} client${successful > 1 ? 's' : ''}, ${failed} failed`)
    }

    setIsProcessingBulk(false)
    setSelectedIds(new Set())
    bulkArchiveModal.close()
  }

  const confirmBulkDelete = async () => {
    if (!bulkDeleteModal.data) return

    setIsProcessingBulk(true)
    const clientIds = bulkDeleteModal.data
    let successful = 0
    let failed = 0

    for (const clientId of clientIds) {
      try {
        await deleteClient(clientId)
        successful++
      } catch (error) {
        failed++
      }
    }

    queryClient.invalidateQueries({ queryKey: ['clients'] })

    if (failed === 0) {
      toast.success(`Successfully deleted ${successful} client${successful > 1 ? 's' : ''}`)
    } else if (successful === 0) {
      toast.error(`Failed to delete ${failed} client${failed > 1 ? 's' : ''}`)
    } else {
      toast.warning(`Deleted ${successful} client${successful > 1 ? 's' : ''}, ${failed} failed`)
    }

    setIsProcessingBulk(false)
    setSelectedIds(new Set())
    bulkDeleteModal.close()
  }

  const handleCreate = () => {
    formModal.open()
  }

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      if (formModal.data) {
        await updateClient.mutateAsync({ id: formModal.data.id, data })
      } else {
        await createClient.mutateAsync(data)
      }
      formModal.close()
    } catch (error) {
      // Error handled by hook
    }
  }

  // Bulk action handlers
  const handleBulkActivate = () => {
    const clientIds = Array.from(selectedIds)
    bulkActivateModal.open(clientIds)
  }

  const handleBulkDeactivate = () => {
    const clientIds = Array.from(selectedIds)
    bulkDeactivateModal.open(clientIds)
  }

  const handleBulkArchive = () => {
    const clientIds = Array.from(selectedIds)
    bulkArchiveModal.open(clientIds)
  }

  const handleBulkDelete = () => {
    const clientIds = Array.from(selectedIds)
    bulkDeleteModal.open(clientIds)
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleExport = () => {
    try {
      setIsExporting(true)

      // Define columns to export
      const columns = [
        { key: 'name' as keyof ClientList, label: 'Client Name' },
        { key: 'email' as keyof ClientList, label: 'Email' },
        { key: 'phone' as keyof ClientList, label: 'Phone' },
        { key: 'industry_name' as keyof ClientList, label: 'Industry' },
        { key: 'status' as keyof ClientList, label: 'Status' },
        { key: 'is_verified' as keyof ClientList, label: 'Verified' },
        { key: 'created_at' as keyof ClientList, label: 'Created Date' },
      ]

      // Format data for export
      const exportData = clients.map((client) => ({
        ...client,
        is_verified: client.is_verified ? 'Yes' : 'No',
        created_at: formatDateForExport(client.created_at),
      }))

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `clients-export-${timestamp}.csv`

      // Export to CSV
      exportToCSV(exportData, columns, filename)

      toast.success(`Exported ${clients.length} client${clients.length > 1 ? 's' : ''} to CSV`)
    } catch (error) {
      toast.error('Failed to export clients')
    } finally {
      setIsExporting(false)
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcut(
    { key: 'n', metaKey: true }, // Cmd+N or Ctrl+N
    handleCreate,
    { enabled: !formModal.isOpen }
  )

  useKeyboardShortcut(
    { key: 'e', metaKey: true }, // Cmd+E or Ctrl+E
    handleExport,
    { enabled: !isExporting && clients.length > 0 }
  )

  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      if (formModal.isOpen) {
        formModal.close()
      } else if (selectedIds.size > 0) {
        handleClearSelection()
      }
    },
    { enabled: true }
  )

  return (
    <ResourcePageLayout
      title="Client Management"
      subtitle="Manage client organizations and their contracts"
      filters={
        <ClientsFilters
          filters={filters}
          onFiltersChange={updateParams}
          onCreate={handleCreate}
          onExport={handleExport}
          isExporting={isExporting}
        />
      }
      modals={
        <>
          {/* Form Modal */}
          <ClientFormModal
            {...formModal.props}
            onSubmit={handleFormSubmit}
            initialData={
              formModal.data && clientDetail
                ? {
                    name: clientDetail.name,
                    email: clientDetail.email || undefined,
                    phone: clientDetail.phone || undefined,
                    website: clientDetail.website || undefined,
                    address: clientDetail.address || undefined,
                    billing_address: clientDetail.billing_address || undefined,
                    timezone: clientDetail.timezone || undefined,
                    tax_id: clientDetail.tax_id || undefined,
                    contact_person: clientDetail.contact_person || undefined,
                    contact_email: clientDetail.contact_email || undefined,
                    contact_phone: clientDetail.contact_phone || undefined,
                    industry_id: clientDetail.industry?.id || undefined,
                    status: clientDetail.status,
                    preferred_contact_method: clientDetail.preferred_contact_method || undefined,
                    is_verified: clientDetail.is_verified,
                    tag_ids: clientDetail.tags?.map(tag => tag.id) || undefined,
                    parent_client: clientDetail.parent_client || undefined,
                    last_contact_date: clientDetail.last_contact_date || undefined,
                    notes: clientDetail.notes || undefined,
                    metadata: clientDetail.metadata || undefined,
                  }
                : undefined
            }
            isLoading={createClient.isPending || updateClient.isPending}
            title={formModal.data ? 'Edit Client' : 'Add New Client'}
          />

          {/* Deactivate Modal */}
          <ConfirmDialog
            {...deactivateModal.props}
            onConfirm={confirmDeactivate}
            title="Deactivate Client"
            message={deactivateModal.data ? `Are you sure you want to deactivate ${deactivateModal.data.name}? They will no longer be able to access services.` : ''}
            confirmText="Deactivate"
            cancelText="Cancel"
            variant="warning"
            isLoading={deactivateClientMutation.isPending}
          />

          {/* Archive Modal */}
          <ConfirmDialog
            {...archiveModal.props}
            onConfirm={confirmArchive}
            title="Archive Client"
            message={archiveModal.data ? `Are you sure you want to archive ${archiveModal.data.name}?` : ''}
            confirmText="Archive"
            cancelText="Cancel"
            variant="warning"
            requireInput
            inputPlaceholder="Enter reason for archiving..."
            inputLabel="Reason (required)"
            isLoading={archiveClientMutation.isPending}
          />

          {/* Delete Modal */}
          <ConfirmDialog
            {...deleteModal.props}
            onConfirm={confirmDelete}
            title="Delete Client"
            message={deleteModal.data ? `Are you sure you want to delete ${deleteModal.data.name}? This action cannot be undone.` : ''}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={deleteClientMutation.isPending}
          />

          {/* Bulk Activate Modal */}
          <ConfirmDialog
            {...bulkActivateModal.props}
            onConfirm={confirmBulkActivate}
            title="Activate Clients"
            message={`Are you sure you want to activate ${bulkActivateModal.data?.length || 0} client(s)?`}
            confirmText="Activate"
            cancelText="Cancel"
            variant="success"
            isLoading={isProcessingBulk}
          />

          {/* Bulk Deactivate Modal */}
          <ConfirmDialog
            {...bulkDeactivateModal.props}
            onConfirm={confirmBulkDeactivate}
            title="Deactivate Clients"
            message={`Are you sure you want to deactivate ${bulkDeactivateModal.data?.length || 0} client(s)?`}
            confirmText="Deactivate"
            cancelText="Cancel"
            variant="warning"
            isLoading={isProcessingBulk}
          />

          {/* Bulk Archive Modal */}
          <ConfirmDialog
            {...bulkArchiveModal.props}
            onConfirm={confirmBulkArchive}
            title="Archive Clients"
            message={`Are you sure you want to archive ${bulkArchiveModal.data?.length || 0} client(s)?`}
            confirmText="Archive"
            cancelText="Cancel"
            variant="warning"
            requireInput
            inputPlaceholder="Enter reason for archiving..."
            inputLabel="Reason (required)"
            isLoading={isProcessingBulk}
          />

          {/* Bulk Delete Modal */}
          <ConfirmDialog
            {...bulkDeleteModal.props}
            onConfirm={confirmBulkDelete}
            title="Delete Clients"
            message={`Are you sure you want to delete ${bulkDeleteModal.data?.length || 0} client(s)? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={isProcessingBulk}
          />

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedIds.size}
              onClearSelection={handleClearSelection}
              onBulkActivate={handleBulkActivate}
              onBulkDeactivate={handleBulkDeactivate}
              onBulkArchive={handleBulkArchive}
              onBulkDelete={handleBulkDelete}
              isProcessing={isProcessingBulk}
            />
          )}
        </>
      }
    >
      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onArchive={handleArchive}
        onVerify={handleVerify}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </ResourcePageLayout>
  )
}
