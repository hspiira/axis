/**
 * Person Overview Tab
 *
 * Displays key information about a person at a glance
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
} from 'lucide-react'
import { type Person } from '@/api/persons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/utils/formatters'

interface PersonOverviewTabProps {
  person: Person
}

interface InfoCardProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function InfoCard({ icon, title, children }: InfoCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-white font-medium">{value || '—'}</span>
      </div>
    </div>
  )
}

export function PersonOverviewTab({ person }: PersonOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start gap-6 bg-white/5 border border-white/10 rounded-lg p-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {person.profile?.image ? (
            <img
              src={person.profile.image}
              alt={person.profile.full_name}
              className="h-24 w-24 rounded-full object-cover border-2 border-emerald-500/30"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
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
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {person.profile?.full_name || 'Unknown'}
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={person.status} />
                <span className="text-sm text-gray-400">
                  {person.person_type === 'ClientEmployee' ? 'Employee' : 'Dependent'}
                </span>
                {person.is_eligible && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    Eligible for Services
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {person.profile?.email && (
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4 text-gray-400" />
                {person.profile.email}
              </div>
            )}
            {person.profile?.phone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4 text-gray-400" />
                {person.profile.phone}
              </div>
            )}
            {person.profile?.dob && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(person.profile.dob)} (Age: {person.profile.age})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Organization */}
        <InfoCard icon={<Building2 className="h-5 w-5 text-emerald-400" />} title="Organization">
          <InfoRow label="Client" value={person.client_name || person.effective_client_name} />
          {person.is_employee && person.employee_department && (
            <InfoRow label="Department" value={person.employee_department} />
          )}
        </InfoCard>

        {/* Employment/Relationship */}
        {person.is_employee ? (
          <InfoCard icon={<Briefcase className="h-5 w-5 text-emerald-400" />} title="Employment">
            <InfoRow label="Role" value={person.employee_role} />
            <InfoRow label="Status" value={person.employment_status} />
            {person.employment_start_date && (
              <InfoRow label="Start Date" value={formatDate(person.employment_start_date)} />
            )}
            {person.employment_duration && (
              <InfoRow label="Duration" value={`${person.employment_duration} days`} />
            )}
          </InfoCard>
        ) : (
          <InfoCard icon={<Users className="h-5 w-5 text-emerald-400" />} title="Relationship">
            <InfoRow label="Type" value={person.relationship_to_employee} />
            <InfoRow label="Primary Employee" value={person.primary_employee_name} />
            {person.is_employee_dependent && (
              <InfoRow
                label="Also Employee"
                value="Yes"
                icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}
              />
            )}
          </InfoCard>
        )}

        {/* Service Information */}
        <InfoCard icon={<Heart className="h-5 w-5 text-emerald-400" />} title="Services">
          <InfoRow
            label="Eligibility"
            value={person.is_eligible ? 'Eligible' : 'Not Eligible'}
            icon={
              person.is_eligible ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )
            }
          />
          {person.last_service_date && (
            <InfoRow label="Last Service" value={formatDate(person.last_service_date)} />
          )}
          {person.is_minor && (
            <InfoRow
              label="Minor"
              value="Yes"
              icon={<AlertCircle className="h-4 w-4 text-yellow-400" />}
            />
          )}
          {person.requires_consent && (
            <InfoRow
              label="Requires Consent"
              value="Yes"
              icon={<AlertCircle className="h-4 w-4 text-yellow-400" />}
            />
          )}
        </InfoCard>
      </div>

      {/* Emergency Contact */}
      {(person.emergency_contact_name ||
        person.emergency_contact_phone ||
        person.emergency_contact_email) && (
        <InfoCard
          icon={<AlertCircle className="h-5 w-5 text-yellow-400" />}
          title="Emergency Contact"
        >
          <InfoRow label="Name" value={person.emergency_contact_name} />
          <InfoRow label="Phone" value={person.emergency_contact_phone} />
          <InfoRow label="Email" value={person.emergency_contact_email} />
        </InfoCard>
      )}

      {/* Notes */}
      {person.notes && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{person.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
        <div>Created: {formatDate(person.created_at)}</div>
        <div>Last Updated: {formatDate(person.updated_at)}</div>
      </div>
    </div>
  )
}
