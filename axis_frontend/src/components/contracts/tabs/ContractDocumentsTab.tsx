/**
 * Contract Documents Tab
 *
 * Displays documents related to this contract
 */

import { FileText, Upload, Search, Download, Eye } from 'lucide-react'
import { type ContractDetail } from '@/api/contracts'

interface ContractDocumentsTabProps {
  contract: ContractDetail
}

export function ContractDocumentsTab({ contract }: ContractDocumentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Contract Documents</h3>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Contract Document Link */}
        {contract.document_url && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">Contract Document</p>
                  {contract.signed_by && (
                    <p className="text-xs text-gray-400">
                      Signed by {contract.signed_by}
                      {contract.signed_at && ` on ${new Date(contract.signed_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={contract.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  View
                </a>
                <a
                  href={contract.document_url}
                  download
                  className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder */}
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No additional documents found for this contract</p>
          <p className="text-sm text-gray-500 mt-1">Upload documents to get started</p>
        </div>
      </div>
    </div>
  )
}

