/**
 * Service Provider Detail Page
 *
 * Full-page view for service provider details with tabbed navigation
 * URL structure: /service-providers/:id?tab=:tabId
 */

import { useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Edit2, Shield, ShieldOff, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/AppLayout'
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/BreadcrumbContext'
import { useProvider, useUpdateProvider } from '@/hooks/useServices'
import { ServiceProviderDetailTabs } from '@/components/service-providers/ServiceProviderDetailTabs'

// Tab labels mapping
const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  sessions: 'Sessions',
  ratings: 'Ratings',
  availability: 'Availability',
}

export function ServiceProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setBreadcrumbs, setMenuActions } = useBreadcrumbs()

  // Fetch provider data
  const { data: provider, isLoading, error } = useProvider(id || '')
  const updateProviderMutation = useUpdateProvider()

  // Get active tab from URL
  const activeTab = searchParams.get('tab') || 'overview'

  // Handle navigation back to providers list
  const handleBack = () => {
    navigate('/service-providers')
  }

  // Handle edit navigation
  const handleEdit = useCallback(() => {
    navigate('/service-providers', { state: { editProviderId: id } })
  }, [navigate, id])

  // Handle verification toggle
  const handleToggleVerification = useCallback(async () => {
    if (!provider) return

    try {
      await updateProviderMutation.mutateAsync({
        id: provider.id,
        data: {
          name: provider.name,
          type: provider.type,
          contact_email: provider.contact_email || undefined,
          contact_phone: provider.contact_phone || undefined,
          location: provider.location || undefined,
          qualifications: provider.qualifications || undefined,
          specializations: provider.specializations || undefined,
          availability: provider.availability || undefined,
          rating: provider.rating || undefined,
          is_verified: !provider.is_verified,
          status: provider.status,
          metadata: provider.metadata || undefined,
        },
      })
      toast.success(`Provider ${provider.is_verified ? 'unverified' : 'verified'} successfully`)
    } catch (error) {
      toast.error('Failed to update verification status')
      console.error('Error updating verification:', error)
    }
  }, [provider, updateProviderMutation])

  // Set breadcrumbs and menu actions
  useEffect(() => {
    if (!provider) return

    // Build breadcrumbs with tab awareness
    const breadcrumbsArray: BreadcrumbItem[] = [
      { label: 'Service Providers', to: '/service-providers' },
      { label: provider.name, to: `/service-providers/${id}` },
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
        label: 'Edit Provider',
        icon: <Edit2 className="h-4 w-4" />,
        onClick: handleEdit,
      },
      {
        label: provider.is_verified ? 'Remove Verification' : 'Verify Provider',
        icon: provider.is_verified ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />,
        onClick: handleToggleVerification,
        loading: updateProviderMutation.isPending,
      },
    ])

    return () => {
      setBreadcrumbs([])
      setMenuActions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.id, provider?.name, provider?.is_verified, activeTab, updateProviderMutation.isPending])

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
  if (error || !provider) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Service Provider Not Found</h2>
            <p className="text-gray-400 mb-4">
              {error instanceof Error ? error.message : 'The service provider you are looking for does not exist.'}
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 transition-colors"
            >
              Back to Service Providers
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6">
        <ServiceProviderDetailTabs provider={provider} activeTab={activeTab} />
      </div>
    </AppLayout>
  )
}
