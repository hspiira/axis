/**
 * Clients Page
 *
 * Displays and manages client organizations.
 */

import { useEffect, useState, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useURLSearchParams } from '@/hooks/useURLSearchParams'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { ClientsTable } from '@/components/clients/ClientsTable'
import { ClientsFilters } from '@/components/clients/ClientsFilters'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { ClientDetailModal } from '@/components/clients/ClientDetailModal'
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

type ConfirmAction =
  | { type: 'deactivate'; client: ClientList }
  | { type: 'archive'; client: ClientList }
  | { type: 'delete'; client: ClientList }
  | { type: 'bulkActivate'; clientIds: string[] }
  | { type: 'bulkDeactivate'; clientIds: string[] }
  | { type: 'bulkArchive'; clientIds: string[] }
  | { type: 'bulkDelete'; clientIds: string[] }
  | null

export function ClientsPage() {
  const { setPageTitle } = usePageTitle()
  const queryClient = useQueryClient()
  const { params: urlParams, updateParams } = useURLSearchParams<ClientSearchParams>()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientList | null>(null)
  const [viewingClient, setViewingClient] = useState<ClientList | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
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

  useEffect(() => {
    setPageTitle('Client Management', 'Manage client organizations and their contracts')
    return () => setPageTitle(null)
  }, [setPageTitle])

  const handleView = (client: ClientList) => {
    setViewingClient(client)
  }

  const handleEdit = (client: ClientList) => {
    setEditingClient(client)
    setViewingClient(null)
    setIsCreateModalOpen(true)
  }

  // Fetch full client data when viewing or editing
  const { data: clientDetail } = useClient(editingClient?.id || viewingClient?.id || '')
  const { data: viewClientDetail } = useClient(viewingClient?.id || '')

  const handleActivate = async (client: ClientList) => {
    try {
      await activateClientMutation.mutateAsync(client.id)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDeactivate = (client: ClientList) => {
    setConfirmAction({ type: 'deactivate', client })
  }

  const handleArchive = (client: ClientList) => {
    setConfirmAction({ type: 'archive', client })
  }

  const handleVerify = async (client: ClientList) => {
    try {
      await verifyClient.mutateAsync({ id: client.id })
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = (client: ClientList) => {
    setConfirmAction({ type: 'delete', client })
  }

  const handleConfirmAction = async (inputValue?: string) => {
    if (!confirmAction) return

    try {
      switch (confirmAction.type) {
        case 'deactivate':
          await deactivateClientMutation.mutateAsync({ id: confirmAction.client.id })
          break
        case 'archive':
          if (!inputValue?.trim()) return
          await archiveClientMutation.mutateAsync({ id: confirmAction.client.id, reason: inputValue })
          break
        case 'delete':
          await deleteClientMutation.mutateAsync(confirmAction.client.id)
          break
        case 'bulkActivate': {
          setIsProcessingBulk(true)
          const total = confirmAction.clientIds.length
          let successful = 0
          let failed = 0

          for (const clientId of confirmAction.clientIds) {
            try {
              await activateClient(clientId)
              successful++
            } catch (error) {
              failed++
            }
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['clients'] })

          // Show single summary toast
          if (failed === 0) {
            toast.success(`Successfully activated ${successful} client${successful > 1 ? 's' : ''}`)
          } else if (successful === 0) {
            toast.error(`Failed to activate ${failed} client${failed > 1 ? 's' : ''}`)
          } else {
            toast.warning(`Activated ${successful} client${successful > 1 ? 's' : ''}, ${failed} failed`)
          }

          setIsProcessingBulk(false)
          setSelectedIds(new Set())
          break
        }
        case 'bulkDeactivate': {
          setIsProcessingBulk(true)
          const total = confirmAction.clientIds.length
          let successful = 0
          let failed = 0

          for (const clientId of confirmAction.clientIds) {
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
          break
        }
        case 'bulkArchive': {
          if (!inputValue?.trim()) return
          setIsProcessingBulk(true)
          const total = confirmAction.clientIds.length
          let successful = 0
          let failed = 0

          for (const clientId of confirmAction.clientIds) {
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
          break
        }
        case 'bulkDelete': {
          setIsProcessingBulk(true)
          const total = confirmAction.clientIds.length
          let successful = 0
          let failed = 0

          for (const clientId of confirmAction.clientIds) {
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
          break
        }
      }
      setConfirmAction(null)
    } catch (error) {
      // Error handled by hook
      setIsProcessingBulk(false)
    }
  }

  const handleCreate = () => {
    setEditingClient(null)
    setIsCreateModalOpen(true)
  }

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, data })
      } else {
        await createClient.mutateAsync(data)
      }
      setIsCreateModalOpen(false)
      setEditingClient(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  // Bulk action handlers
  const handleBulkActivate = () => {
    const clientIds = Array.from(selectedIds)
    setConfirmAction({ type: 'bulkActivate', clientIds })
  }

  const handleBulkDeactivate = () => {
    const clientIds = Array.from(selectedIds)
    setConfirmAction({ type: 'bulkDeactivate', clientIds })
  }

  const handleBulkArchive = () => {
    const clientIds = Array.from(selectedIds)
    setConfirmAction({ type: 'bulkArchive', clientIds })
  }

  const handleBulkDelete = () => {
    const clientIds = Array.from(selectedIds)
    setConfirmAction({ type: 'bulkDelete', clientIds })
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
    { enabled: !isCreateModalOpen }
  )

  useKeyboardShortcut(
    { key: 'e', metaKey: true }, // Cmd+E or Ctrl+E
    handleExport,
    { enabled: !isExporting && clients.length > 0 }
  )

  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
        setEditingClient(null)
      } else if (viewingClient) {
        setViewingClient(null)
      } else if (confirmAction) {
        setConfirmAction(null)
      } else if (selectedIds.size > 0) {
        handleClearSelection()
      }
    },
    { enabled: true }
  )

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Filters */}
        <div className="mb-6">
          <ClientsFilters
            filters={filters}
            onFiltersChange={updateParams}
            onCreate={handleCreate}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </div>

        {/* Clients Table */}
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
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkArchive={handleBulkArchive}
        onBulkDelete={handleBulkDelete}
        isProcessing={isProcessingBulk}
      />

      {/* Create/Edit Modal */}
      <ClientFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingClient(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={
          editingClient && clientDetail
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
                notes: clientDetail.notes || undefined,
              }
            : undefined
        }
        isLoading={createClient.isPending || updateClient.isPending}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
      />

      {/* Detail Modal */}
      {viewClientDetail && (
        <ClientDetailModal
          client={viewClientDetail}
          isOpen={!!viewingClient}
          onClose={() => setViewingClient(null)}
          onEdit={handleEdit}
        />
      )}

      {/* Confirm Dialogs */}
      {confirmAction?.type === 'deactivate' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Deactivate Client"
          message={`Are you sure you want to deactivate ${confirmAction.client.name}? This will prevent the client from being used in new contracts or cases.`}
          confirmText="Deactivate"
          cancelText="Cancel"
          variant="warning"
          isLoading={deactivateClientMutation.isPending}
        />
      )}

      {confirmAction?.type === 'archive' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Archive Client"
          message={`Please provide a reason for archiving ${confirmAction.client.name}. Archived clients can be restored later.`}
          confirmText="Archive"
          cancelText="Cancel"
          variant="warning"
          requireInput={true}
          inputLabel="Reason for archiving"
          inputPlaceholder="e.g., Client no longer active, Contract ended..."
          isLoading={archiveClientMutation.isPending}
        />
      )}

      {confirmAction?.type === 'delete' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Delete Client"
          message={`Are you sure you want to delete ${confirmAction.client.name}? This action cannot be undone and will permanently remove all client data.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteClientMutation.isPending}
        />
      )}

      {/* Bulk Confirm Dialogs */}
      {confirmAction?.type === 'bulkActivate' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Activate Clients"
          message={`Are you sure you want to activate ${confirmAction.clientIds.length} client${confirmAction.clientIds.length > 1 ? 's' : ''}? They will be available for new contracts and cases.`}
          confirmText="Activate"
          cancelText="Cancel"
          variant="success"
          isLoading={isProcessingBulk}
        />
      )}

      {confirmAction?.type === 'bulkDeactivate' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Deactivate Clients"
          message={`Are you sure you want to deactivate ${confirmAction.clientIds.length} client${confirmAction.clientIds.length > 1 ? 's' : ''}? They will not be available for new contracts or cases.`}
          confirmText="Deactivate"
          cancelText="Cancel"
          variant="warning"
          isLoading={isProcessingBulk}
        />
      )}

      {confirmAction?.type === 'bulkArchive' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Archive Clients"
          message={`Please provide a reason for archiving ${confirmAction.clientIds.length} client${confirmAction.clientIds.length > 1 ? 's' : ''}. Archived clients can be restored later.`}
          confirmText="Archive"
          cancelText="Cancel"
          variant="warning"
          requireInput={true}
          inputLabel="Reason for archiving"
          inputPlaceholder="e.g., Clients no longer active, Contracts ended..."
          isLoading={isProcessingBulk}
        />
      )}

      {confirmAction?.type === 'bulkDelete' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Delete Clients"
          message={`Are you sure you want to delete ${confirmAction.clientIds.length} client${confirmAction.clientIds.length > 1 ? 's' : ''}? This action cannot be undone and will permanently remove all client data.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={isProcessingBulk}
        />
      )}
    </AppLayout>
  )
}
