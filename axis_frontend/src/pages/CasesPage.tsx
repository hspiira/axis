/**
 * Cases Page
 *
 * Displays and manages employee wellness cases.
 */

import { useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Plus } from 'lucide-react'

export function CasesPage() {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Cases Management', 'View and manage employee wellness cases')
    return () => setPageTitle(null)
  }, [setPageTitle])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-emerald-400 mb-4 inline-block">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <button className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" />
            Create Case
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
