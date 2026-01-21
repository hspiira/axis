/**
 * Session Detail Page
 *
 * Displays comprehensive information about a service session including
 * details, notes, feedback, documents, and history.
 */

import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { Edit2, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { useSession, useUpdateSession, useCompleteSession, useCancelSession } from '@/hooks/useServices'
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/BreadcrumbContext'
import { SessionDetailTabs } from '@/components/sessions/SessionDetailTabs'
import { SessionStatus } from '@/api/services'
import { formatDateTime } from '@/utils/formatters'

type TabId = 'overview' | 'notes' | 'feedback' | 'documents' | 'history'

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  notes: 'Notes',
  feedback: 'Feedback',
  documents: 'Documents',
  history: 'History',
}

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data: session, isLoading, error } = useSession(id || '')
  const completeSessionMutation = useCompleteSession()
  const cancelSessionMutation = useCancelSession()

  const activeTab = (searchParams.get('tab') as TabId) || 'overview'

  const { setBreadcrumbs, setMenuActions } = useBreadcrumbs()

  // Set breadcrumbs and menu actions
  useEffect(() => {
    if (!session) return

    const breadcrumbsArray: BreadcrumbItem[] = [
      { label: 'Sessions', to: '/sessions' },
      { label: `${session.service.name} - ${formatDateTime(session.scheduled_at)}`, to: `/sessions/${id}` },
    ]

    if (activeTab !== 'overview') {
      breadcrumbsArray.push({ label: TAB_LABELS[activeTab] || activeTab })
    }

    setBreadcrumbs(breadcrumbsArray)

    const actions = [
      {
        label: 'Edit Session',
        icon: <Edit2 className="h-4 w-4" />,
        onClick: handleEdit,
      },
    ]

    // Add Complete action for scheduled/rescheduled sessions
    if (session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.RESCHEDULED) {
      actions.push({
        label: 'Complete Session',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: handleComplete,
      })
    }

    // Add Cancel action for scheduled/rescheduled sessions
    if (session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.RESCHEDULED) {
      actions.push({
        label: 'Cancel Session',
        icon: <XCircle className="h-4 w-4" />,
        onClick: handleCancel,
        variant: 'danger' as const,
      })
    }

    // Add Reschedule action for scheduled/rescheduled sessions
    if (session.status === SessionStatus.SCHEDULED || session.status === SessionStatus.RESCHEDULED) {
      actions.push({
        label: 'Reschedule',
        icon: <Calendar className="h-4 w-4" />,
        onClick: handleReschedule,
      })
    }

    setMenuActions(actions)

    return () => {
      setBreadcrumbs([])
      setMenuActions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.service?.name, session?.status, activeTab])

  const handleEdit = useCallback(() => {
    // TODO: Open edit modal
    console.log('Edit session:', session?.id)
  }, [session])

  const handleComplete = useCallback(async () => {
    if (!session) return

    try {
      await completeSessionMutation.mutateAsync({ id: session.id })
      navigate('/sessions')
    } catch (error) {
      console.error('Failed to complete session:', error)
    }
  }, [session, completeSessionMutation, navigate])

  const handleCancel = useCallback(async () => {
    if (!session) return

    try {
      await cancelSessionMutation.mutateAsync({
        id: session.id,
        reason: 'Cancelled by user',
      })
      navigate('/sessions')
    } catch (error) {
      console.error('Failed to cancel session:', error)
    }
  }, [session, cancelSessionMutation, navigate])

  const handleReschedule = useCallback(() => {
    if (!session) return
    // TODO: Open reschedule modal
    console.log('Reschedule session:', session.id)
  }, [session])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-cream-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">Failed to load session</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : 'Session not found'}
        </p>
      </div>
    )
  }

  return <SessionDetailTabs session={session} activeTab={activeTab} />
}
