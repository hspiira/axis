/**
 * Contracts Page
 *
 * Standalone page for managing contracts across all clients
 */

import { useEffect, useState, useMemo } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Briefcase, Search, Filter, Download, Plus, Calendar, DollarSign } from 'lucide-react'
import { SummaryStats, ConfirmDialog } from '@/components/ui'
import {
  useContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
  useContractAction,
} from '@/hooks/useContracts'
import { contractsApi, type ContractList, type ContractFormData } from '@/api/contracts'
import { ContractsTable } from '@/components/contracts/ContractsTable'
import { ContractFormModal } from '@/components/contracts/ContractFormModal'
import { toast } from '@/lib/toast'

export function ContractsPage() {
  const { setPageTitle } = usePageTitle()
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<ContractList | null>(null)
  const [deletingContract, setDeletingContract] = useState<ContractList | null>(null)

  // Data fetching hooks
  const { data: contracts = [], isLoading } = useContracts()
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const deleteContract = useDeleteContract()
  const activateContract = useContractAction(contractsApi.activate, 'activated')
  const terminateContract = useContractAction(contractsApi.terminate, 'terminated')

  useEffect(() => {
    setPageTitle('Contracts', 'Manage contracts across all clients')
    return () => setPageTitle(null)
  }, [setPageTitle])
  
  // Filtering logic
  const filteredContracts = useMemo(() => {
    if (!searchQuery) return contracts
    return contracts.filter(c =>
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [contracts, searchQuery])

  // Stats calculation
  const stats = useMemo(() => {
    const total = contracts.length
    const active = contracts.filter(c => c.is_active).length
    const totalValue = contracts.reduce((sum, c) => sum + Number(c.billing_rate), 0)
    const expiringSoon = contracts.filter(c => c.days_remaining > 0 && c.days_remaining <= 30).length
    return {
      total,
      active,
      totalValue: totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), // Assuming USD for summary
      expiringSoon
    }
  }, [contracts])

  // Handlers
  const handleCreate = () => {
    setEditingContract(null)
    setIsFormModalOpen(true)
  }
  
  const handleEdit = (contract: ContractList) => {
    setEditingContract(contract)
    setIsFormModalOpen(true)
  }

  const handleDelete = (contract: ContractList) => {
    setDeletingContract(contract)
  }
  
  const confirmDelete = async () => {
    if (!deletingContract) return
    await deleteContract.mutateAsync(deletingContract.id)
    setDeletingContract(null)
  }

  const handleFormSubmit = async (data: ContractFormData) => {
    if (editingContract) {
      await updateContract.mutateAsync({ id: editingContract.id, data })
    } else {
      await createContract.mutateAsync(data)
    }
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <SummaryStats
          variant="cards"
          columns={4}
          stats={[
            { label: 'Total Contracts', value: stats.total, icon: Briefcase, iconColor: 'text-cream-400', color: 'text-white' },
            { label: 'Active', value: stats.active, icon: Calendar, iconColor: 'text-cream-400', color: 'text-white' },
            { label: 'Total Value', value: stats.totalValue, icon: DollarSign, iconColor: 'text-emerald-400', color: 'text-white' },
            { label: 'Expiring Soon', value: stats.expiringSoon, icon: Calendar, iconColor: 'text-cream-400', color: 'text-white' },
          ]}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 relative min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name..."
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
            />
          </div>
          <button disabled className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 flex items-center gap-1.5 text-xs cursor-not-allowed">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button onClick={handleCreate} className="px-2.5 py-1.5 bg-cream-500 text-gray-900 rounded-lg font-medium flex items-center gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Contract
          </button>
        </div>

        <ContractsTable
          contracts={filteredContracts}
          isLoading={isLoading}
          onView={(c) => toast.info(`Viewing details for ${c.client_name}`)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onActivate={(c) => activateContract.mutate({ id: c.id })}
          onTerminate={(c) => terminateContract.mutate({ id: c.id, params: 'Client request' })} // Example reason
        />
      </div>

      <ContractFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingContract ? {
            ...editingContract,
            client_id: contracts.find(c => c.id === editingContract.id)?.client_id || '' // This needs improvement
        } : undefined}
        isLoading={createContract.isPending || updateContract.isPending}
        title={editingContract ? 'Edit Contract' : 'Create New Contract'}
      />
      
      <ConfirmDialog
        isOpen={!!deletingContract}
        onClose={() => setDeletingContract(null)}
        onConfirm={confirmDelete}
        title="Delete Contract"
        message={`Are you sure you want to delete the contract for "${deletingContract?.client_name}"? This action is permanent.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteContract.isPending}
      />

    </AppLayout>
  )
}