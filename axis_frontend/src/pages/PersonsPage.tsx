/**
 * Persons Management Page
 *
 * Unified management for all person types:
 * - Client Employees: Employees from client organizations who are eligible for EAP services
 * - Dependents: Family members of employees who may also access services
 * - Platform Staff: Administrators and coordinators who manage the EAP platform
 * - Service Providers: Therapists, counselors, and other service professionals
 *
 * This page provides comprehensive person management including:
 * - Search and filtering across all person types
 * - Quick stats on active persons, eligibility, and service utilization
 * - Creation workflows tailored to each person type
 * - Detailed person profiles with contact, employment, and service history
 */

'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { personsApi, type PersonListItem, type PersonFilters as ApiPersonFilters } from '@/api/persons'
import { PersonsTable } from '@/components/persons/PersonsTable'
import { PersonsFilters, type PersonsFilterState } from '@/components/persons/PersonsFilters'
import { CreatePersonModal } from '@/components/persons/CreatePersonModal'
import { ErrorAlert } from '@/components/ui/ErrorAlert'

export function PersonsPage() {
  const { setPageTitle } = usePageTitle()
  const navigate = useNavigate()
  const [persons, setPersons] = useState<PersonListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<PersonsFilterState>({
    search: '',
    personType: 'all',
    status: 'all',
    employmentStatus: 'all',
    isEligible: 'all',
  })

  // Set page title
  useEffect(() => {
    setPageTitle(
      'Persons Management',
      'Manage employees, dependents, platform staff, and service providers'
    )
    return () => setPageTitle(null)
  }, [setPageTitle])

  // Fetch persons based on filters
  const fetchPersons = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Convert frontend filter state to API filters
      const apiFilters: ApiPersonFilters = {}

      if (filters.search) apiFilters.search = filters.search
      if (filters.personType !== 'all') apiFilters.person_type = filters.personType
      if (filters.status !== 'all') apiFilters.status = filters.status
      if (filters.employmentStatus !== 'all') apiFilters.employment_status = filters.employmentStatus
      if (filters.isEligible !== 'all') apiFilters.is_eligible = filters.isEligible

      const data = await personsApi.list(apiFilters)
      setPersons(data.results)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch persons'))
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchPersons()
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (newFilters: PersonsFilterState) => {
    setFilters(newFilters)
  }

  // Handle person view
  const handleViewPerson = (person: PersonListItem) => {
    // Navigate to dedicated person detail page
    navigate(`/persons/${person.id}`)
  }

  // Handle person edit
  const handleEditPerson = (person: PersonListItem) => {
    // Navigate to dedicated person detail page (edit functionality is within the page)
    navigate(`/persons/${person.id}`)
  }

  // Handle person created
  const handlePersonCreated = () => {
    setShowCreateModal(false)
    fetchPersons() // Refresh list
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Filters */}
        <div className="mb-6">
          <PersonsFilters
            filters={filters}
            onChange={handleFilterChange}
            onCreate={() => setShowCreateModal(true)}
          />
        </div>

        {/* Error State */}
        <ErrorAlert
          error={error}
          onRetry={fetchPersons}
          onDismiss={() => setError(null)}
          className="mb-6"
        />

        {/* Table */}
        <PersonsTable
          persons={persons}
          isLoading={isLoading}
          onView={handleViewPerson}
          onEdit={handleEditPerson}
        />
      </div>

      {/* Create Person Modal */}
      {showCreateModal && (
        <CreatePersonModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePersonCreated}
        />
      )}
    </AppLayout>
  )
}
