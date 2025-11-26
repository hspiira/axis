/**
 * Client Persons Tab Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display and manage persons (employees/dependents) for a specific client
 * - Dependency Inversion: Depends on hooks abstraction, not direct API calls
 * - Open/Closed: Extensible with additional filters/actions without modifying core logic
 * - Interface Segregation: Uses focused hooks and components
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, UserPlus, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { type ClientDetail } from '@/api/clients'
import { type PersonListItem, PersonType, EmploymentStatus } from '@/api/persons'
import { usePersonsByClient } from '@/hooks/usePersons'
import { PersonsTable } from '@/components/persons/PersonsTable'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { CreatePersonModal } from '@/components/persons/CreatePersonModal'
import { cn } from '@/lib/utils'

interface ClientPersonsTabProps {
  client: ClientDetail
}

/**
 * Statistics Card Component
 * 
 * Single Responsibility: Display a single statistic
 */
interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconColor: string
}

function StatCard({ label, value, icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('h-5 w-5', iconColor)}>{icon}</div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

/**
 * Search Input Component
 * 
 * Single Responsibility: Handle search input
 */
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function SearchInput({ value, onChange, placeholder = 'Search persons...' }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
      />
    </div>
  )
}

/**
 * Filter Select Component
 * 
 * Single Responsibility: Handle filter selection
 */
interface FilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-400 whitespace-nowrap">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ClientPersonsTab({ client }: ClientPersonsTabProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Fetch persons for this client with server-side pagination
  // Using by-client endpoint which returns both employees and dependents
  const {
    data: personsData,
    isLoading,
    error,
    refetch,
  } = usePersonsByClient(client.id, {
    status: statusFilter !== 'all' ? (statusFilter as EmploymentStatus) : undefined,
    page: currentPage,
    page_size: pageSize,
  })

  const persons = personsData?.results || []
  const totalCount = personsData?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('ClientPersonsTab Debug:', {
      clientId: client.id,
      personsData,
      persons,
      totalCount,
      isLoading,
      error: error?.message,
    })
  }

  // Calculate statistics - we need to fetch all persons for accurate stats
  // For now, we'll calculate from current page data (can be enhanced with a separate stats endpoint)
  const stats = useMemo(() => {
    const totalEmployees = persons.filter((p) => p.person_type === PersonType.CLIENT_EMPLOYEE).length
    const activeEmployees = persons.filter(
      (p) => p.person_type === PersonType.CLIENT_EMPLOYEE && p.status === 'Active'
    ).length
    const dependents = persons.filter((p) => p.person_type === PersonType.DEPENDENT).length
    const eligibleCount = persons.filter((p) => p.is_eligible).length

    return {
      totalEmployees,
      activeEmployees,
      dependents,
      eligible: eligibleCount,
    }
  }, [persons])

  // Filter persons by search query (client-side filtering on current page)
  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) return persons

    const query = searchQuery.toLowerCase()
    return persons.filter((person) => {
      const name = person.profile?.full_name?.toLowerCase() || ''
      const email = person.profile?.email?.toLowerCase() || ''
      const phone = person.profile?.phone?.toLowerCase() || ''
      return name.includes(query) || email.includes(query) || phone.includes(query)
    })
  }, [persons, searchQuery])

  // Employment status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: EmploymentStatus.FULL_TIME, label: 'Full Time' },
    { value: EmploymentStatus.PART_TIME, label: 'Part Time' },
    { value: EmploymentStatus.CONTRACT, label: 'Contract' },
    { value: EmploymentStatus.PROBATION, label: 'Probation' },
    { value: EmploymentStatus.TERMINATED, label: 'Terminated' },
    { value: EmploymentStatus.RESIGNED, label: 'Resigned' },
    { value: EmploymentStatus.RETIRED, label: 'Retired' },
  ]

  // Handlers
  const handleViewPerson = (person: PersonListItem) => {
    navigate(`/persons?view=${person.id}`)
  }

  const handleEditPerson = (person: PersonListItem) => {
    navigate(`/persons?edit=${person.id}`)
  }

  const handleCreateEmployee = () => {
    setShowCreateModal(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    refetch()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl">
        <ErrorAlert
          title="Failed to load persons"
          message={error instanceof Error ? error.message : 'An error occurred while loading persons'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon={<Users className="h-5 w-5" />}
          iconColor="text-emerald-400"
        />
        <StatCard
          label="Active Employees"
          value={stats.activeEmployees}
          icon={<Users className="h-5 w-5" />}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Dependents"
          value={stats.dependents}
          icon={<Users className="h-5 w-5" />}
          iconColor="text-purple-400"
        />
        <StatCard
          label="Eligible for Services"
          value={stats.eligible}
          icon={<Users className="h-5 w-5" />}
          iconColor="text-amber-400"
        />
      </div>

      {/* Persons List Section */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Employees & Dependents</h3>
            <p className="text-sm text-gray-400 mt-1">
              {totalCount} {totalCount === 1 ? 'person' : 'persons'} for {client.name}
            </p>
          </div>
          <button
            onClick={handleCreateEmployee}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput value={searchQuery} onChange={setSearchQuery} />
          </div>
          <FilterSelect
            label="Employment Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as EmploymentStatus | 'all')
              setCurrentPage(1) // Reset to first page when filter changes
            }}
            options={statusOptions}
          />
        </div>

        {/* Persons Table */}
        {filteredPersons.length > 0 ? (
          <>
            <PersonsTable
              persons={filteredPersons}
              isLoading={isLoading}
              onView={handleViewPerson}
              onEdit={handleEditPerson}
              pageSize={filteredPersons.length} // Disable client-side pagination
            />
            {/* Server-side Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-6 py-4 mt-4">
                <div className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">
                    {(currentPage - 1) * pageSize + 1}
                  </span> to{' '}
                  <span className="font-medium text-white">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span> of{' '}
                  <span className="font-medium text-white">{totalCount}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      currentPage === 1
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number
                      if (totalPages <= 7) {
                        page = i + 1
                      } else if (currentPage <= 4) {
                        page = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i
                      } else {
                        page = currentPage - 3 + i
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'px-3 py-1 rounded-lg text-sm transition-colors',
                            currentPage === page
                              ? 'bg-emerald-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          )}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      currentPage === totalPages
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            {searchQuery || statusFilter !== 'all' ? (
              <>
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No persons found matching your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                  className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No persons found for this client</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add employees to get started with {client.name}
                </p>
                <button
                  onClick={handleCreateEmployee}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  Add First Employee
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <CreatePersonModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          initialClientId={client.id}
        />
      )}
    </div>
  )
}
