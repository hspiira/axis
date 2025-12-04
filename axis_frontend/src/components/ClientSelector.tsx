/**
 * Client Selector Component
 *
 * SOLID Principles:
 * - Single Responsibility: Allow users to select current client
 * - Dependency Inversion: Depends on ClientContext abstraction
 *
 * Displays a dropdown for selecting the active client.
 * Used in multi-tenancy scenarios where users have access to multiple clients.
 */

import { useEffect } from 'react'
import { useClient } from '@/contexts/ClientContext'
import { useClients } from '@/hooks/useClients'
import { BaseStatus } from '@/api/clients'

export function ClientSelector() {
  const { clientId, setClientId } = useClient()
  const { data: clients = [], isLoading, error } = useClients()

  // Auto-select first client if none selected
  useEffect(() => {
    if (!clientId && clients.length > 0) {
      setClientId(clients[0].id)
    }
  }, [clientId, clients, setClientId])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
        <div className="animate-spin h-4 w-4 border-2 border-cream-500 border-t-transparent rounded-full" />
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-3 py-2 text-sm text-red-400">
        Failed to load clients
      </div>
    )
  }

  if (!isLoading && clients.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-400">
        No clients available
      </div>
    )
  }

  const currentClient = clients.find((c) => c.id === clientId)

  return (
    <div className="relative">
      <select
        value={clientId || ''}
        onChange={(e) => setClientId(e.target.value)}
        className="appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-lg px-4 py-2 pr-8 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cream-500 transition-all cursor-pointer"
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id} className="bg-gray-900">
            {client.name}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Client status indicator */}
      {currentClient && (
        <div className="absolute -bottom-1 -right-1 flex items-center">
          <div
            className={`h-2 w-2 rounded-full ${
              currentClient.status === BaseStatus.ACTIVE ? 'bg-green-400' : 'bg-gray-400'
            }`}
          />
        </div>
      )}
    </div>
  )
}
