/**
 * Person Detail Page
 *
 * Full-page view for person details with tabbed navigation
 * URL structure: /persons/:id?tab=:tabId
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Edit2, Download, Copy, Trash2 } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { useBreadcrumbs } from '@/contexts/BreadcrumbContext'
import { personsApi, type PersonDetail } from '@/api/persons'
import { PersonDetailTabs } from '@/components/persons/PersonDetailTabs'

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setBreadcrumbs, setMenuActions } = useBreadcrumbs()

  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch person data
  useEffect(() => {
    if (!id) return

    const fetchPerson = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await personsApi.get(id)
        setPerson(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load person'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPerson()
  }, [id])

  // Get active tab from URL
  const activeTab = searchParams.get('tab') || 'overview'

  // Handle navigation back to persons list
  const handleBack = () => {
    navigate('/persons')
  }

  // Handle edit navigation (placeholder - implement when edit functionality is ready)
  const handleEdit = useCallback(() => {
    // TODO: Implement edit navigation when person edit modal is ready
    console.log('Edit person:', id)
  }, [id])

  // Set breadcrumbs and menu actions
  useEffect(() => {
    if (person) {
      const personName = person.profile?.full_name || 'Unknown Person'
      setBreadcrumbs([
        { label: 'Persons', to: '/persons' },
        { label: personName },
      ])
      setMenuActions([
        {
          label: 'Edit Person',
          icon: <Edit2 className="h-4 w-4" />,
          onClick: handleEdit,
        },
        {
          label: 'Export Data',
          icon: <Download className="h-4 w-4" />,
          onClick: () => {
            // TODO: Implement export functionality
            console.log('Export person data:', person.id)
          },
        },
        {
          label: 'Copy ID',
          icon: <Copy className="h-4 w-4" />,
          onClick: () => {
            navigator.clipboard.writeText(person.id)
            // TODO: Show toast notification
          },
        },
        {
          label: 'Delete Person',
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => {
            // TODO: Implement delete with confirmation
            console.log('Delete person:', person.id)
          },
          variant: 'danger',
        },
      ])
    }
    return () => {
      setBreadcrumbs([])
      setMenuActions([])
    }
  }, [person, setBreadcrumbs, setMenuActions, handleEdit])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading person details...</div>
        </div>
      </AppLayout>
    )
  }

  if (error || !person) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">Failed to load person details</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Back to Persons
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col" key={id}>
        {/* Tabbed Content */}
        <div className="flex-1 overflow-hidden bg-gray-900/50">
          <div className="max-w-7xl mx-auto h-full">
            <PersonDetailTabs person={person} activeTab={activeTab} onEdit={handleEdit} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
