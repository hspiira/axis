/**
 * Client Detail Page
 *
 * Dedicated page for viewing client details with full AppLayout support
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Building2, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useClient } from '@/hooks/useClients'
import { ClientDetailTabs } from '@/components/clients/ClientDetailTabs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setPageTitle } = usePageTitle()
  const { data: client, isLoading, error } = useClient(id || '')

  useEffect(() => {
    if (client) {
      setPageTitle(client.name, `Client details for ${client.name}`)
    }
    return () => setPageTitle(null)
  }, [client, setPageTitle])

  const handleEdit = () => {
    if (client) {
      navigate(`/clients?edit=${client.id}`, { replace: false })
    }
  }

  const handleBack = () => {
    navigate('/clients')
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </AppLayout>
    )
  }

  if (error || !client) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <ErrorAlert
            title="Failed to load client"
            message={error instanceof Error ? error.message : 'Client not found'}
            onRetry={() => window.location.reload()}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-gradient-to-b from-black via-gray-950 to-black">
        {/* Header */}
        <div className="bg-gray-950 border-b border-white/10 px-4 lg:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Back to clients"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            {/* Icon */}
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{client.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={client.status} size="sm" />
                {client.industry_name && (
                  <span className="text-sm text-gray-400">• {client.industry_name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Edit client"
            >
              <Edit2 className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="flex-1 overflow-hidden bg-gray-900/50">
          <ClientDetailTabs client={client} onEdit={handleEdit} />
        </div>
      </div>
    </AppLayout>
  )
}

