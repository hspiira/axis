/**
 * Person Documents Tab
 *
 * Document management for persons
 */

import { type PersonDetail } from '@/api/persons'
import { FileText } from 'lucide-react'

interface PersonDocumentsTabProps {
  person: PersonDetail
}

export function PersonDocumentsTab({ person }: PersonDocumentsTabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Document management will be available soon</p>
      </div>
    </div>
  )
}
