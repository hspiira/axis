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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResourcePageLayout } from '@/components/layouts/ResourcePageLayout'
import { useModal } from '@/hooks/useModal'
import { usePersons } from '@/hooks/usePersons'
import { type PersonListItem, type PersonFilters as ApiPersonFilters } from '@/api/persons'
import { PersonsTable } from '@/components/persons/PersonsTable'
import { PersonsFilters, type PersonsFilterState } from '@/components/persons/PersonsFilters'
import { CreatePersonModal } from '@/components/persons/CreatePersonModal'

export function PersonsPage() {
  const navigate = useNavigate()
  const createModal = useModal()

  // Filter state
  const [filters, setFilters] = useState<PersonsFilterState>({
    search: '',
    personType: 'all',
    status: 'all',
    employmentStatus: 'all',
    isEligible: 'all',
  })

  // Convert frontend filter state to API filters
  const apiFilters: ApiPersonFilters = {}
  if (filters.search) apiFilters.search = filters.search
  if (filters.personType !== 'all') apiFilters.person_type = filters.personType
  if (filters.status !== 'all') apiFilters.status = filters.status
  if (filters.employmentStatus !== 'all') apiFilters.employment_status = filters.employmentStatus
  if (filters.isEligible !== 'all') apiFilters.is_eligible = filters.isEligible

  // Fetch persons with React Query
  const { data, isLoading } = usePersons(apiFilters)
  const persons = data?.results ?? []

  // Handle person view/edit - both navigate to the same detail page
  const handleViewPerson = (person: PersonListItem) => {
    navigate(`/persons/${person.id}`)
  }

  return (
    <ResourcePageLayout
      title="Persons Management"
      subtitle="Manage employees, dependents, platform staff, and service providers"
      filters={
        <PersonsFilters
          filters={filters}
          onChange={setFilters}
          onCreate={() => createModal.open()}
        />
      }
      modals={
        <CreatePersonModal
          {...createModal.props}
          onSuccess={() => createModal.close()}
        />
      }
    >
      <PersonsTable
        persons={persons}
        isLoading={isLoading}
        onView={handleViewPerson}
        onEdit={handleViewPerson}
      />
    </ResourcePageLayout>
  )
}
