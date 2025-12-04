/**
 * Session Notes Tab
 *
 * Displays and allows editing of session notes
 */

import { useState } from 'react'
import { FileText, Save, AlertCircle } from 'lucide-react'
import { type ServiceSession } from '@/api/services'
import { useUpdateSession } from '@/hooks/useServices'
import { formatDateTime } from '@/utils/formatters'

interface SessionNotesTabProps {
  session: ServiceSession
}

export function SessionNotesTab({ session }: SessionNotesTabProps) {
  const [notes, setNotes] = useState(session.notes || '')
  const [isEditing, setIsEditing] = useState(false)
  const updateSessionMutation = useUpdateSession()

  const handleSave = async () => {
    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        data: {
          service_id: session.service.id,
          person_id: session.person.id,
          provider_id: session.provider?.id || '',
          scheduled_at: session.scheduled_at,
          notes,
        },
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  const handleCancel = () => {
    setNotes(session.notes || '')
    setIsEditing(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Session Notes</h2>
          <p className="text-sm text-gray-400">
            Add notes and observations from this session
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateSessionMutation.isPending}
                className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg text-sm font-medium hover:bg-cream-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSessionMutation.isPending ? 'Saving...' : 'Save Notes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg text-sm font-medium hover:bg-cream-400 transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Edit Notes
            </button>
          )}
        </div>
      </div>

      {/* Notes Editor */}
      <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
        {isEditing ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-cream-500/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50"
              placeholder="Enter session notes, observations, and key takeaways..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Notes are private and only visible to authorized staff members.
            </p>
          </div>
        ) : (
          <div>
            {notes ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{notes}</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">No notes added yet</p>
                <p className="text-sm text-gray-500">
                  Click "Edit Notes" to add notes and observations for this session
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-white mb-1">About Session Notes</p>
          <p>
            Session notes help document important observations, progress, and outcomes.
            These notes are confidential and only visible to authorized staff members.
            Last updated: {formatDateTime(session.updated_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
