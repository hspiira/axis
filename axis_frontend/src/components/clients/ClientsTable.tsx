/**
 * Clients Table Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display clients in a table format
 * - Open/Closed: Extensible with additional columns or actions
 */

import { useState } from 'react'
import {
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  Power,
  Archive,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { type ClientList, BaseStatus } from '@/api/clients'
import { cn } from '@/lib/utils'

interface ClientsTableProps {
  clients: ClientList[]
  isLoading?: boolean
  onView?: (client: ClientList) => void
  onEdit?: (client: ClientList) => void
  onActivate?: (client: ClientList) => void
  onDeactivate?: (client: ClientList) => void
  onArchive?: (client: ClientList) => void
  onVerify?: (client: ClientList) => void
  onDelete?: (client: ClientList) => void
}

export function ClientsTable({
  clients,
  isLoading = false,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onArchive,
  onVerify,
  onDelete,
}: ClientsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const getStatusColor = (status: BaseStatus) => {
    switch (status) {
      case BaseStatus.ACTIVE:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case BaseStatus.INACTIVE:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case BaseStatus.PENDING:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case BaseStatus.ARCHIVED:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Loading clients...</p>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No clients found</p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Industry
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Verified
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {clients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => onView?.(client)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mr-3">
                      <Building2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{client.name}</div>
                      {client.email && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {client.phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-500" />
                        {client.phone}
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {client.industry_name || <span className="text-gray-500">—</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                      getStatusColor(client.status)
                    )}
                  >
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.is_verified ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-500">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs">Unverified</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(client.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative inline-block">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === client.id ? null : client.id)
                      }}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === client.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(null)
                          }}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-20">
                          <div className="py-1">
                            {onView && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onView(client)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(client)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                            )}
                            {client.status === BaseStatus.ACTIVE && onDeactivate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeactivate(client)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <Power className="h-4 w-4" />
                                Deactivate
                              </button>
                            )}
                            {client.status !== BaseStatus.ACTIVE && onActivate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onActivate(client)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <Power className="h-4 w-4" />
                                Activate
                              </button>
                            )}
                            {!client.is_verified && onVerify && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onVerify(client)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <ShieldCheck className="h-4 w-4" />
                                Verify
                              </button>
                            )}
                            {client.status !== BaseStatus.ARCHIVED && onArchive && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onArchive(client)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <Archive className="h-4 w-4" />
                                Archive
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(client)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/10 hover:text-rose-300 transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

