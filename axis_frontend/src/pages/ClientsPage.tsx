/**
 * Clients Page
 *
 * Displays and manages client organizations.
 */

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ClientsTable } from '@/components/clients/ClientsTable'
import { ClientsFilters } from '@/components/clients/ClientsFilters'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { ClientDetailModal } from '@/components/clients/ClientDetailModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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

type ConfirmAction =
  | { type: 'deactivate'; client: ClientList }
  | { type: 'archive'; client: ClientList }
  | { type: 'delete'; client: ClientList }
  | null

export function ClientsPage() {
  const { setPageTitle } = usePageTitle()
  const [filters, setFilters] = useState<ClientSearchParams>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientList | null>(null)
  const [viewingClient, setViewingClient] = useState<ClientList | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  // Use search if filters are active, otherwise use regular list
  const hasFilters = Object.keys(filters).length > 0
  const clientsQuery = useSearchClients(filters)
  const allClientsQuery = useClients()
  const { data: clients = [], isLoading } = hasFilters ? clientsQuery : allClientsQuery

  const deleteClient = useDeleteClient()
  const activateClient = useActivateClient()
  const deactivateClient = useDeactivateClient()
  const archiveClient = useArchiveClient()
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
      await activateClient.mutateAsync(client.id)
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
          await deactivateClient.mutateAsync({ id: confirmAction.client.id })
          break
        case 'archive':
          if (!inputValue?.trim()) return
          await archiveClient.mutateAsync({ id: confirmAction.client.id, reason: inputValue })
          break
        case 'delete':
          await deleteClient.mutateAsync(confirmAction.client.id)
          break
      }
      setConfirmAction(null)
    } catch (error) {
      // Error handled by hook
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Filters */}
        <div className="mb-6">
          <ClientsFilters
            filters={filters}
            onFiltersChange={setFilters}
            onCreate={handleCreate}
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
        />
      </div>

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
          isLoading={deactivateClient.isPending}
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
          isLoading={archiveClient.isPending}
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
          isLoading={deleteClient.isPending}
        />
      )}
    </AppLayout>
  )
}
