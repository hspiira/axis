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

export function ClientsPage() {
  const { setPageTitle } = usePageTitle()
  const [filters, setFilters] = useState<ClientSearchParams>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientList | null>(null)

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
    // TODO: Open detail modal or navigate to detail page
    toast.info(`Viewing ${client.name}`)
  }

  const handleEdit = (client: ClientList) => {
    setEditingClient(client)
    setIsCreateModalOpen(true)
  }

  // Fetch full client data when editing
  const { data: clientDetail } = useClient(editingClient?.id || '')

  const handleActivate = async (client: ClientList) => {
    try {
      await activateClient.mutateAsync(client.id)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDeactivate = async (client: ClientList) => {
    if (window.confirm(`Are you sure you want to deactivate ${client.name}?`)) {
      try {
        await deactivateClient.mutateAsync({ id: client.id })
      } catch (error) {
        // Error handled by hook
      }
    }
  }

  const handleArchive = async (client: ClientList) => {
    const reason = window.prompt(`Enter reason for archiving ${client.name}:`)
    if (reason !== null) {
      try {
        await archiveClient.mutateAsync({ id: client.id, reason })
      } catch (error) {
        // Error handled by hook
      }
    }
  }

  const handleVerify = async (client: ClientList) => {
    try {
      await verifyClient.mutateAsync({ id: client.id })
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = async (client: ClientList) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${client.name}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteClient.mutateAsync(client.id)
      } catch (error) {
        // Error handled by hook
      }
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
    </AppLayout>
  )
}
