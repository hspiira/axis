/**
 * Contracts Page
 *
 * Displays and manages service provider contracts.
 */

import { AppLayout } from '@/components/AppLayout'

export function ContractsPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Provider Network</h1>
          <p className="text-gray-400">
            Manage service provider contracts and agreements
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-purple-400 mb-4 inline-block">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Provider Network</h2>
          <p className="text-gray-400 mb-6">
            Provider network management interface will be implemented here
          </p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all">
            Add New Provider
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
