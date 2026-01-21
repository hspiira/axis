/**
 * Persons Filters Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle person filtering and search
 * - Open/Closed: Extensible with additional filters
 */

import { useState } from 'react'
import { Search, Filter, Plus, X } from 'lucide-react'
import { PersonType, PersonStatus, EmploymentStatus } from '@/api/persons'
import { cn } from '@/lib/utils'
import { FilterToolbar } from '@/components/ui'

export interface PersonsFilterState {
  search: string
  personType: PersonType | 'all'
  status: PersonStatus | 'all'
  employmentStatus: EmploymentStatus | 'all'
  isEligible: boolean | 'all'
}

interface PersonsFiltersProps {
  filters: PersonsFilterState
  onChange: (filters: PersonsFilterState) => void
  onCreate?: () => void
}

export function PersonsFilters({ filters, onChange, onCreate }: PersonsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const clearFilters = () => {
    onChange({
      search: '',
      personType: 'all',
      status: 'all',
      employmentStatus: 'all',
      isEligible: 'all',
    })
  }

  const hasActiveFilters =
    filters.search !== '' ||
    filters.personType !== 'all' ||
    filters.status !== 'all' ||
    filters.employmentStatus !== 'all' ||
    filters.isEligible !== 'all'

  return (
    <FilterToolbar
      variant="bordered"
      searchSlot={
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by name, email, or phone..."
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
                {Object.values(filters).filter(v => v !== 'all' && v !== '').length}
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
          {onCreate && (
            <button
              onClick={onCreate}
              className="px-2.5 py-1.5 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-all flex items-center gap-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Person
            </button>
          )}
        </>
      }
      secondaryFilterSlot={
        isOpen ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            {/* Person Type */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Person Type</label>
              <select
                value={filters.personType}
                onChange={(e) => onChange({ ...filters, personType: e.target.value as PersonType | 'all' })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              >
                <option value="all">All Types</option>
                <option value={PersonType.CLIENT_EMPLOYEE}>Employees</option>
                <option value={PersonType.DEPENDENT}>Dependents</option>
                <option value={PersonType.PLATFORM_STAFF}>Platform Staff</option>
                <option value={PersonType.SERVICE_PROVIDER}>Service Providers</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => onChange({ ...filters, status: e.target.value as PersonStatus | 'all' })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              >
                <option value="all">All Statuses</option>
                <option value={PersonStatus.ACTIVE}>Active</option>
                <option value={PersonStatus.INACTIVE}>Inactive</option>
                <option value={PersonStatus.SUSPENDED}>Suspended</option>
                <option value={PersonStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            {/* Employment Status */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Employment</label>
              <select
                value={filters.employmentStatus}
                onChange={(e) => onChange({ ...filters, employmentStatus: e.target.value as EmploymentStatus | 'all' })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              >
                <option value="all">All Employment</option>
                <option value={EmploymentStatus.FULL_TIME}>Full Time</option>
                <option value={EmploymentStatus.PART_TIME}>Part Time</option>
                <option value={EmploymentStatus.CONTRACT}>Contract</option>
                <option value={EmploymentStatus.PROBATION}>Probation</option>
                <option value={EmploymentStatus.TERMINATED}>Terminated</option>
                <option value={EmploymentStatus.RESIGNED}>Resigned</option>
              </select>
            </div>

            {/* Eligibility */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Eligibility</label>
              <select
                value={filters.isEligible === 'all' ? 'all' : filters.isEligible ? 'true' : 'false'}
                onChange={(e) => onChange({
                  ...filters,
                  isEligible: e.target.value === 'all' ? 'all' : e.target.value === 'true'
                })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
              >
                <option value="all">All</option>
                <option value="true">Eligible</option>
                <option value="false">Not Eligible</option>
              </select>
            </div>
          </div>
        ) : undefined
      }
    />
  )
}
