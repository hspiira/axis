/**
 * Contract Notes Tab
 *
 * Displays and manages notes for this contract
 */

import { StickyNote, Plus, Edit2 } from 'lucide-react'
import { type ContractDetail } from '@/api/contracts'
import { formatDate } from '@/utils/formatters'

interface ContractNotesTabProps {
  contract: ContractDetail
}

export function ContractNotesTab({ contract }: ContractNotesTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Contract Notes</h3>
          <button className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </button>
        </div>

        {/* Main Notes */}
        {contract.notes ? (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-cream-400" />
                  <span className="text-sm font-medium text-white">Contract Notes</span>
                </div>
                <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mt-2">
                {contract.notes}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                Last updated: {formatDate(contract.updated_at)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <StickyNote className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No notes found for this contract</p>
            <p className="text-sm text-gray-500 mt-1">Add notes to track important information</p>
          </div>
        )}
      </div>
    </div>
  )
}

