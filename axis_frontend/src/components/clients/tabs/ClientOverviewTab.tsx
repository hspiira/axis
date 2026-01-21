/**
 * Client Overview Tab
 *
 * Displays key information about a client at a glance
 */

import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { type ClientDetail } from '@/api/clients'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/utils/formatters'

interface ClientOverviewTabProps {
  client: ClientDetail
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
  link?: boolean
}

function InfoRow({ label, value, icon, link }: InfoRowProps) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        {link && value ? (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cream-400 font-medium hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm text-white font-medium">{value || '—'}</span>
        )}
      </div>
    </div>
  )
}

export function ClientOverviewTab({ client }: ClientOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex items-start gap-6 bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex-shrink-0">
          <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-cream-500/20 to-cream-600/20 border-2 border-cream-500/30 flex items-center justify-center">
            <Building2 className="h-12 w-12 text-cream-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{client.name}</h2>
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={client.status} />
            {client.is_verified && (
              <span className="flex items-center gap-1 text-xs text-cream-400">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {client.email && (
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4 text-gray-400" />
                {client.email}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4 text-gray-400" />
                {client.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Information */}
        <InfoCard icon={<Building2 className="h-5 w-5 text-cream-400" />} title="Basic Information">
          <InfoRow label="Industry" value={client.industry?.name || client.industry_name} />
          <InfoRow label="Tax ID" value={client.tax_id} />
          {client.website && <InfoRow label="Website" value={client.website} link icon={<Globe className="h-4 w-4" />} />}
        </InfoCard>

        {/* Contact Information */}
        <InfoCard icon={<Mail className="h-5 w-5 text-cream-400" />} title="Contact Person">
          <InfoRow label="Name" value={client.contact_person} />
          <InfoRow label="Email" value={client.contact_email} icon={<Mail className="h-4 w-4" />} />
          <InfoRow label="Phone" value={client.contact_phone} icon={<Phone className="h-4 w-4" />} />
          <InfoRow label="Method" value={client.preferred_contact_method} />
        </InfoCard>

        {/* Business Stats */}
        <InfoCard icon={<Briefcase className="h-5 w-5 text-cream-400" />} title="Business Stats">
          <InfoRow label="Active Contracts" value={client.active_contracts_count} />
          <InfoRow label="Total Employees" value={client.total_employees} />
          <InfoRow label="Timezone" value={client.timezone} />
        </InfoCard>
      </div>

      {/* Location Information */}
      <InfoCard icon={<MapPin className="h-5 w-5 text-cream-400" />} title="Location">
        {client.address && (
          <div className="mb-2">
            <span className="text-sm text-gray-400">Address</span>
            <p className="text-sm text-white font-medium">{client.address}</p>
          </div>
        )}
        {client.billing_address && (
          <div>
            <span className="text-sm text-gray-400">Billing Address</span>
            <p className="text-sm text-white font-medium">{client.billing_address}</p>
          </div>
        )}
      </InfoCard>

      {/* Notes */}
      {client.notes && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
        <div>Created: {formatDate(client.created_at)}</div>
        <div>Last Updated: {formatDate(client.updated_at)}</div>
      </div>
    </div>
  )
}
