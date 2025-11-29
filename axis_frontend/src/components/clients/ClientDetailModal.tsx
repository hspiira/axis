/**
 * Client Detail Modal Component
 *
 * Full-screen modal with tabbed navigation for client details
 *
 * SOLID Principles:
 * - Single Responsibility: Display comprehensive client information
 * - Open/Closed: Tab system allows easy extension
 * - Dependency Inversion: Depends on reusable tab components
 */

import { X, Edit2, Building2 } from 'lucide-react'
import { type ClientDetail } from '@/api/clients'
import { ClientDetailTabs } from './ClientDetailTabs'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface ClientDetailModalProps {
  client: ClientDetail
  isOpen: boolean
  onClose: () => void
  onEdit?: (client: ClientDetail) => void
}

export function ClientDetailModal({ client, isOpen, onClose, onEdit }: ClientDetailModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-[2px] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
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
          {onEdit && (
            <button
              onClick={() => onEdit(client)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Edit client"
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
        <ClientDetailTabs client={client} onEdit={onEdit ? () => onEdit(client) : undefined} />
      </div>
    </div>
  )
}
