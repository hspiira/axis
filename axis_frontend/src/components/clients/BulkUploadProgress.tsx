/**
 * Bulk Upload Progress Component
 *
 * Shows upload progress with percentage and status
 */

import { Loader2 } from 'lucide-react'

interface BulkUploadProgressProps {
  total: number
  progress: number
}

export function BulkUploadProgress({ total, progress }: BulkUploadProgressProps) {
  const processed = Math.round((progress / 100) * total)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-cream-400 animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Uploading Clients</h3>
        <p className="text-sm text-gray-400">
          Please wait while we process your upload...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">
            {processed} / {total} ({Math.round(progress)}%)
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className="bg-cream-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-300">
          Processing row {processed} of {total}...
        </p>
      </div>
    </div>
  )
}

