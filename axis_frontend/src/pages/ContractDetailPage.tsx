/**
 * Contract Detail Page
 *
 * Full-page view for contract details with tabbed navigation
 * URL structure: /contracts/:id?tab=:tabId
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Edit2, Download, Copy, Trash2, FileCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/AppLayout'
import { useBreadcrumbs, type BreadcrumbItem, type MenuAction } from '@/contexts/BreadcrumbContext'
import { contractsApi, type ContractDetail } from '@/api/contracts'
import { ContractDetailTabs } from '@/components/contracts/ContractDetailTabs'

// Tab labels mapping
const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  billing: 'Billing',
  documents: 'Documents',
  notes: 'Notes',
  activity: 'Activity',
}

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setBreadcrumbs, setMenuActions } = useBreadcrumbs()

  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch contract data
  useEffect(() => {
    if (!id) return

    const fetchContract = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await contractsApi.get(id)
        setContract(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load contract'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchContract()
  }, [id])

  // Get active tab from URL
  const activeTab = searchParams.get('tab') || 'overview'

  // Handle navigation back
  const handleBack = () => {
    navigate('/contracts')
  }

  // Handle edit navigation
  const handleEdit = useCallback(() => {
    // TODO: Implement edit navigation when contract edit modal is ready
    console.log('Edit contract:', id)
  }, [id])

  // Handle activate contract
  const handleActivate = useCallback(async () => {
    if (!id) return
    try {
      const updatedContract = await contractsApi.activate(id)
      setContract(updatedContract)
      toast.success('Contract activated successfully')
    } catch (err) {
      toast.error('Failed to activate contract')
    }
  }, [id])

  // Handle terminate contract
  const handleTerminate = useCallback(async () => {
    if (!id) return
    // TODO: Show confirmation modal with reason input
    const reason = prompt('Please provide a reason for termination:')
    if (!reason) return

    try {
      const updatedContract = await contractsApi.terminate(id, reason)
      setContract(updatedContract)
      toast.success('Contract terminated successfully')
    } catch (err) {
      toast.error('Failed to terminate contract')
    }
  }, [id])

  // Set breadcrumbs and menu actions
  useEffect(() => {
    if (contract) {
      const contractLabel = contract.client?.name || 'Contract'

      // Build breadcrumbs with tab awareness
      const breadcrumbsArray: BreadcrumbItem[] = [
        { label: 'Contracts', to: '/contracts' },
        { label: contractLabel, to: `/contracts/${id}` },
      ]

      // Add current tab if not overview
      if (activeTab !== 'overview') {
        breadcrumbsArray.push({
          label: TAB_LABELS[activeTab] || activeTab,
        })
      }

      setBreadcrumbs(breadcrumbsArray)

      // Build menu actions based on contract status
      const actions: MenuAction[] = [
        {
          label: 'Edit Contract',
          icon: <Edit2 className="h-4 w-4" />,
          onClick: handleEdit,
        },
        {
          label: 'Export Data',
          icon: <Download className="h-4 w-4" />,
          onClick: () => {
            toast.info('Export functionality coming soon')
          },
          tooltip: 'Export contract data to CSV/Excel',
        },
        {
          label: 'Copy ID',
          icon: <Copy className="h-4 w-4" />,
          onClick: async () => {
            await navigator.clipboard.writeText(contract.id)
            toast.success('Contract ID copied to clipboard')
          },
          tooltip: 'Copy contract ID to clipboard',
        },
      ]

      // Add status-specific actions
      if (contract.status !== 'Active') {
        actions.push({
          label: 'Activate Contract',
          icon: <FileCheck className="h-4 w-4" />,
          onClick: handleActivate,
          tooltip: 'Activate this contract',
        })
      }

      if (contract.status === 'Active') {
        actions.push({
          label: 'Terminate Contract',
          icon: <XCircle className="h-4 w-4" />,
          onClick: handleTerminate,
          variant: 'danger' as const,
          tooltip: 'Terminate this contract',
        })
      }

      actions.push({
        label: 'Delete Contract',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => {
          toast.error('Delete functionality requires confirmation modal')
        },
        variant: 'danger' as const,
        tooltip: 'Permanently delete this contract',
      })

      setMenuActions(actions)
    }
    return () => {
      setBreadcrumbs([])
      setMenuActions([])
    }
  }, [
    contract,
    activeTab,
    setBreadcrumbs,
    setMenuActions,
    handleEdit,
    handleActivate,
    handleTerminate,
    id,
  ])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading contract details...</div>
        </div>
      </AppLayout>
    )
  }

  if (error || !contract) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">Failed to load contract details</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Back to Contracts
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
            <ContractDetailTabs contract={contract} activeTab={activeTab} onEdit={handleEdit} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
