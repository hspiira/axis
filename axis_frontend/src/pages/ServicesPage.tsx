/**
 * Services Page
 *
 * Displays and manages EAP services and sessions.
 */

import { useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Stethoscope, Plus } from 'lucide-react'

export function ServicesPage() {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Services Management', 'View and manage EAP services and sessions')
    return () => setPageTitle(null)
  }, [setPageTitle])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-emerald-400 mb-4 inline-block">
            <Stethoscope className="h-16 w-16" />
          </div>
          <button className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" />
            Create Service
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

