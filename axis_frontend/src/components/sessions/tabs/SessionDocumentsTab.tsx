/**
 * Session Documents Tab
 *
 * Displays documents attached to the session
 */

import { Paperclip, FileText, Download, ExternalLink } from 'lucide-react'
import { type ServiceSession } from '@/api/services'

interface SessionDocumentsTabProps {
  session: ServiceSession
}

export function SessionDocumentsTab({ session }: SessionDocumentsTabProps) {
  // TODO: Implement document fetching when document API is available
  const documents: any[] = []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Session Documents</h2>
        <p className="text-sm text-gray-400">
          Documents and files attached to this session
        </p>
      </div>

      {documents.length > 0 ? (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg divide-y divide-cream-500/10">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cream-500/20 border border-cream-500/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-cream-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{doc.name}</h3>
                  <p className="text-xs text-gray-400">
                    {doc.size} • Uploaded {doc.uploaded_at}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-cream-400 transition-colors">
                  <Download className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-cream-400 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-12 text-center">
          <Paperclip className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No documents attached</p>
          <p className="text-sm text-gray-500">
            Documents related to this session will appear here
          </p>
        </div>
      )}

      {/* Upload Area Placeholder */}
      <div className="bg-white/5 border border-cream-500/10 border-dashed rounded-lg p-8 text-center">
        <Paperclip className="h-8 w-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-400 mb-1">Document upload coming soon</p>
        <p className="text-xs text-gray-500">
          Attach relevant documents, forms, or files to this session
        </p>
      </div>
    </div>
  )
}
