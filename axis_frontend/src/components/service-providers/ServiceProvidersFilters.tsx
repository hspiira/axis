/**
 * Service Providers Filters Component
 *
 * Provides filtering and search capabilities for service providers.
 */

import { useState, useEffect } from 'react'
import { Search, Plus, Download, X, Filter } from 'lucide-react'
import type { ProviderSearchParams, ProviderStatus, ServiceProviderType } from '@/api/services'
import { ProviderStatus as ProviderStatusEnum, ServiceProviderType as ProviderTypeEnum } from '@/api/services'
import { cn } from '@/lib/utils'
import { FilterToolbar } from '@/components/ui'

interface ServiceProvidersFiltersProps {
  filters: ProviderSearchParams
  onFiltersChange: (filters: ProviderSearchParams) => void
  onExport: () => void
  isExporting: boolean
  onCreate: () => void
}

export function ServiceProvidersFilters({
  filters,
  onFiltersChange,
  onExport,
  isExporting,
  onCreate,
}: ServiceProvidersFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProviderSearchParams>(filters)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleSearchChange = (search: string) => {
    const newFilters = { ...localFilters, search: search || undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const updateFilter = (key: keyof ProviderSearchParams, value: any) => {
    const newFilters = { ...localFilters, [key]: value || undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    setLocalFilters({})
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(localFilters).filter(k => k !== 'search').length > 0
  const searchValue = localFilters.search || ''

  return (
    <FilterToolbar
      variant="bordered"
      searchSlot={
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
          />
        </div>
      }
      filterSlot={
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg transition-all relative flex items-center gap-1.5 text-xs font-medium',
              isOpen || hasActiveFilters
                ? 'bg-cream-500/20 text-cream-400 border border-cream-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 px-1 py-0.5 bg-amber-500/30 rounded text-xs">
                {Object.keys(localFilters).filter(k => k !== 'search').length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </>
      }
      actionSlot={
        <>
          <button
            onClick={onExport}
            disabled={isExporting}
            className={cn(
              'px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium',
              isExporting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            )}
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={onCreate}
            className="px-2.5 py-1.5 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Provider
          </button>
        </>
      }
      secondaryFilterSlot={
        isOpen ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Type</label>
              <select
                value={localFilters.type || ''}
                onChange={(e) => updateFilter('type', e.target.value as ServiceProviderType | undefined)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              >
                <option value="">All Types</option>
                {Object.values(ProviderTypeEnum).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value as ProviderStatus | undefined)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              >
                <option value="">All Statuses</option>
                {Object.values(ProviderStatusEnum).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Location</label>
              <input
                type="text"
                placeholder="Filter by location"
                value={localFilters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              />
            </div>

            {/* Verified Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Verification</label>
              <select
                value={localFilters.is_verified === undefined ? '' : localFilters.is_verified ? 'true' : 'false'}
                onChange={(e) =>
                  updateFilter(
                    'is_verified',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              >
                <option value="">All Providers</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>
          </div>
        ) : undefined
      }
    />
  )
}
