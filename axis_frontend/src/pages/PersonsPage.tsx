/**
 * Persons Page
 *
 * Displays and manages persons (employees and dependents).
 */

import { useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Users } from 'lucide-react'

export function PersonsPage() {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Persons Management', 'View and manage employees and dependents')
    return () => setPageTitle(null)
  }, [setPageTitle])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-emerald-400 mb-4 inline-block">
            <Users className="h-16 w-16" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Persons Management</h2>
          <p className="text-gray-400 mb-6">
            Manage employees and their dependents receiving EAP services
          </p>
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all">
            Add New Person
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

