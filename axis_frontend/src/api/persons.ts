/**
 * Persons API Client
 *
 * Handles all person-related API requests (employees, dependents, staff, providers)
 */

import { apiClient } from './axios-config'

// =========================================
// Enums
// =========================================

export const PersonType = {
  PLATFORM_STAFF: 'PlatformStaff',
  CLIENT_EMPLOYEE: 'ClientEmployee',
  DEPENDENT: 'Dependent',
  SERVICE_PROVIDER: 'ServiceProvider',
} as const

export type PersonType = (typeof PersonType)[keyof typeof PersonType]

export const PersonStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  ARCHIVED: 'Archived',
} as const

export type PersonStatus = (typeof PersonStatus)[keyof typeof PersonStatus]

export const EmploymentStatus = {
  FULL_TIME: 'FullTime',
  PART_TIME: 'PartTime',
  CONTRACT: 'Contract',
  PROBATION: 'Probation',
  TERMINATED: 'Terminated',
  RESIGNED: 'Resigned',
  RETIRED: 'Retired',
} as const

export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus]

export const StaffRole = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  COORDINATOR: 'Coordinator',
  SUPPORT: 'Support',
} as const

export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole]

export const RelationshipType = {
  SPOUSE: 'Spouse',
  CHILD: 'Child',
  PARENT: 'Parent',
  SIBLING: 'Sibling',
  OTHER: 'Other',
} as const

export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType]

export const ServiceProviderType = {
  THERAPIST: 'Therapist',
  COUNSELOR: 'Counselor',
  PSYCHOLOGIST: 'Psychologist',
  PSYCHIATRIST: 'Psychiatrist',
  COACH: 'Coach',
  CONSULTANT: 'Consultant',
  OTHER: 'Other',
} as const

export type ServiceProviderType = (typeof ServiceProviderType)[keyof typeof ServiceProviderType]

// =========================================
// Profile Types
// =========================================

export interface Profile {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  city: string | null
  country: string | null
  profile_picture: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  metadata: Record<string, unknown> | null
}

// =========================================
// Person Types
// =========================================

export interface Person {
  id: string
  person_type: PersonType
  status: PersonStatus
  profile: Profile
  user: string | null
  client: string | null

  // Dual role support
  is_dual_role: boolean
  secondary_person_type: PersonType | null

  // Platform Staff fields
  staff_organization: string | null
  staff_role: StaffRole | null
  can_manage_clients: boolean
  can_view_reports: boolean
  can_manage_services: boolean
  staff_department: string | null
  staff_employee_id: string | null
  staff_hire_date: string | null
  staff_permissions: string[] | null

  // Client Employee fields
  employee_department: string | null
  employee_id_number: string | null
  employment_status: EmploymentStatus | null
  employment_start_date: string | null
  employment_end_date: string | null
  job_title: string | null
  manager: string | null

  // Dependent fields
  primary_employee: string | null
  relationship_type: RelationshipType | null
  date_of_birth: string | null
  is_eligible: boolean

  // Service Provider fields
  provider_type: ServiceProviderType | null
  license_number: string | null
  license_expiry: string | null
  specializations: string[]
  languages: string[]
  hourly_rate: string | null
  is_available: boolean
  is_verified: boolean
  rating: string | null
  bio: string | null

  // Service tracking
  total_sessions: number
  last_service_date: string | null

  // Metadata
  notes: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PersonListItem {
  id: string
  person_type: PersonType
  status: PersonStatus
  profile: {
    full_name: string
    email: string | null
    phone: string | null
  }
  client_name: string | null
  employment_status: EmploymentStatus | null
  is_eligible: boolean
  total_sessions: number
  last_service_date: string | null
}

// =========================================
// Request Types
// =========================================

export interface CreateClientEmployeeRequest {
  client_id: string
  full_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address?: string
  city?: string
  country?: string
  employee_department?: string
  employee_id_number?: string
  employment_status?: EmploymentStatus
  employment_start_date?: string
  job_title?: string
  manager_id?: string
}

export interface CreateDependentRequest {
  primary_employee_id: string
  full_name: string
  relationship_type: RelationshipType
  date_of_birth?: string
  gender?: string
  email?: string
  phone?: string
}

export interface CreatePlatformStaffRequest {
  organization_id: string
  full_name: string
  email: string
  staff_role: StaffRole
  phone?: string
  staff_department?: string
  staff_employee_id?: string
  staff_hire_date?: string
  can_manage_clients?: boolean
  can_view_reports?: boolean
  can_manage_services?: boolean
}

export interface CreateServiceProviderRequest {
  full_name: string
  provider_type: ServiceProviderType
  email: string
  phone?: string
  license_number?: string
  license_expiry?: string
  specializations?: string[]
  languages?: string[]
  hourly_rate?: string
  bio?: string
}

export interface UpdatePersonRequest {
  full_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address?: string
  city?: string
  country?: string
  employee_department?: string
  employment_status?: EmploymentStatus
  job_title?: string
  notes?: string
}

export interface PersonFilters {
  person_type?: PersonType
  status?: PersonStatus
  employment_status?: EmploymentStatus
  client_id?: string
  is_eligible?: boolean
  search?: string
  page?: number
  page_size?: number
}

export interface FamilyMembers {
  employee: Person
  dependents: Person[]
  total_members: number
}

// =========================================
// API Functions
// =========================================

export const personsApi = {
  // List persons
  list: async (filters?: PersonFilters) => {
    const { data } = await apiClient.get<{ results: PersonListItem[]; count: number }>('/persons/', {
      params: filters,
    })
    return data
  },

  // Get person details
  get: async (id: string) => {
    const { data } = await apiClient.get<Person>(`/persons/${id}/`)
    return data
  },

  // Create client employee
  createEmployee: async (request: CreateClientEmployeeRequest) => {
    const { data } = await apiClient.post<Person>('/persons/create-employee/', request)
    return data
  },

  // Create dependent
  createDependent: async (request: CreateDependentRequest) => {
    const { data } = await apiClient.post<Person>('/persons/create-dependent/', request)
    return data
  },

  // Create platform staff
  createPlatformStaff: async (request: CreatePlatformStaffRequest) => {
    const { data } = await apiClient.post<Person>('/persons/', {
      ...request,
      person_type: PersonType.PLATFORM_STAFF,
    })
    return data
  },

  // Create service provider
  createServiceProvider: async (request: CreateServiceProviderRequest) => {
    const { data } = await apiClient.post<Person>('/persons/', {
      ...request,
      person_type: PersonType.SERVICE_PROVIDER,
    })
    return data
  },

  // Update person
  update: async (id: string, request: UpdatePersonRequest) => {
    const { data } = await apiClient.patch<Person>(`/persons/${id}/`, request)
    return data
  },

  // Delete person
  delete: async (id: string) => {
    await apiClient.delete(`/persons/${id}/`)
  },

  // Get eligible persons
  getEligible: async (page = 1, pageSize = 10) => {
    const { data } = await apiClient.get<{ results: PersonListItem[]; count: number }>(
      '/persons/eligible/',
      { params: { page, page_size: pageSize } }
    )
    return data
  },

  // Get family members
  getFamily: async (employeeId: string) => {
    const { data } = await apiClient.get<FamilyMembers>(`/persons/${employeeId}/family/`)
    return data
  },

  // Get persons by client
  getByClient: async (clientId: string, filters?: { status?: EmploymentStatus; page?: number; page_size?: number }) => {
    const { data } = await apiClient.get<{ results: PersonListItem[]; count: number }>(
      `/persons/by-client/${clientId}/`,
      { params: filters }
    )
    return data
  },

  // Activate person
  activate: async (id: string) => {
    const { data } = await apiClient.post<Person>(`/persons/${id}/activate/`)
    return data
  },

  // Deactivate person
  deactivate: async (id: string, reason?: string) => {
    const { data } = await apiClient.post<Person>(`/persons/${id}/deactivate/`, { reason })
    return data
  },

  // Update employment status
  updateEmploymentStatus: async (id: string, employmentStatus: EmploymentStatus, endDate?: string) => {
    const { data } = await apiClient.post<Person>(`/persons/${id}/update-employment-status/`, {
      employment_status: employmentStatus,
      employment_end_date: endDate,
    })
    return data
  },
}
