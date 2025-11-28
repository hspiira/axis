/**
 * Contracts Page
 *
 * Standalone page for managing contracts across all clients
 */

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Briefcase, Search, Filter, Download, Calendar, DollarSign, Plus } from 'lucide-react'

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-gray-400">Total Contracts</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-white">$0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Expiring Soon</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts by title, client, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Contracts Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg">
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No contracts found</h3>
            <p className="text-gray-400 mb-6">Get started by creating your first contract</p>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Contract
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
