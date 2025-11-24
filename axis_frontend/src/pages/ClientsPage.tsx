/**
 * Clients Page
 *
 * Displays and manages client organizations.
 */

import { useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'

export function ClientsPage() {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Client Management', 'Manage client organizations and their contracts')
    return () => setPageTitle(null)
  }, [setPageTitle])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">

        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-purple-400 mb-4 inline-block">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Client Management</h2>
          <p className="text-gray-400 mb-6">
            Client management interface will be implemented here
          </p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all">
            Add New Client
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
