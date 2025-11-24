/**
 * Clients Filters Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle client filtering and search
 * - Open/Closed: Extensible with additional filters
 */

import { useState } from 'react'
import { Search, X, Filter, Plus } from 'lucide-react'
import { BaseStatus, type ClientSearchParams } from '@/api/clients'
import { useIndustries } from '@/hooks/useClients'
import { cn } from '@/lib/utils'

interface ClientsFiltersProps {
  filters: ClientSearchParams
  onFiltersChange: (filters: ClientSearchParams) => void
  onCreate?: () => void
}

export function ClientsFilters({ filters, onFiltersChange, onCreate }: ClientsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: industriesData, isLoading: industriesLoading } = useIndustries()
  // Ensure industries is always an array
  const industries = Array.isArray(industriesData) ? industriesData : []

  const updateFilter = (key: keyof ClientSearchParams, value: string | boolean | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.name || filters.email || ''}
            onChange={(e) => {
              const value = e.target.value
              // Search both name and email
              if (value.includes('@')) {
                updateFilter('email', value)
                updateFilter('name', undefined)
              } else {
                updateFilter('name', value)
                updateFilter('email', undefined)
              }
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            isOpen || hasActiveFilters
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/30 rounded text-xs">
              {Object.keys(filters).length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value as BaseStatus | undefined)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            >
              <option value="">All Statuses</option>
              {Object.values(BaseStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Industry</label>
            <select
              value={filters.industry_id || ''}
              onChange={(e) => updateFilter('industry_id', e.target.value || undefined)}
              disabled={industriesLoading}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 disabled:opacity-50"
            >
              <option value="">All Industries</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Verification</label>
            <select
              value={
                filters.is_verified === undefined
                  ? ''
                  : filters.is_verified
                    ? 'verified'
                    : 'unverified'
              }
              onChange={(e) => {
                const value = e.target.value
                updateFilter(
                  'is_verified',
                  value === '' ? undefined : value === 'verified'
                )
              }}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            >
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

