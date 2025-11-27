/**
 * Person Employment/Relationship Tab
 *
 * Employment details for employees, relationship details for dependents
 */

import { type Person } from '@/api/persons'
import { Briefcase, Calendar, Building2, Users, User } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

interface PersonEmploymentTabProps {
  person: Person
}

export function PersonEmploymentTab({ person }: PersonEmploymentTabProps) {
  if (person.is_employee) {
    return (
      <div className="space-y-6 max-w-4xl">
        {/* Employment Details */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            Employment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Employee Role</label>
              <p className="text-white font-medium">{person.employee_role || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Employment Status</label>
              <p className="text-white font-medium">{person.employment_status || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Employee ID</label>
              <p className="text-white font-medium">{person.employee_id_number || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Department</label>
              <p className="text-white font-medium">{person.employee_department || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Start Date</label>
              <p className="text-white font-medium">
                {person.employment_start_date ? formatDate(person.employment_start_date) : '—'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">End Date</label>
              <p className="text-white font-medium">
                {person.employment_end_date ? formatDate(person.employment_end_date) : '—'}
              </p>
            </div>
            {person.employment_duration && (
              <div>
                <label className="text-sm text-gray-400">Duration</label>
                <p className="text-white font-medium">{person.employment_duration} days</p>
              </div>
            )}
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Client</label>
              <p className="text-white font-medium">{person.client_name || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Client ID</label>
              <p className="text-white font-medium">{person.client_id || '—'}</p>
            </div>
          </div>
        </div>

        {/* Qualifications & Specializations */}
        {(person.qualifications?.length || person.specializations?.length) && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Qualifications & Specializations
            </h3>
            {person.qualifications?.length > 0 && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Qualifications</label>
                <div className="flex flex-wrap gap-2">
                  {person.qualifications.map((q, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {person.specializations?.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {person.specializations.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Dependent relationship information
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Relationship Details */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />
          Relationship Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Relationship Type</label>
            <p className="text-white font-medium">{person.relationship_to_employee || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Primary Employee</label>
            <p className="text-white font-medium">{person.primary_employee_name || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Primary Employee ID</label>
            <p className="text-white font-medium">{person.primary_employee_id || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Also an Employee</label>
            <p className="text-white font-medium">
              {person.is_employee_dependent ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Effective Client */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-400" />
          Effective Client
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400">Client Name</label>
            <p className="text-white font-medium">{person.effective_client_name || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
