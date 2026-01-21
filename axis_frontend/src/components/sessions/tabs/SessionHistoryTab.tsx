/**
 * Session History Tab
 *
 * Displays session history including status changes and reschedules
 */

import { History, Calendar, Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { type ServiceSession } from '@/api/services'
import { formatDateTime } from '@/utils/formatters'

interface SessionHistoryTabProps {
  session: ServiceSession
}

interface HistoryEvent {
  id: string
  type: 'created' | 'updated' | 'rescheduled' | 'completed' | 'cancelled'
  timestamp: string
  description: string
  icon: React.ReactNode
  color: string
}

export function SessionHistoryTab({ session }: SessionHistoryTabProps) {
  // Build history events from session data
  const events: HistoryEvent[] = []

  // Created event
  events.push({
    id: 'created',
    type: 'created',
    timestamp: session.created_at,
    description: `Session created for ${session.person.name}`,
    icon: <Calendar className="h-4 w-4" />,
    color: 'text-blue-400',
  })

  // Rescheduled events
  if (session.reschedule_count > 0) {
    for (let i = 0; i < session.reschedule_count; i++) {
      events.push({
        id: `reschedule-${i}`,
        type: 'rescheduled',
        timestamp: session.updated_at,
        description: `Session rescheduled`,
        icon: <RefreshCw className="h-4 w-4" />,
        color: 'text-orange-400',
      })
    }
  }

  // Completed event
  if (session.completed_at) {
    events.push({
      id: 'completed',
      type: 'completed',
      timestamp: session.completed_at,
      description: 'Session completed',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-emerald-400',
    })
  }

  // Cancelled event
  if (session.cancellation_reason) {
    events.push({
      id: 'cancelled',
      type: 'cancelled',
      timestamp: session.updated_at,
      description: `Session cancelled: ${session.cancellation_reason}`,
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-400',
    })
  }

  // Updated event (if modified after creation)
  if (session.updated_at !== session.created_at && !session.completed_at && !session.cancellation_reason) {
    events.push({
      id: 'updated',
      type: 'updated',
      timestamp: session.updated_at,
      description: 'Session details updated',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-gray-400',
    })
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Session History</h2>
        <p className="text-sm text-gray-400">
          Timeline of changes and events for this session
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
        <div className="space-y-6">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full bg-white/5 border-2 border-cream-500/30 flex items-center justify-center ${event.color}`}
                >
                  {event.icon}
                </div>
                {index < sortedEvents.length - 1 && (
                  <div className="flex-1 w-px bg-cream-500/10 mt-2" style={{ minHeight: '2rem' }} />
                )}
              </div>

              {/* Event Details */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-medium text-white">{event.description}</h3>
                  <span className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedEvents.length === 0 && (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No history available</p>
          </div>
        )}
      </div>

      {/* Session Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-cream-400" />
            <h3 className="text-sm font-medium text-gray-400">Created</h3>
          </div>
          <p className="text-lg font-semibold text-white">{formatDateTime(session.created_at)}</p>
        </div>

        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-medium text-gray-400">Reschedules</h3>
          </div>
          <p className="text-lg font-semibold text-white">
            {session.reschedule_count} time{session.reschedule_count !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-400">Last Updated</h3>
          </div>
          <p className="text-lg font-semibold text-white">{formatDateTime(session.updated_at)}</p>
        </div>
      </div>
    </div>
  )
}
