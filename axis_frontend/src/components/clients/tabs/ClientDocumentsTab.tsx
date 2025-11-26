/**
 * Client Documents Tab
 *
 * Documents related to this client
 */

import { type ClientDetail } from '@/api/clients'
import { FileText, Upload, Search } from 'lucide-react'

interface ClientDocumentsTabProps {
  client: ClientDetail
}

export function ClientDocumentsTab({ client }: ClientDocumentsTabProps) {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Documents</h3>
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

        {/* Placeholder */}
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No documents found for this client</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload documents to get started
          </p>
        </div>
      </div>
    </div>
  )
}
