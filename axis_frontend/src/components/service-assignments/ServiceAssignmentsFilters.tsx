/**
 * Service Assignments Filters Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle service assignment filtering and search
 * - Open/Closed: Extensible with additional filters
 */

import { Search, X } from 'lucide-react'
import { ServiceStatus, type AssignmentSearchParams } from '@/api/services'
import { useClients } from '@/hooks/useClients'
import { useServices } from '@/hooks/useServices'
import { FilterToolbar } from '@/components/ui'

interface ServiceAssignmentsFiltersProps {
  filters: AssignmentSearchParams
  onFiltersChange: (filters: AssignmentSearchParams) => void
}

export function ServiceAssignmentsFilters({
  filters,
  onFiltersChange,
}: ServiceAssignmentsFiltersProps) {
  const { data: clients = [] } = useClients()
  const { data: services = [] } = useServices()

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined })
  }

  const handleClientChange = (clientId: string) => {
    onFiltersChange({ ...filters, client_id: clientId || undefined })
  }

  const handleServiceChange = (serviceId: string) => {
    onFiltersChange({ ...filters, service_id: serviceId || undefined })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: (status as ServiceStatus) || undefined })
  }

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters =
    filters.search || filters.client_id || filters.service_id || filters.status

  return (
    <FilterToolbar
      variant="bordered"
      searchSlot={
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
          />
        </div>
      }
      filterSlot={
        <>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </>
      }
      secondaryFilterSlot={
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Client</label>
            <select
              value={filters.client_id || ''}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Service</label>
            <select
              value={filters.service_id || ''}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500/50"
            >
              <option value="">All Statuses</option>
              <option value={ServiceStatus.ACTIVE}>Active</option>
              <option value={ServiceStatus.INACTIVE}>Inactive</option>
              <option value={ServiceStatus.PENDING}>Pending</option>
              <option value={ServiceStatus.ARCHIVED}>Archived</option>
            </select>
          </div>
        </div>
      }
    />
  )
}
