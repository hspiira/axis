/**
 * Sessions Page
 *
 * Displays and manages service delivery sessions.
 */

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { SessionsTable } from '@/components/sessions/SessionsTable'
import { SessionsFilters } from '@/components/sessions/SessionsFilters'
import { SessionFormModal } from '@/components/sessions/SessionFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useSessions,
  useSearchSessions,
  useDeleteSession,
  useCompleteSession,
  useCancelSession,
  useCreateSession,
  useUpdateSession,
  useSession,
} from '@/hooks/useServices'
import type { ServiceSessionList, ServiceSessionFormData, SessionSearchParams } from '@/api/services'
import { toast } from '@/lib/toast'
import { exportToCSV, formatDateTimeForExport } from '@/utils/export'
import { useURLSearchParams } from '@/hooks/useURLSearchParams'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

type ConfirmAction =
  | { type: 'complete'; session: ServiceSessionList }
  | { type: 'cancel'; session: ServiceSessionList }
  | { type: 'delete'; session: ServiceSessionList }
  | null

export function SessionsPage() {
  const { setPageTitle } = usePageTitle()
  const { params: urlParams, updateParams } = useURLSearchParams<SessionSearchParams>()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<ServiceSessionList | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Initialize filters from URL params
  const filters = urlParams
  const hasFilters = Object.keys(filters).length > 0
  const sessionsQuery = useSearchSessions(filters)
  const allSessionsQuery = useSessions()
  const { data: sessions = [], isLoading } = hasFilters ? sessionsQuery : allSessionsQuery

  const createSession = useCreateSession()
  const updateSession = useUpdateSession()
  const deleteSession = useDeleteSession()
  const completeSession = useCompleteSession()
  const cancelSession = useCancelSession()
  const { data: sessionDetail } = useSession(editingSession?.id || '')

  useEffect(() => {
    setPageTitle('Sessions', 'Manage service delivery sessions')
    return () => setPageTitle(null)
  }, [setPageTitle])

  // Keyboard shortcuts
  useKeyboardShortcut(
    { key: 'n', metaKey: true },
    () => setIsCreateModalOpen(true)
  )
  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      setIsCreateModalOpen(false)
      setEditingSession(null)
    }
  )

  const handleCreate = () => {
    setEditingSession(null)
    setIsCreateModalOpen(true)
  }

  const handleEdit = (session: ServiceSessionList) => {
    setEditingSession(session)
    setIsCreateModalOpen(true)
  }

  const handleDelete = (session: ServiceSessionList) => {
    setConfirmAction({ type: 'delete', session })
  }

  const handleComplete = (session: ServiceSessionList) => {
    setConfirmAction({ type: 'complete', session })
  }

  const handleCancel = (session: ServiceSessionList) => {
    setCancelReason('')
    setConfirmAction({ type: 'cancel', session })
  }

  const handleConfirmAction = async (inputValue?: string) => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'delete') {
        await deleteSession.mutateAsync(confirmAction.session.id)
      } else if (confirmAction.type === 'complete') {
        await completeSession.mutateAsync({ id: confirmAction.session.id })
      } else if (confirmAction.type === 'cancel') {
        const reason = inputValue || cancelReason
        if (!reason.trim()) {
          toast.error('Please provide a cancellation reason')
          return
        }
        await cancelSession.mutateAsync({ id: confirmAction.session.id, reason })
      }
      setConfirmAction(null)
      setCancelReason('')
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  const handleSubmit = async (data: ServiceSessionFormData) => {
    try {
      if (editingSession) {
        await updateSession.mutateAsync({ id: editingSession.id, data })
      } else {
        await createSession.mutateAsync(data)
      }
      setIsCreateModalOpen(false)
      setEditingSession(null)
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  const handleExport = () => {
    setIsExporting(true)
    try {
      const data = sessions.map((session) => ({
        scheduled_at: formatDateTimeForExport(session.scheduled_at),
        service: session.service_name,
        person: session.person_name,
        provider: session.provider_name || '',
        status: session.status,
        duration: session.duration || '',
        type: session.is_group_session ? 'Group' : 'Individual',
        completed_at: session.completed_at ? formatDateTimeForExport(session.completed_at) : '',
        created_at: formatDateTimeForExport(session.created_at),
      }))

      const columns = [
        { key: 'scheduled_at' as const, label: 'Scheduled At' },
        { key: 'service' as const, label: 'Service' },
        { key: 'person' as const, label: 'Person' },
        { key: 'provider' as const, label: 'Provider' },
        { key: 'status' as const, label: 'Status' },
        { key: 'duration' as const, label: 'Duration (min)' },
        { key: 'type' as const, label: 'Type' },
        { key: 'completed_at' as const, label: 'Completed At' },
        { key: 'created_at' as const, label: 'Created Date' },
      ]

      exportToCSV(data, columns, `sessions-${new Date().toISOString().split('T')[0]}.csv`)
      toast.success('Sessions exported successfully')
    } catch (error) {
      toast.error('Failed to export sessions')
    } finally {
      setIsExporting(false)
    }
  }

  const getConfirmMessage = () => {
    if (!confirmAction) return ''

    if (confirmAction.type === 'delete') {
      return `Are you sure you want to delete this session for "${confirmAction.session.person_name}"? This action cannot be undone.`
    } else if (confirmAction.type === 'complete') {
      return `Mark this session as completed for "${confirmAction.session.person_name}"?`
    } else if (confirmAction.type === 'cancel') {
      return `Cancel this session for "${confirmAction.session.person_name}"?`
    }
    return ''
  }

  const getConfirmTitle = () => {
    if (!confirmAction) return ''

    if (confirmAction.type === 'delete') return 'Delete Session'
    if (confirmAction.type === 'complete') return 'Complete Session'
    if (confirmAction.type === 'cancel') return 'Cancel Session'
    return ''
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Filters */}
        <SessionsFilters
          filters={filters}
          onFiltersChange={updateParams}
          onExport={handleExport}
          isExporting={isExporting}
          onCreate={handleCreate}
        />

        {/* Sessions Table */}
        <SessionsTable
          sessions={sessions}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <SessionFormModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setEditingSession(null)
          }}
          onSubmit={handleSubmit}
          initialData={
            editingSession && sessionDetail
              ? {
                  service_id: sessionDetail.service.id,
                  provider_id: sessionDetail.provider?.id || '',
                  person_id: sessionDetail.person.id,
                  scheduled_at: sessionDetail.scheduled_at,
                  status: sessionDetail.status,
                  location: sessionDetail.location || undefined,
                  is_group_session: sessionDetail.is_group_session,
                  notes: sessionDetail.notes || undefined,
                  metadata: sessionDetail.metadata || undefined,
                }
              : undefined
          }
          loading={createSession.isPending || updateSession.isPending}
          title={editingSession ? 'Edit Session' : 'Schedule New Session'}
        />
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => {
            setConfirmAction(null)
            setCancelReason('')
          }}
          onConfirm={handleConfirmAction}
          title={getConfirmTitle()}
          message={getConfirmMessage()}
          confirmText={
            confirmAction.type === 'delete'
              ? 'Delete'
              : confirmAction.type === 'complete'
              ? 'Complete'
              : 'Cancel Session'
          }
          cancelText="Close"
          variant={
            confirmAction.type === 'delete'
              ? 'danger'
              : confirmAction.type === 'complete'
              ? 'success'
              : 'warning'
          }
          requireInput={confirmAction.type === 'cancel'}
          inputLabel={confirmAction.type === 'cancel' ? 'Cancellation Reason' : undefined}
          isLoading={deleteSession.isPending || completeSession.isPending || cancelSession.isPending}
        />
      )}
    </AppLayout>
  )
}
