/**
 * Session Overview Tab
 *
 * Displays comprehensive session information at a glance
 */

import {
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  Info,
  Stethoscope,
  UserCheck,
  CheckCircle,
  FileText,
} from 'lucide-react'
import { type ServiceSession } from '@/api/services'
import { SessionStatusBadge } from '@/components/ui'
import { formatDateTime, formatDate, formatTime } from '@/utils/formatters'

interface SessionOverviewTabProps {
  session: ServiceSession
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

export function SessionOverviewTab({ session }: SessionOverviewTabProps) {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Session Header */}
      <div className="flex items-start gap-6 bg-white/5 border border-cream-500/10 rounded-lg p-6">
        <div className="shrink-0">
          <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-cream-500/20 to-cream-600/20 border-2 border-cream-500/30 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-cream-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{session.service.name}</h2>
          <p className="text-gray-300 mb-3">{formatDateTime(session.scheduled_at)}</p>
          <div className="flex items-center gap-3 mb-3">
            <SessionStatusBadge status={session.status} />
            {session.is_group_session && (
              <span className="flex items-center gap-1 text-xs text-purple-400">
                <Users className="h-3 w-3" />
                Group Session
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Details */}
        <InfoCard icon={<Info className="h-5 w-5 text-cream-400" />} title="Session Details">
          <InfoRow
            label="Service"
            value={session.service.name}
            icon={<Stethoscope className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Person"
            value={session.person.name}
            icon={<User className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Provider"
            value={session.provider?.name || 'Not assigned'}
            icon={<UserCheck className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow label="Status" value={session.status} />
          <InfoRow
            label="Duration"
            value={session.duration ? `${session.duration} minutes` : 'Not specified'}
            icon={<Clock className="h-4 w-4 text-gray-400" />}
          />
          {session.location && (
            <InfoRow
              label="Location"
              value={session.location}
              icon={<MapPin className="h-4 w-4 text-gray-400" />}
            />
          )}
          <InfoRow
            label="Session Type"
            value={session.is_group_session ? 'Group Session' : 'Individual Session'}
            icon={<Users className="h-4 w-4 text-gray-400" />}
          />
        </InfoCard>

        {/* Timing Information */}
        <InfoCard icon={<Calendar className="h-5 w-5 text-cream-400" />} title="Timing Information">
          <InfoRow
            label="Scheduled Date"
            value={formatDate(session.scheduled_at)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Scheduled Time"
            value={formatTime(session.scheduled_at)}
            icon={<Clock className="h-4 w-4 text-gray-400" />}
          />
          {session.completed_at && (
            <>
              <InfoRow
                label="Completed Date"
                value={formatDate(session.completed_at)}
                icon={<Calendar className="h-4 w-4 text-gray-400" />}
              />
              <InfoRow
                label="Completed Time"
                value={formatTime(session.completed_at)}
                icon={<Clock className="h-4 w-4 text-gray-400" />}
              />
            </>
          )}
          <InfoRow
            label="Created"
            value={formatDate(session.created_at)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="Last Updated"
            value={formatDate(session.updated_at)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          {session.reschedule_count > 0 && (
            <InfoRow
              label="Reschedules"
              value={`${session.reschedule_count} time${session.reschedule_count > 1 ? 's' : ''}`}
            />
          )}
        </InfoCard>
      </div>

      {/* Notes Preview (if exists) */}
      {session.notes && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-cream-400" />
            Session Notes
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{session.notes}</p>
          </div>
        </div>
      )}

      {/* Feedback Preview (if exists) */}
      {session.feedback && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-cream-400" />
            Session Feedback
          </h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{session.feedback}</p>
        </div>
      )}

      {/* Cancellation Info (if cancelled) */}
      {session.cancellation_reason && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-orange-400" />
            Cancellation Reason
          </h3>
          <p className="text-sm text-gray-300">{session.cancellation_reason}</p>
        </div>
      )}

      {/* Additional Metadata (if exists) */}
      {session.metadata && Object.keys(session.metadata).length > 0 && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-cream-400" />
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(session.metadata).map(([key, value]) => (
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
