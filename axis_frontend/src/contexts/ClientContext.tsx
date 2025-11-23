/**
 * Client Context for Multi-Tenancy
 *
 * SOLID Principles:
 * - Single Responsibility: Manage current client selection state
 * - Dependency Inversion: Components depend on context interface
 *
 * Manages the current client ID for multi-tenancy.
 * The client ID is automatically attached to API requests via axios interceptor.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface ClientContextValue {
  clientId: string | null
  setClientId: (id: string) => void
  clearClientId: () => void
  isClientSelected: boolean
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined)

interface ClientProviderProps {
  children: ReactNode
}

const CLIENT_ID_STORAGE_KEY = 'current_client_id'

/**
 * Client Provider Component
 * Manages client selection state with localStorage persistence
 */
export function ClientProvider({ children }: ClientProviderProps) {
  const [clientId, setClientIdState] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem(CLIENT_ID_STORAGE_KEY)
  })

  /**
   * Set the current client ID
   * Persists to localStorage for session continuity
   */
  const setClientId = (id: string) => {
    // Validate CUID format (25 alphanumeric characters)
    if (!/^[a-z0-9]{25}$/.test(id)) {
      console.error('Invalid client ID format:', id)
      return
    }

    localStorage.setItem(CLIENT_ID_STORAGE_KEY, id)
    setClientIdState(id)
  }

  /**
   * Clear the current client ID
   * Removes from both state and localStorage
   */
  const clearClientId = () => {
    localStorage.removeItem(CLIENT_ID_STORAGE_KEY)
    setClientIdState(null)
  }

  /**
   * Sync with localStorage changes from other tabs
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CLIENT_ID_STORAGE_KEY) {
        setClientIdState(e.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const value: ClientContextValue = {
    clientId,
    setClientId,
    clearClientId,
    isClientSelected: clientId !== null,
  }

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

/**
 * Hook to access client context
 * @throws Error if used outside ClientProvider
 */
export function useClient(): ClientContextValue {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider')
  }
  return context
}
