/**
 * Service Assignments Filters Component
 *
 * Provides filtering options for service assignments
 */

import { Search, X } from 'lucide-react'
import { ServiceStatus, type AssignmentSearchParams } from '@/api/services'
import { useClients } from '@/hooks/useClients'
import { useServices } from '@/hooks/useServices'

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search assignments..."
              className="w-full pl-10 pr-4 py-2 bg-theme border border-theme rounded-lg text-theme placeholder-theme-tertiary focus:outline-none focus:ring-2 focus:ring-cream-500"
            />
          </div>
        </div>

        {/* Client Filter */}
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-2">Client</label>
          <select
            value={filters.client_id || ''}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
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
          <label className="block text-sm font-medium text-theme-secondary mb-2">Service</label>
          <select
            value={filters.service_id || ''}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
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
          <label className="block text-sm font-medium text-theme-secondary mb-2">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-4 py-2 bg-theme border border-theme rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
          >
            <option value="">All Statuses</option>
            <option value={ServiceStatus.ACTIVE}>Active</option>
            <option value={ServiceStatus.INACTIVE}>Inactive</option>
            <option value={ServiceStatus.PENDING}>Pending</option>
            <option value={ServiceStatus.ARCHIVED}>Archived</option>
          </select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-end">
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-theme-secondary hover:text-theme bg-theme-secondary hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
