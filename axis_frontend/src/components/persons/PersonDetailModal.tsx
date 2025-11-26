/**
 * Person Detail Modal
 *
 * Displays detailed information about a person with edit capabilities
 */

import { useState, useEffect } from 'react'
import { X, Mail, Phone, Calendar, MapPin, Briefcase, Users, Loader2 } from 'lucide-react'
import { personsApi, type Person, PersonType } from '@/api/persons'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatters'

interface PersonDetailModalProps {
  personId: string
  onClose: () => void
  onUpdate: () => void
}

const personTypeLabels: Record<PersonType, string> = {
  [PersonType.CLIENT_EMPLOYEE]: 'Client Employee',
  [PersonType.DEPENDENT]: 'Dependent',
  [PersonType.PLATFORM_STAFF]: 'Platform Staff',
  [PersonType.SERVICE_PROVIDER]: 'Service Provider',
}

const personTypeBadgeColors: Record<PersonType, string> = {
  [PersonType.CLIENT_EMPLOYEE]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [PersonType.DEPENDENT]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [PersonType.PLATFORM_STAFF]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [PersonType.SERVICE_PROVIDER]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const personStatusColors: Record<string, string> = {
  'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Inactive': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Suspended': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Archived': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function PersonDetailModal({ personId, onClose }: PersonDetailModalProps) {
  const [person, setPerson] = useState<Person | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const data = await personsApi.get(personId)
        setPerson(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load person details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPerson()
  }, [personId])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50">
        <div className="bg-gray-950 rounded-xl p-12 border border-white/10">
          <Loader2 className="h-12 w-12 text-emerald-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading person details...</p>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div className="bg-gray-950 rounded-xl max-w-md w-full p-6 border border-white/10">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 mb-4">
            {error || 'Person not found'}
          </div>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-gray-950 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
              {person.profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{person.profile.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                  personTypeBadgeColors[person.person_type]
                )}>
                  {personTypeLabels[person.person_type]}
                </span>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                  personStatusColors[person.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                )}>
                  {person.status}
                </span>
                {person.is_eligible && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Eligible
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person.profile.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="text-white">{person.profile.email}</div>
                  </div>
                </div>
              )}
              {person.profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Phone</div>
                    <div className="text-white">{person.profile.phone}</div>
                  </div>
                </div>
              )}
              {person.profile.date_of_birth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Date of Birth</div>
                    <div className="text-white">{formatDate(person.profile.date_of_birth)}</div>
                  </div>
                </div>
              )}
              {person.profile.gender && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Gender</div>
                    <div className="text-white">{person.profile.gender}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          {(person.profile.address || person.profile.city || person.profile.country) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Address</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div className="text-white">
                  {person.profile.address && <div>{person.profile.address}</div>}
                  <div>
                    {person.profile.city && <span>{person.profile.city}</span>}
                    {person.profile.city && person.profile.country && <span>, </span>}
                    {person.profile.country && <span>{person.profile.country}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employment Information (for employees) */}
          {person.person_type === PersonType.CLIENT_EMPLOYEE && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.employee_id_number && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Employee ID</div>
                      <div className="text-white">{person.employee_id_number}</div>
                    </div>
                  </div>
                )}
                {person.job_title && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Job Title</div>
                      <div className="text-white">{person.job_title}</div>
                    </div>
                  </div>
                )}
                {person.employee_department && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Department</div>
                      <div className="text-white">{person.employee_department}</div>
                    </div>
                  </div>
                )}
                {person.employment_status && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Employment Status</div>
                      <div className="text-white">{person.employment_status}</div>
                    </div>
                  </div>
                )}
                {person.employment_start_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Start Date</div>
                      <div className="text-white">{formatDate(person.employment_start_date)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service History */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Service History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Total Sessions</div>
                <div className="text-2xl font-bold text-white">{person.total_sessions}</div>
              </div>
              {person.last_service_date && (
                <div>
                  <div className="text-sm text-gray-400">Last Service Date</div>
                  <div className="text-white">{formatDate(person.last_service_date)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {person.notes && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{person.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-950 border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
