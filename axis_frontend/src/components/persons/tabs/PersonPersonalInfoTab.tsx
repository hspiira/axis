/**
 * Person Personal Info Tab
 *
 * Detailed personal information
 */

import { type Person } from '@/api/persons'
import { User, Mail, Phone, MapPin, Calendar, Heart } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

interface PersonPersonalInfoTabProps {
  person: Person
}

export function PersonPersonalInfoTab({ person }: PersonPersonalInfoTabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Information */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-cream-400" />
          Profile Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Full Name</label>
            <p className="text-white font-medium">{person.profile?.full_name || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Preferred Name</label>
            <p className="text-white font-medium">{person.profile?.preferred_name || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Date of Birth</label>
            <p className="text-white font-medium">
              {person.profile?.dob ? formatDate(person.profile.dob) : '—'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Age</label>
            <p className="text-white font-medium">{person.profile?.age || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Gender</label>
            <p className="text-white font-medium">{person.profile?.gender || '—'}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-cream-400" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Email</label>
            <p className="text-white font-medium">{person.profile?.email || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Phone</label>
            <p className="text-white font-medium">{person.profile?.phone || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">User Account Email</label>
            <p className="text-white font-medium">{person.user_email || '—'}</p>
          </div>
        </div>
      </div>

      {/* Address Information */}
      {(person.profile?.address || person.profile?.city || person.profile?.country) && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cream-400" />
            Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400">Address</label>
              <p className="text-white font-medium">{person.profile?.address || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">City</label>
              <p className="text-white font-medium">{person.profile?.city || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Country</label>
              <p className="text-white font-medium">{person.profile?.country || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Information (for minors) */}
      {person.guardian_email && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-cream-400" />
            Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Guardian Email</label>
              <p className="text-white font-medium">{person.guardian_email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Requires Consent</label>
              <p className="text-white font-medium">{person.requires_consent ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
