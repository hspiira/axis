/**
 * Provider Overview Tab
 *
 * Displays comprehensive provider profile and information
 */

import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Star,
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { type ServiceProvider } from '@/api/services'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/utils/formatters'

interface ProviderOverviewTabProps {
  provider: ServiceProvider
}

interface InfoCardProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function InfoCard({ icon, title, children }: InfoCardProps) {
  return (
    <div className="bg-white/5 border border-cream-500/10 rounded-lg p-4">
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

export function ProviderOverviewTab({ provider }: ProviderOverviewTabProps) {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Provider Header */}
      <div className="flex items-start gap-6 bg-white/5 border border-cream-500/10 rounded-lg p-6">
        <div className="flex-shrink-0">
          <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/30 flex items-center justify-center">
            <User className="h-12 w-12 text-purple-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{provider.name}</h2>
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={provider.status} />
            {provider.is_verified && (
              <span className="flex items-center gap-1 text-xs text-cream-400">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
            {provider.is_available && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle className="h-3 w-3" />
                Available
              </span>
            )}
            {provider.rating && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {parseFloat(provider.rating).toFixed(1)} Rating
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {provider.contact_email && (
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4 text-gray-400" />
                {provider.contact_email}
              </div>
            )}
            {provider.contact_phone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4 text-gray-400" />
                {provider.contact_phone}
              </div>
            )}
            {provider.location && (
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400" />
                {provider.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-300">
              <Briefcase className="h-4 w-4 text-gray-400" />
              {provider.type}
            </div>
          </div>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Details */}
        <InfoCard icon={<User className="h-5 w-5 text-cream-400" />} title="Provider Information">
          <InfoRow label="Type" value={provider.type} icon={<Briefcase className="h-4 w-4 text-gray-400" />} />
          <InfoRow label="Status" value={<StatusBadge status={provider.status} size="sm" />} />
          <InfoRow
            label="Verified"
            value={
              provider.is_verified ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Yes
                </span>
              ) : (
                <span className="text-gray-400">No</span>
              )
            }
            icon={<Shield className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Available"
            value={
              provider.is_available ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Yes
                </span>
              ) : (
                <span className="text-gray-400">No</span>
              )
            }
          />
          {provider.rating && (
            <InfoRow
              label="Rating"
              value={`${parseFloat(provider.rating).toFixed(1)} / 5.0`}
              icon={<Star className="h-4 w-4 text-amber-400" />}
            />
          )}
        </InfoCard>

        {/* Contact Information */}
        <InfoCard icon={<Mail className="h-5 w-5 text-cream-400" />} title="Contact Information">
          <InfoRow
            label="Email"
            value={provider.contact_email || 'Not provided'}
            icon={<Mail className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Phone"
            value={provider.contact_phone || 'Not provided'}
            icon={<Phone className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Location"
            value={provider.location || 'Not provided'}
            icon={<MapPin className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Created"
            value={formatDate(provider.created_at)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Last Updated"
            value={formatDate(provider.updated_at)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
        </InfoCard>
      </div>

      {/* Qualifications */}
      {provider.qualifications && Array.isArray(provider.qualifications) && provider.qualifications.length > 0 && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-cream-400" />
            Qualifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {provider.qualifications.map((qual, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-white/5 rounded-lg border border-cream-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white">{typeof qual === 'string' ? qual : JSON.stringify(qual)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specializations */}
      {provider.specializations && Array.isArray(provider.specializations) && provider.specializations.length > 0 && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-cream-400" />
            Specializations
          </h3>
          <div className="flex flex-wrap gap-2">
            {provider.specializations.map((spec, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium"
              >
                {typeof spec === 'string' ? spec : JSON.stringify(spec)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Availability Schedule */}
      {provider.availability && Object.keys(provider.availability).length > 0 && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cream-400" />
            Availability Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(provider.availability).map(([key, value]) => (
              <div key={key}>
                <p className="text-sm text-gray-400 mb-1">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm text-white">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Metadata */}
      {provider.metadata && Object.keys(provider.metadata).length > 0 && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-cream-400" />
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(provider.metadata).map(([key, value]) => (
              <div key={key}>
                <p className="text-sm text-gray-400 mb-1">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm text-white">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
