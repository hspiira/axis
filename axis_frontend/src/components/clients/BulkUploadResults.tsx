/**
 * Bulk Upload Results Component
 *
 * Displays upload results with success/failure breakdown
 */

import { CheckCircle2, XCircle, AlertCircle, Upload, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadResult {
  row: number
  success: boolean
  message?: string
  data?: any
}

interface BulkUploadResultsProps {
  results: UploadResult[]
  onClose: () => void
  onUploadMore: () => void
}

export function BulkUploadResults({
  results,
  onClose,
  onUploadMore,
}: BulkUploadResultsProps) {
  const total = results.length
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

  const handleDownloadReport = () => {
    // Generate CSV report
    const headers = ['Row', 'Status', 'Message', 'Client ID', 'Client Name']
    const rows = results.map((r) => [
      r.row,
      r.success ? 'Success' : 'Failed',
      r.message || '',
      r.data?.id || '',
      r.data?.name || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk_upload_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Processed</div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="text-sm text-green-400 mb-1">Successful</div>
          <div className="text-2xl font-bold text-green-400">{successful}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-sm text-red-400 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-400">{failed}</div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-white">{successRate}%</p>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/10"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(successRate / 100) * 251.2} 251.2`}
                className={cn(
                  'transition-all duration-500',
                  successRate >= 80 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{successRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      {failed > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400 mb-2">
                {failed} row{failed !== 1 ? 's' : ''} failed to upload
              </h3>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results
              .filter((r) => !r.success)
              .map((result) => (
                <div
                  key={result.row}
                  className="bg-white/5 border border-white/10 rounded p-3 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white font-medium">Row {result.row}</p>
                      <p className="text-gray-400">{result.message || 'Unknown error'}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {successful > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-400 mb-2">
                {successful} client{successful !== 1 ? 's' : ''} created successfully
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={handleDownloadReport}
          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Report
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onUploadMore}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload More
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

