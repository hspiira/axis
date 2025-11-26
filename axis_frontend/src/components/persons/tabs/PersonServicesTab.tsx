/**
 * Person Services Tab
 *
 * Service history and eligibility
 */

import { type PersonDetail } from '@/api/persons'
import { Heart, Calendar } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

interface PersonServicesTabProps {
  person: PersonDetail
}

export function PersonServicesTab({ person }: PersonServicesTabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-emerald-400" />
          Service Eligibility
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Eligible for Services</label>
            <p className="text-white font-medium">{person.is_eligible ? 'Yes' : 'No'}</p>
          </div>
          {person.last_service_date && (
            <div>
              <label className="text-sm text-gray-400">Last Service Date</label>
              <p className="text-white font-medium">{formatDate(person.last_service_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder for service history */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Service history will be displayed here</p>
      </div>
    </div>
  )
}
