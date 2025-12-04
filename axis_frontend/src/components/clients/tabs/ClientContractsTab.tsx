/**
 * Client Contracts Tab
 *
 * Lists all contracts for this client
 */

import { type ClientDetail } from '@/api/clients'
import { Briefcase, Calendar, DollarSign } from 'lucide-react'
import { SummaryStats } from '@/components/ui'

interface ClientContractsTabProps {
  client: ClientDetail
}

export function ClientContractsTab({ client }: ClientContractsTabProps) {
  // Placeholder for contracts data - will be fetched from API
  const contracts = []

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats */}
      <SummaryStats
        variant="cards"
        columns={3}
        stats={[
          { label: 'Active Contracts', value: client.active_contracts_count || 0, icon: Briefcase, iconColor: 'text-cream-400', color: 'text-white' },
          { label: 'Total Value', value: '—', icon: DollarSign, iconColor: 'text-cream-400', color: 'text-white' },
          { label: 'Expiring Soon', value: '—', icon: Calendar, iconColor: 'text-cream-400', color: 'text-white' },
        ]}
      />

      {/* Contracts List */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Contracts</h3>
          <button className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors">
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
