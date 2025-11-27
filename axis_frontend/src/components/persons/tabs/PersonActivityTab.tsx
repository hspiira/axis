/**
 * Person Activity Tab
 *
 * Audit trail and activity history
 */

import { type Person } from '@/api/persons'
import { Activity, Calendar } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

interface PersonActivityTabProps {
  person: Person
}

export function PersonActivityTab({ person }: PersonActivityTabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Timeline placeholder */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          Activity Timeline
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-emerald-500 rounded-full"></div>
            <div>
              <p className="text-sm text-white">Person created</p>
              <p className="text-xs text-gray-400">{formatDate(person.created_at)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm text-white">Last updated</p>
              <p className="text-xs text-gray-400">{formatDate(person.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Detailed activity history will be available soon</p>
      </div>
    </div>
  )
}
