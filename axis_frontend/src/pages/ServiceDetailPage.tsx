/**
 * Service Detail Page
 *
 * Full-page view for service details with tabbed navigation
 * URL structure: /services/:id?tab=:tabId
 */

import { useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Edit2, Archive, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/AppLayout'
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/BreadcrumbContext'
import { useService, useUpdateService } from '@/hooks/useServices'
import { ServiceDetailTabs } from '@/components/services/ServiceDetailTabs'
import { ServiceStatus } from '@/api/services'

// Tab labels mapping
const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  assignments: 'Assignments',
  sessions: 'Sessions',
  statistics: 'Statistics',
}

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setBreadcrumbs, setMenuActions } = useBreadcrumbs()

  // Fetch service data
  const { data: service, isLoading, error } = useService(id || '')
  const updateServiceMutation = useUpdateService()

  // Get active tab from URL
  const activeTab = searchParams.get('tab') || 'overview'

  // Handle navigation back to services list
  const handleBack = () => {
    navigate('/services')
  }

  // Handle edit navigation
  const handleEdit = useCallback(() => {
    navigate('/services', { state: { editServiceId: id } })
  }, [navigate, id])

  // Handle archive/activate
  const handleToggleStatus = useCallback(async () => {
    if (!service) return

    const newStatus = service.status === ServiceStatus.ACTIVE ? ServiceStatus.ARCHIVED : ServiceStatus.ACTIVE
    const action = newStatus === ServiceStatus.ARCHIVED ? 'archive' : 'activate'

    try {
      await updateServiceMutation.mutateAsync({
        id: service.id,
        data: {
          name: service.name,
          status: newStatus,
          description: service.description || undefined,
          category_id: service.category?.id || undefined,
          duration_minutes: service.duration_minutes || undefined,
          default_price: service.default_price || undefined,
          is_billable: service.is_billable,
          requires_provider: service.requires_provider,
          max_sessions_per_person: service.max_sessions_per_person || undefined,
          metadata: service.metadata || undefined,
        },
      })
      toast.success(`Service ${action}d successfully`)
    } catch (error) {
      toast.error(`Failed to ${action} service`)
      console.error(`Error ${action}ing service:`, error)
    }
  }, [service, updateServiceMutation])

  // Set breadcrumbs and menu actions
  useEffect(() => {
    if (!service) return

    // Build breadcrumbs with tab awareness
    const breadcrumbsArray: BreadcrumbItem[] = [
      { label: 'Services', to: '/services' },
      { label: service.name, to: `/services/${id}` },
    ]

    // Add current tab if not overview
    if (activeTab !== 'overview') {
      breadcrumbsArray.push({
        label: TAB_LABELS[activeTab] || activeTab,
      })
    }

    setBreadcrumbs(breadcrumbsArray)

    setMenuActions([
      {
        label: 'Edit Service',
        icon: <Edit2 className="h-4 w-4" />,
        onClick: handleEdit,
      },
      {
        label: service.status === ServiceStatus.ACTIVE ? 'Archive Service' : 'Activate Service',
        icon: <Archive className="h-4 w-4" />,
        onClick: handleToggleStatus,
        variant: service.status === ServiceStatus.ACTIVE ? 'danger' : undefined,
        loading: updateServiceMutation.isPending,
      },
    ])

    return () => {
      setBreadcrumbs([])
      setMenuActions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id, service?.name, service?.status, activeTab, updateServiceMutation.isPending])

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-cream-500" />
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error || !service) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Service Not Found</h2>
            <p className="text-gray-400 mb-4">
              {error instanceof Error ? error.message : 'The service you are looking for does not exist.'}
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 transition-colors"
            >
              Back to Services
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6">
        <ServiceDetailTabs service={service} activeTab={activeTab} />
      </div>
    </AppLayout>
  )
}
