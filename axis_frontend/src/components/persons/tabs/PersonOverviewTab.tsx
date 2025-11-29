/**
 * Person Overview Tab
 *
 * Comprehensive view of person information including personal, employment, and contact details
 */

import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  Users,
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  ClipboardList,
} from 'lucide-react'
import { type Person, PersonType } from '@/api/persons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/utils/formatters'

interface PersonOverviewTabProps {
  person: Person
}

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  variant?: 'default' | 'warning'
}

function Section({ icon, title, children, variant = 'default' }: SectionProps) {
  return (
    <div
      className={`rounded-lg p-6 ${
        variant === 'warning'
          ? 'bg-yellow-500/10 border border-yellow-500/20'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  if (!value || value === '—') return null

  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 min-w-fit">{label}:</span>
      <span className="text-white font-medium flex-1">{value}</span>
    </div>
  )
}

export function PersonOverviewTab({ person }: PersonOverviewTabProps) {
  const isEmployee = person.person_type === PersonType.CLIENT_EMPLOYEE
  const isDependent = person.person_type === PersonType.DEPENDENT

  const calculateAge = (dob: string) => {
    return Math.floor(
      (new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start gap-6 bg-white/5 border border-white/10 rounded-lg p-6">
        {/* Avatar */}
        <div className="shrink-0">
          {person.profile?.profile_picture ? (
            <img
              src={person.profile.profile_picture}
              alt={person.profile.full_name}
              className="h-24 w-24 rounded-full object-cover border-2 border-emerald-500/30"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-linear-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
              <span className="text-3xl font-bold text-emerald-400">
                {person.profile?.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || '??'}
              </span>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white mb-2">
            {person.profile?.full_name || 'Unknown'}
          </h2>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <StatusBadge status={person.status} />
            <span className="text-sm text-gray-400">
              {person.person_type === PersonType.CLIENT_EMPLOYEE
                ? 'Employee'
                : person.person_type === PersonType.DEPENDENT
                ? 'Dependent'
                : person.person_type}
            </span>
            {person.is_eligible && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-full">
                <CheckCircle className="h-3 w-3" />
                Eligible for Services
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {person.profile?.email && (
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="truncate">{person.profile.email}</span>
              </div>
            )}
            {person.profile?.phone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{person.profile.phone}</span>
              </div>
            )}
            {person.profile?.date_of_birth && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span>
                  {formatDate(person.profile.date_of_birth)}
                  <span className="text-gray-500 ml-1">
                    (Age: {calculateAge(person.profile.date_of_birth)})
                  </span>
                </span>
              </div>
            )}
            {person.profile?.gender && (
              <div className="flex items-center gap-2 text-gray-300">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{person.profile.gender}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Section icon={<User className="h-5 w-5 text-emerald-400" />} title="Personal Information">
          <div className="space-y-3">
            <InfoRow label="Full Name" value={person.profile?.full_name} />
            {person.profile?.date_of_birth && (
              <InfoRow
                label="Date of Birth"
                value={`${formatDate(person.profile.date_of_birth)} (Age: ${calculateAge(
                  person.profile.date_of_birth
                )})`}
              />
            )}
            <InfoRow label="Gender" value={person.profile?.gender} />
            <InfoRow label="Email" value={person.profile?.email} />
            <InfoRow label="Phone" value={person.profile?.phone} />
          </div>
        </Section>

        {/* Employment or Relationship */}
        {isEmployee ? (
          <Section
            icon={<Briefcase className="h-5 w-5 text-emerald-400" />}
            title="Employment Details"
          >
            <div className="space-y-3">
              <InfoRow label="Job Title" value={person.job_title} />
              <InfoRow label="Employment Status" value={person.employment_status} />
              <InfoRow label="Employee ID" value={person.employee_id_number} />
              <InfoRow label="Department" value={person.employee_department} />
              {person.employment_start_date && (
                <InfoRow label="Start Date" value={formatDate(person.employment_start_date)} />
              )}
              {person.employment_end_date && (
                <InfoRow label="End Date" value={formatDate(person.employment_end_date)} />
              )}
            </div>
          </Section>
        ) : isDependent ? (
          <Section icon={<Users className="h-5 w-5 text-emerald-400" />} title="Relationship">
            <div className="space-y-3">
              <InfoRow label="Relationship Type" value={person.relationship_type} />
              <InfoRow label="Primary Employee ID" value={person.primary_employee} />
              {person.date_of_birth && (
                <InfoRow label="Date of Birth" value={formatDate(person.date_of_birth)} />
              )}
              <InfoRow label="Eligible" value={person.is_eligible ? 'Yes' : 'No'} />
            </div>
          </Section>
        ) : null}
      </div>

      {/* Address Information */}
      {(person.profile?.address || person.profile?.city || person.profile?.country) && (
        <Section icon={<MapPin className="h-5 w-5 text-emerald-400" />} title="Address">
          <div className="space-y-3">
            <InfoRow label="Address" value={person.profile?.address} />
            <InfoRow label="City" value={person.profile?.city} />
            <InfoRow label="Country" value={person.profile?.country} />
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization */}
        <Section icon={<Building2 className="h-5 w-5 text-emerald-400" />} title="Organization">
          <div className="space-y-3">
            <InfoRow label="Client" value={person.client} />
          </div>
        </Section>

        {/* Service Information */}
        <Section icon={<Heart className="h-5 w-5 text-emerald-400" />} title="Service Information">
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 min-w-fit">Eligibility:</span>
              <span
                className={`font-medium flex items-center gap-1.5 ${
                  person.is_eligible ? 'text-emerald-400' : 'text-gray-400'
                }`}
              >
                {person.is_eligible ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Eligible
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Not Eligible
                  </>
                )}
              </span>
            </div>
            {person.last_service_date && (
              <InfoRow label="Last Service" value={formatDate(person.last_service_date)} />
            )}
            <InfoRow label="Total Sessions" value={person.total_sessions} />
          </div>
        </Section>
      </div>

      {/* Emergency Contact */}
      {(person.profile?.emergency_contact_name || person.profile?.emergency_contact_phone) && (
        <Section
          icon={<AlertCircle className="h-5 w-5 text-yellow-400" />}
          title="Emergency Contact"
          variant="warning"
        >
          <div className="space-y-3">
            <InfoRow label="Name" value={person.profile?.emergency_contact_name} />
            <InfoRow label="Phone" value={person.profile?.emergency_contact_phone} />
          </div>
        </Section>
      )}

      {/* Specializations - Only for employees */}
      {isEmployee && (person.specializations?.length || 0) > 0 && (
        <Section icon={<Briefcase className="h-5 w-5 text-emerald-400" />} title="Specializations">
          <div className="flex flex-wrap gap-2">
            {person.specializations?.map((spec, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400"
              >
                {spec}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Notes */}
      {person.notes && (
        <Section icon={<ClipboardList className="h-5 w-5 text-emerald-400" />} title="Notes">
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{person.notes}</p>
        </Section>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/10">
        <span>Created: {formatDate(person.created_at)}</span>
        <span>Last Updated: {formatDate(person.updated_at)}</span>
      </div>
    </div>
  )
}
