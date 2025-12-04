/**
 * Contracts Page
 *
 * Standalone page for managing contracts across all clients
 */

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Briefcase, Search, Filter, Download, Plus, Calendar, DollarSign } from 'lucide-react'
import { SummaryStats } from '@/components/ui'

export function ContractsPage() {
  const { setPageTitle } = usePageTitle()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setPageTitle('Contracts', 'Manage contracts across all clients')
    return () => setPageTitle(null)
  }, [setPageTitle])

  const contracts = []

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Stats Grid */}
        <SummaryStats
          variant="cards"
          columns={4}
          stats={[
            { label: 'Total Contracts', value: 0, icon: Briefcase, iconColor: 'text-cream-400', color: 'text-white' },
            { label: 'Active', value: 0, icon: Calendar, iconColor: 'text-cream-400', color: 'text-white' },
            { label: 'Total Value', value: '$0', icon: DollarSign, iconColor: 'text-emerald-400', color: 'text-white' },
            { label: 'Expiring Soon', value: 0, icon: Calendar, iconColor: 'text-cream-400', color: 'text-white' },
          ]}
        />

        {/* Search and Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 relative min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts..."
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50"
            />
          </div>
          <button className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button className="px-2.5 py-1.5 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors flex items-center gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Contract
          </button>
        </div>

        {/* Contracts Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg">
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No contracts found</h3>
            <p className="text-gray-400 mb-6">Get started by creating your first contract</p>
            <button className="px-2.5 py-1.5 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors inline-flex items-center gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Create Contract
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
