/**
 * Client Detail Page
 *
 * Full-page view for client details with tabbed navigation
 * URL structure: /clients/:id?tab=:tabId
 */

import { useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Edit2, Download, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/AppLayout'
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/BreadcrumbContext'
import { useClient } from '@/hooks/useClients'
import { ClientDetailTabs } from '@/components/clients/ClientDetailTabs'

// Tab labels mapping
const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  contracts: 'Contracts',
  documents: 'Documents',
  persons: 'Persons',
  activity: 'Activity',
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setBreadcrumbs, setMenuActions } = useBreadcrumbs()

  // Fetch client data
  const { data: client, isLoading, error } = useClient(id || '')

  // Get active tab from URL
  const activeTab = searchParams.get('tab') || 'overview'

  // Handle navigation back to clients list
  const handleBack = () => {
    navigate('/clients')
  }

  // Handle edit navigation
  const handleEdit = useCallback(() => {
    navigate('/clients', { state: { editClientId: id } })
  }, [navigate, id])

  // Set breadcrumbs and menu actions
  useEffect(() => {
    if (client) {
      // Only set breadcrumbs if we're at the client detail level (not nested)
      // Check if we're in a nested route by checking the current path
      const currentPath = window.location.pathname
      const isNestedRoute = currentPath.includes(`/clients/${id}/persons/`)

      if (!isNestedRoute) {
        // Build breadcrumbs with tab awareness
        const breadcrumbsArray: BreadcrumbItem[] = [
          { label: 'Clients', to: '/clients' },
          { label: client.name, to: `/clients/${id}` },
        ]

        // Add current tab if not overview
        if (activeTab !== 'overview') {
          breadcrumbsArray.push({
            label: TAB_LABELS[activeTab] || activeTab,
          })
        }

        setBreadcrumbs(breadcrumbsArray)
      } else {
        // If nested, don't set breadcrumbs - PersonDetailPage will handle it
      }
      setMenuActions([
        {
          label: 'Edit Client',
          icon: <Edit2 className="h-4 w-4" />,
          onClick: handleEdit,
        },
        {
          label: 'Export Data',
          icon: <Download className="h-4 w-4" />,
          onClick: () => {
            // TODO: Implement export functionality
            toast.info('Export functionality coming soon')
          },
          tooltip: 'Export client data to CSV/Excel',
        },
        {
          label: 'Copy ID',
          icon: <Copy className="h-4 w-4" />,
          onClick: async () => {
            await navigator.clipboard.writeText(client.id)
            toast.success('Client ID copied to clipboard')
          },
          tooltip: 'Copy client ID to clipboard',
        },
        {
          label: 'Delete Client',
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => {
            // TODO: Implement delete with confirmation
            toast.error('Delete functionality requires confirmation modal')
          },
          variant: 'danger',
          tooltip: 'Permanently delete this client',
        },
      ])
    }
    return () => {
      // Only clear breadcrumbs if we're actually leaving the client detail page
      // Don't clear if we're navigating to a nested person page
      const currentPath = window.location.pathname
      const isNavigatingToPerson = currentPath.includes(`/clients/${id}/persons/`)

      if (!isNavigatingToPerson) {
        setBreadcrumbs([])
      }
      setMenuActions([])
    }
  }, [client, id, activeTab, setBreadcrumbs, setMenuActions, handleEdit])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading client details...</div>
        </div>
      </AppLayout>
    )
  }

  if (error || !client) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">Failed to load client details</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Back to Clients
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
            <ClientDetailTabs client={client} activeTab={activeTab} onEdit={handleEdit} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
