/**
 * Client Contracts Tab
 *
 * Lists all contracts for this client
 */

import { type ClientDetail } from '@/api/clients'
import { Briefcase, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

interface ClientContractsTabProps {
  client: ClientDetail
}

export function ClientContractsTab({ client }: ClientContractsTabProps) {
  // Placeholder for contracts data - will be fetched from API
  const contracts = []

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-gray-400">Active Contracts</span>
          </div>
          <p className="text-2xl font-bold text-white">{client.active_contracts_count || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-gray-400">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-gray-400">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Contracts</h3>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Add Contract
          </button>
        </div>

        {contracts.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No contracts found for this client</p>
            <p className="text-sm text-gray-500 mt-1">
              Contracts will appear here once they are created
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract: any) => (
              <div
                key={contract.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
              >
                {/* Contract item */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
