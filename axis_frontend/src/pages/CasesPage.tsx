/**
 * Cases Page
 *
 * Displays and manages employee wellness cases.
 */

import { AppLayout } from '@/components/AppLayout'

export function CasesPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Cases Management</h1>
          <p className="text-gray-400">
            View and manage employee wellness cases
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-purple-400 mb-4 inline-block">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cases Management</h2>
          <p className="text-gray-400 mb-6">
            Case management interface will be implemented here
          </p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all">
            Create New Case
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
