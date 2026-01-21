/**
 * Person Detail Modal Component
 *
 * Full-screen modal with tabbed navigation for person details
 */

import { useState, useEffect } from 'react'
import { X, Edit2, Loader2 } from 'lucide-react'
import { personsApi, type Person } from '@/api/persons'
import { PersonDetailTabs } from './PersonDetailTabs'

interface PersonDetailModalProps {
  personId: string
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
}

export function PersonDetailModal({ personId, isOpen, onClose, onEdit }: PersonDetailModalProps) {
  const [person, setPerson] = useState<Person | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchPerson = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await personsApi.get(personId)
        setPerson(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load person details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPerson()
  }, [personId, isOpen])

  if (!isOpen) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-[2px] flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-12 border border-white/10">
          <Loader2 className="h-12 w-12 text-cream-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading person details...</p>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-white/10">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 mb-4">
            {error || 'Person not found'}
          </div>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-[2px] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {person.profile?.image ? (
            <img
              src={person.profile.image}
              alt={person.profile.full_name}
              className="h-12 w-12 rounded-full object-cover border-2 border-cream-500/30"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cream-500/20 to-cream-600/20 border-2 border-cream-500/30 flex items-center justify-center">
              <span className="text-lg font-bold text-cream-400">
                {person.profile?.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || '??'}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">
              {person.profile?.full_name || 'Unknown'}
            </h2>
            <p className="text-sm text-gray-400">
              {person.person_type === 'ClientEmployee' ? 'Employee' : 'Dependent'}
              {person.client_name && ` • ${person.client_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Edit person"
            >
              <Edit2 className="h-5 w-5 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 overflow-hidden bg-gray-900/50">
        <PersonDetailTabs person={person} onEdit={onEdit} />
      </div>
    </div>
  )
}
