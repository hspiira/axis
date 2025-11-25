/**
 * Bulk Actions Toolbar Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle bulk selection and actions UI
 * - Open/Closed: Extensible with additional bulk operations
 */

import { Power, Archive, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkActivate: () => void
  onBulkDeactivate: () => void
  onBulkArchive: () => void
  onBulkDelete: () => void
  isProcessing?: boolean
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkArchive,
  onBulkDelete,
  isProcessing = false,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Selection Count */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {selectedCount} {selectedCount === 1 ? 'client' : 'clients'} selected
            </span>
            <button
              onClick={onClearSelection}
              disabled={isProcessing}
              className={cn(
                'p-1 rounded hover:bg-white/10 transition-colors',
                isProcessing ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'
              )}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBulkActivate}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isProcessing
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              )}
            >
              <Power className="h-4 w-4" />
              Activate
            </button>

            <button
              onClick={onBulkDeactivate}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isProcessing
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              )}
            >
              <Power className="h-4 w-4" />
              Deactivate
            </button>

            <button
              onClick={onBulkArchive}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isProcessing
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              )}
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>

            <button
              onClick={onBulkDelete}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isProcessing
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              )}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
              <span className="text-xs text-gray-400">Processing bulk operation...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
