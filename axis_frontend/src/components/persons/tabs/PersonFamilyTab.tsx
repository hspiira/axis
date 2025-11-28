/**
 * Person Family Tab
 *
 * Shows family relationships:
 * - For employees: Displays their dependants
 * - For dependants: Displays their primary employee
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, User, Mail, Phone, Calendar, Heart, ChevronRight, Loader2 } from 'lucide-react'
import { type Person, type FamilyMembers, personsApi, PersonType } from '@/api/persons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/lib/utils'

interface PersonFamilyTabProps {
  person: Person
}

export function PersonFamilyTab({ person }: PersonFamilyTabProps) {
  const navigate = useNavigate()
  const [familyData, setFamilyData] = useState<FamilyMembers | null>(null)
  const [primaryEmployee, setPrimaryEmployee] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isEmployee = person.person_type === PersonType.CLIENT_EMPLOYEE
  const isDependent = person.person_type === PersonType.DEPENDENT

  useEffect(() => {
    const fetchFamilyData = async () => {
      setLoading(true)
      setError(null)

      try {
        if (isEmployee) {
          // Fetch dependants for this employee
          const data = await personsApi.getFamily(person.id)
          setFamilyData(data)
        } else if (isDependent && person.primary_employee) {
          // Fetch the primary employee details
          const employeeData = await personsApi.get(person.primary_employee)
          setPrimaryEmployee(employeeData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load family data')
      } finally {
        setLoading(false)
      }
    }

    fetchFamilyData()
  }, [person.id, person.primary_employee, isEmployee, isDependent])

  // Handle person card click
  const handlePersonClick = (personId: string) => {
    if (person.client) {
      navigate(`/clients/${person.client}/persons/${personId}`)
    } else {
      navigate(`/persons/${personId}`)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  // Empty state for employees with no dependants
  if (isEmployee && familyData && familyData.dependents.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Dependants</h3>
        <p className="text-gray-400">This employee has no registered dependants.</p>
      </div>
    )
  }

  // Empty state for dependants without primary employee
  if (isDependent && !person.primary_employee) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Primary Employee</h3>
        <p className="text-gray-400">This dependant is not linked to an employee.</p>
      </div>
    )
  }

  // Render employee's dependants
  if (isEmployee && familyData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Dependants</h3>
            <p className="text-sm text-gray-400">
              {familyData.total_members} family {familyData.total_members === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyData.dependents.map((dependent) => (
            <button
              key={dependent.id}
              onClick={() => handlePersonClick(dependent.id)}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {dependent.profile?.profile_picture ? (
                    <img
                      src={dependent.profile.profile_picture}
                      alt={dependent.profile.full_name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500/30"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-400">
                        {dependent.profile?.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || '??'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white mb-1 truncate">
                        {dependent.profile?.full_name || 'Unknown'}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={dependent.status} />
                        {dependent.relationship_type && (
                          <span className="text-xs text-gray-400 px-2 py-0.5 bg-white/5 rounded">
                            {dependent.relationship_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                  </div>

                  <div className="space-y-1">
                    {dependent.profile?.email && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{dependent.profile.email}</span>
                      </div>
                    )}
                    {dependent.profile?.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Phone className="h-3 w-3" />
                        <span>{dependent.profile.phone}</span>
                      </div>
                    )}
                    {dependent.date_of_birth && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>Born {formatDate(dependent.date_of_birth)}</span>
                      </div>
                    )}
                    {dependent.is_eligible && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <Heart className="h-3 w-3" />
                        <span>Eligible for services</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Render dependant's primary employee
  if (isDependent && primaryEmployee) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Primary Employee</h3>
          <p className="text-sm text-gray-400">The employee this person is dependent on</p>
        </div>

        <button
          onClick={() => handlePersonClick(primaryEmployee.id)}
          className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all text-left group w-full"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {primaryEmployee.profile?.profile_picture ? (
                <img
                  src={primaryEmployee.profile.profile_picture}
                  alt={primaryEmployee.profile.full_name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500/30"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-400">
                    {primaryEmployee.profile?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || '??'}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-white mb-2 truncate">
                    {primaryEmployee.profile?.full_name || 'Unknown'}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <StatusBadge status={primaryEmployee.status} />
                    {primaryEmployee.job_title && (
                      <span className="text-xs text-gray-400 px-2 py-1 bg-white/5 rounded">
                        {primaryEmployee.job_title}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              </div>

              <div className="space-y-2">
                {primaryEmployee.profile?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{primaryEmployee.profile.email}</span>
                  </div>
                )}
                {primaryEmployee.profile?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{primaryEmployee.profile.phone}</span>
                  </div>
                )}
                {primaryEmployee.employee_department && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{primaryEmployee.employee_department}</span>
                  </div>
                )}
                {person.relationship_type && (
                  <div className="text-sm text-emerald-400 mt-2">
                    Relationship: {person.relationship_type}
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>
    )
  }

  // Fallback for other person types
  return (
    <div className="text-center py-12">
      <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">No Family Information</h3>
      <p className="text-gray-400">Family information is only available for employees and dependants.</p>
    </div>
  )
}
