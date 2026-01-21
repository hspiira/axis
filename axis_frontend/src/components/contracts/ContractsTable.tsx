/**
 * Contracts Table
 *
 * Reusable table for displaying a list of contracts.
 */
import { type ContractList, ContractStatus } from '@/api/contracts'
import { MoreHorizontal, Eye, Edit, Trash2, Play, Pause, Archive, RefreshCw } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils'

interface ContractsTableProps {
  contracts: ContractList[]
  isLoading: boolean
  onView: (contract: ContractList) => void
  onEdit: (contract: ContractList) => void
  onDelete: (contract: ContractList) => void
  onActivate: (contract: ContractList) => void
  onTerminate: (contract: ContractList) => void
}

export function ContractsTable({
  contracts,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onTerminate,
}: ContractsTableProps) {
  if (isLoading) {
    return <div className="text-center py-16">Loading contracts...</div>
  }

  if (contracts.length === 0) {
    return <div className="text-center py-16">No contracts found.</div>
  }

  const getStatusVariant = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return 'success'
      case ContractStatus.EXPIRED:
      case ContractStatus.TERMINATED:
        return 'danger'
      case ContractStatus.RENEWED:
        return 'info'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/5">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Client</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Status</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Period</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Billing Rate</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {contracts.map((contract) => (
            <tr key={contract.id} className="hover:bg-white/5">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{contract.client_name}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <StatusBadge variant={getStatusVariant(contract.status)}>{contract.status}</StatusBadge>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{contract.start_date} to {contract.end_date}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{contract.billing_rate} {contract.currency}</td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                {/* Actions Dropdown Here */}
                <button onClick={() => onView(contract)} className="text-cream-400 hover:text-cream-300 mr-2"><Eye size={16} /></button>
                <button onClick={() => onEdit(contract)} className="text-cream-400 hover:text-cream-300 mr-2"><Edit size={16} /></button>
                <button onClick={() => onDelete(contract)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
