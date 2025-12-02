/**
 * Services Filters Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle service filtering and search
 * - Open/Closed: Extensible with additional filters
 */

import { useState } from 'react'
import { X, Filter, Plus, Download } from 'lucide-react'
import { ServiceStatus, type ServiceSearchParams } from '@/api/services'
import { useServiceCategories } from '@/hooks/useServices'
import { cn } from '@/lib/utils'
import { SearchInput } from '@/components/ui/SearchInput'

interface ServicesFiltersProps {
  filters: ServiceSearchParams
  onFiltersChange: (filters: ServiceSearchParams) => void
  onCreate?: () => void
  onExport?: () => void
  isExporting?: boolean
}

export function ServicesFilters({
  filters,
  onFiltersChange,
  onCreate,
  onExport,
  isExporting = false,
}: ServicesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: categoriesData, isLoading: categoriesLoading } = useServiceCategories()
  const categories = Array.isArray(categoriesData) ? categoriesData : []

  const updateFilter = (key: keyof ServiceSearchParams, value: string | boolean | undefined) => {
    const newFilters = { ...filters }

    if (value === undefined || value === '') {
      delete newFilters[key]
    } else {
      newFilters[key] = value as any
    }

    onFiltersChange(newFilters)
  }

  const handleSearchChange = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      const newFilters = { ...filters }
      delete newFilters.search
      onFiltersChange(newFilters)
    } else {
      updateFilter('search', trimmedValue)
    }
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0
  const searchValue = filters.search || ''

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search services..."
          className="flex-1"
          debounceMs={300}
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'px-2.5 py-1.5 rounded-lg transition-all relative flex items-center gap-1.5 text-xs font-medium',
            isOpen || hasActiveFilters
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-0.5 px-1 py-0.5 bg-emerald-500/30 rounded text-xs">
              {Object.keys(filters).length}
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
        {onExport && (
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
        )}
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Service
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value as ServiceStatus | undefined)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            >
              <option value="">All Statuses</option>
              {Object.values(ServiceStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Category</label>
            <select
              value={filters.category_id || ''}
              onChange={(e) => updateFilter('category_id', e.target.value || undefined)}
              disabled={categoriesLoading}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 disabled:opacity-50"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Billable Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Billable</label>
            <select
              value={
                filters.is_billable === undefined
                  ? ''
                  : filters.is_billable
                    ? 'billable'
                    : 'non-billable'
              }
              onChange={(e) => {
                const value = e.target.value
                updateFilter(
                  'is_billable',
                  value === '' ? undefined : value === 'billable'
                )
              }}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            >
              <option value="">All</option>
              <option value="billable">Billable</option>
              <option value="non-billable">Non-Billable</option>
            </select>
          </div>

          {/* Provider Required Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Provider</label>
            <select
              value={
                filters.requires_provider === undefined
                  ? ''
                  : filters.requires_provider
                    ? 'required'
                    : 'optional'
              }
              onChange={(e) => {
                const value = e.target.value
                updateFilter(
                  'requires_provider',
                  value === '' ? undefined : value === 'required'
                )
              }}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            >
              <option value="">All</option>
              <option value="required">Required</option>
              <option value="optional">Optional</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
