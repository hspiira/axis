/**
 * Persons Filters Component
 *
 * Filtering controls for persons list
 */

import { useState } from 'react'
import { Search, Filter, Plus, X } from 'lucide-react'
import { PersonType, PersonStatus, EmploymentStatus } from '@/api/persons'
import { cn } from '@/lib/utils'

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
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'px-2.5 py-1.5 rounded-lg transition-colors relative flex items-center gap-1.5 text-xs font-medium',
            hasActiveFilters
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-0.5 px-1 py-0.5 bg-white/20 text-xs rounded">
              {Object.values(filters).filter(v => v !== 'all' && v !== '').length}
            </span>
          )}
        </button>

        {onCreate && (
          <button
            onClick={onCreate}
            className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Person
          </button>
        )}
      </div>

      {/* Expandable Filters */}
      {isOpen && (
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Person Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Person Type</label>
          <select
            value={filters.personType}
            onChange={(e) => onChange({ ...filters, personType: e.target.value as PersonType | 'all' })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value as PersonStatus | 'all' })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Employment</label>
          <select
            value={filters.employmentStatus}
            onChange={(e) => onChange({ ...filters, employmentStatus: e.target.value as EmploymentStatus | 'all' })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Eligibility</label>
          <select
            value={filters.isEligible === 'all' ? 'all' : filters.isEligible ? 'true' : 'false'}
            onChange={(e) => onChange({
              ...filters,
              isEligible: e.target.value === 'all' ? 'all' : e.target.value === 'true'
            })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          >
            <option value="all">All</option>
            <option value="true">Eligible</option>
            <option value="false">Not Eligible</option>
          </select>
        </div>
      </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
