/**
 * Bulk Upload Preview Component
 *
 * Displays parsed data with validation errors and allows editing before upload
 */

import { useState } from 'react'
import { ChevronLeft, Upload, AlertCircle, CheckCircle2, XCircle, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientBulkRow } from '@/utils/csvParser'

interface BulkUploadPreviewProps {
  data: ClientBulkRow[]
  validationErrors: Map<number, string[]>
  onEdit: (index: number, field: keyof ClientBulkRow, value: string) => void
  onBack: () => void
  onUpload: () => void
  canUpload: boolean
}

export function BulkUploadPreview({
  data,
  validationErrors,
  onEdit,
  onBack,
  onUpload,
  canUpload,
}: BulkUploadPreviewProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof ClientBulkRow } | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleCellClick = (rowIndex: number, field: keyof ClientBulkRow) => {
    setEditingCell({ row: rowIndex, field })
    setEditValue(String(data[rowIndex][field] || ''))
  }

  const handleCellSave = () => {
    if (editingCell) {
      onEdit(editingCell.row, editingCell.field, editValue)
      setEditingCell(null)
      setEditValue('')
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const totalRows = data.length
  const errorRows = validationErrors.size
  const validRows = totalRows - errorRows

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Rows</div>
          <div className="text-2xl font-bold text-white">{totalRows}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="text-sm text-green-400 mb-1">Valid Rows</div>
          <div className="text-2xl font-bold text-green-400">{validRows}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-sm text-red-400 mb-1">Errors</div>
          <div className="text-2xl font-bold text-red-400">{errorRows}</div>
        </div>
      </div>

      {/* Validation Status */}
      {errorRows > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400 mb-2">
                Please fix {errorRows} error{errorRows !== 1 ? 's' : ''} before uploading
              </h3>
              <div className="space-y-1">
                {Array.from(validationErrors.entries()).map(([index, errors]) => (
                  <div key={index} className="text-sm text-gray-300">
                    {errors.map((error, i) => (
                      <div key={i}>• {error}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {errorRows === 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-sm text-green-400">
              All rows are valid and ready to upload
            </p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Row
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Name *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {data.map((row, index) => {
                const hasErrors = validationErrors.has(index)
                const rowErrors = validationErrors.get(index) || []

                return (
                  <tr
                    key={index}
                    className={cn(
                      'hover:bg-white/5 transition-colors',
                      hasErrors && 'bg-red-500/5'
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-gray-300">{index + 2}</td>
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.field === 'name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cream-500/50"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2 group cursor-pointer"
                          onClick={() => handleCellClick(index, 'name')}
                        >
                          <span className="text-sm text-white">{row.name || '-'}</span>
                          <Edit2 className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.field === 'email' ? (
                        <input
                          type="email"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cream-500/50"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2 group cursor-pointer"
                          onClick={() => handleCellClick(index, 'email')}
                        >
                          <span className="text-sm text-gray-300">{row.email || '-'}</span>
                          <Edit2 className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingCell?.row === index && editingCell?.field === 'phone' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cream-500/50"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2 group cursor-pointer"
                          onClick={() => handleCellClick(index, 'phone')}
                        >
                          <span className="text-sm text-gray-300">{row.phone || '-'}</span>
                          <Edit2 className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {hasErrors ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="text-xs text-red-400">{rowErrors.length} error(s)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            <span className="text-xs text-green-400">Valid</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onUpload}
          disabled={!canUpload}
          className={cn(
            'px-6 py-2 rounded-lg transition-colors flex items-center gap-2',
            canUpload
              ? 'bg-cream-500 text-gray-900 font-medium hover:bg-cream-400'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          )}
        >
          <Upload className="h-4 w-4" />
          Upload {totalRows} Client{totalRows !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}

