/**
 * Service Overview Tab
 *
 * Displays key information about a service at a glance
 */

import {
  Stethoscope,
  Clock,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  Tag,
  FileText,
  Info,
} from 'lucide-react'
import { type Service } from '@/api/services'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/utils/formatters'

interface ServiceOverviewTabProps {
  service: Service
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

export function ServiceOverviewTab({ service }: ServiceOverviewTabProps) {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Service Header */}
      <div className="flex items-start gap-6 bg-white/5 border border-cream-500/10 rounded-lg p-6">
        <div className="shrink-0">
          <div className="h-24 w-24 rounded-lg bg-linear-to-br from-cream-500/20 to-cream-600/20 border-2 border-cream-500/30 flex items-center justify-center">
            <Stethoscope className="h-12 w-12 text-cream-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{service.name}</h2>
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={service.status} />
            {service.is_billable && (
              <span className="flex items-center gap-1 text-xs text-cream-400">
                <DollarSign className="h-3 w-3" />
                Billable
              </span>
            )}
            {service.requires_provider && (
              <span className="flex items-center gap-1 text-xs text-purple-400">
                <Users className="h-3 w-3" />
                Requires Provider
              </span>
            )}
          </div>
          {service.description && (
            <p className="text-sm text-gray-300 leading-relaxed">{service.description}</p>
          )}
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Details */}
        <InfoCard icon={<Info className="h-5 w-5 text-cream-400" />} title="Service Details">
          <InfoRow
            label="Category"
            value={service.category?.name || 'Uncategorized'}
            icon={<Tag className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow label="Status" value={<StatusBadge status={service.status} />} />
          <InfoRow
            label="Duration"
            value={service.duration_minutes ? `${service.duration_minutes} minutes` : 'Not specified'}
            icon={<Clock className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Default Price"
            value={service.default_price ? `$${service.default_price}` : 'Not set'}
            icon={<DollarSign className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Billable"
            value={
              service.is_billable ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Yes
                </span>
              ) : (
                <span className="text-gray-400">No</span>
              )
            }
          />
          <InfoRow
            label="Requires Provider"
            value={
              service.requires_provider ? (
                <span className="text-purple-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Yes
                </span>
              ) : (
                <span className="text-gray-400">No</span>
              )
            }
          />
        </InfoCard>

        {/* Session Configuration */}
        <InfoCard icon={<Calendar className="h-5 w-5 text-cream-400" />} title="Session Configuration">
          <InfoRow
            label="Max Sessions Per Person"
            value={service.max_sessions_per_person || 'Unlimited'}
            icon={<Users className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Created"
            value={formatDate(service.created_at)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Last Updated"
            value={formatDate(service.updated_at)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
        </InfoCard>
      </div>

      {/* Category Details (if exists) */}
      {service.category && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-cream-400" />
            Category Information
          </h3>
          <div className="space-y-2">
            <InfoRow label="Category Name" value={service.category.name} />
            {service.category.description && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-sm text-white">{service.category.description}</p>
              </div>
            )}
            {service.category.parent && (
              <InfoRow label="Parent Category" value={service.category.parent.name} />
            )}
          </div>
        </div>
      )}

      {/* Additional Metadata (if exists) */}
      {service.metadata && Object.keys(service.metadata).length > 0 && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-cream-400" />
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(service.metadata).map(([key, value]) => (
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
