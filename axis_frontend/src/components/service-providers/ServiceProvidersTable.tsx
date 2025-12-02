/**
 * Service Providers Table Component
 *
 * Displays service providers in a sortable, paginated table.
 */

import { useState } from 'react'
import { Edit, Trash2, CheckCircle, Shield, Mail, Phone } from 'lucide-react'
import type { ServiceProviderList } from '@/api/services'
import { formatShortDate } from '@/utils/formatters'

interface ServiceProvidersTableProps {
  providers: ServiceProviderList[]
  isLoading: boolean
  onEdit: (provider: ServiceProviderList) => void
  onDelete: (provider: ServiceProviderList) => void
  onVerify: (provider: ServiceProviderList) => void
}

type SortField = 'name' | 'status' | 'rating' | 'created_at'
type SortDirection = 'asc' | 'desc'

export function ServiceProvidersTable({
  providers,
  isLoading,
  onEdit,
  onDelete,
  onVerify,
}: ServiceProvidersTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProviders = [...providers].sort((a, b) => {
    let aValue: string | number = ''
    let bValue: string | number = ''

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'status':
        aValue = a.status.toLowerCase()
        bValue = b.status.toLowerCase()
        break
      case 'rating':
        aValue = parseFloat(a.rating || '0')
        bValue = parseFloat(b.rating || '0')
        break
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedProviders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProviders = sortedProviders.slice(startIndex, startIndex + itemsPerPage)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-emerald-400'
      case 'Inactive':
        return 'text-gray-400'
      case 'Pending':
        return 'text-yellow-400'
      case 'Suspended':
        return 'text-rose-400'
      default:
        return 'text-gray-400'
    }
  }

  const getRatingColor = (rating: string | null) => {
    if (!rating) return 'text-gray-400'
    const numRating = parseFloat(rating)
    if (numRating >= 4.5) return 'text-emerald-400'
    if (numRating >= 4.0) return 'text-green-400'
    if (numRating >= 3.5) return 'text-yellow-400'
    if (numRating >= 3.0) return 'text-orange-400'
    return 'text-rose-400'
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Loading providers...</p>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg mb-2">No providers found</p>
        <p className="text-gray-500 text-sm">
          Try adjusting your filters or create a new provider
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Provider <SortIcon field="name" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type/Location
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Status <SortIcon field="status" />
              </th>
              <th
                onClick={() => handleSort('rating')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Rating <SortIcon field="rating" />
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              >
                Created <SortIcon field="created_at" />
              </th>
              <th className="px-4 py-3 w-32 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedProviders.map((provider) => (
              <tr
                key={provider.id}
                className="hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => onEdit(provider)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{provider.name}</span>
                    {provider.is_verified && (
                      <CheckCircle className="h-4 w-4 text-emerald-400" aria-label="Verified" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 text-xs text-gray-400">
                    {provider.contact_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{provider.contact_email}</span>
                      </div>
                    )}
                    {provider.contact_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{provider.contact_phone}</span>
                      </div>
                    )}
                    {!provider.contact_email && !provider.contact_phone && <span>—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{provider.type}</span>
                    {provider.location && <span className="text-xs text-gray-400">{provider.location}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${getStatusColor(provider.status)}`}>
                    {provider.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${getRatingColor(provider.rating)}`}>
                    {provider.rating ? `${parseFloat(provider.rating).toFixed(1)} ⭐` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {formatShortDate(provider.created_at)}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(provider)}
                      className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {!provider.is_verified && (
                      <button
                        onClick={() => onVerify(provider)}
                        className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
                        aria-label="Verify"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(provider)}
                      className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, providers.length)} of{' '}
            {providers.length} providers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
