/**
 * Person Notes Tab
 *
 * Internal notes and observations
 */

import { type PersonDetail } from '@/api/persons'
import { ClipboardList } from 'lucide-react'

interface PersonNotesTabProps {
  person: PersonDetail
}

export function PersonNotesTab({ person }: PersonNotesTabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {person.notes ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-400" />
            Notes
          </h3>
          <p className="text-gray-300 whitespace-pre-wrap">{person.notes}</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <ClipboardList className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No notes available</p>
        </div>
      )}
    </div>
  )
}
