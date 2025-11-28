/**
 * Documents Page
 *
 * Standalone page for managing documents library
 */

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { FileText, Search, Filter, Download, Upload, Folder, File } from 'lucide-react'

export function DocumentsPage() {
  const { setPageTitle } = usePageTitle()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setPageTitle('Documents', 'Manage your document library')
    return () => setPageTitle(null)
  }, [setPageTitle])

  const documents = []

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-gray-400">Total Documents</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">Folders</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <File className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-400">Recent</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Shared</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name, type, or client..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['Contracts', 'Forms', 'Reports', 'Images', 'Invoices', 'Other'].map((category) => (
            <button
              key={category}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors text-left"
            >
              <Folder className="h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-white">{category}</p>
              <p className="text-xs text-gray-400 mt-1">0 items</p>
            </button>
          ))}
        </div>

        {/* Documents Grid/List */}
        <div className="bg-white/5 border border-white/10 rounded-lg">
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No documents found</h3>
            <p className="text-gray-400 mb-6">Upload your first document to get started</p>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
