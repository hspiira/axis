/**
 * Authentication context and provider.
 * 
 * SOLID Principles:
 * - Single Responsibility: Manage authentication state only
 * - Dependency Inversion: Uses AuthService interface
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthUser, AuthTokens, AuthState, AuthError, LoginCredentials } from '@/types/auth'
import { AuthService } from '@/services/auth/AuthService'
import { LocalStorageTokenStorage } from '@/services/auth/TokenStorage'

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  authService?: AuthService
}

/**
 * Authentication provider component.
 * Provides authentication state and methods to child components.
 */
export function AuthProvider({ children, authService }: AuthProviderProps) {
  const tokenStorage = new LocalStorageTokenStorage()
  const service = authService || new AuthService(undefined, tokenStorage)

  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  /**
   * Initialize auth state from stored tokens.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = tokenStorage.getTokens()
        
        if (tokens) {
          // Verify token is still valid
          const isValid = await service.verifyToken(tokens.access)
          
          if (isValid) {
            // Decode user from token (simplified - in production, use /me endpoint)
            const tokenParts = tokens.access.split('.')
            if (tokenParts.length === 3) {
              try {
                const payload = JSON.parse(atob(tokenParts[1]))
                const user: AuthUser = {
                  id: payload.user_id || payload.sub || '',
                  email: payload.email || '',
                  username: payload.username || null,
                  first_name: payload.first_name || '',
                  last_name: payload.last_name || '',
                  status: payload.status || 'ACTIVE',
                  email_verified: payload.email_verified || null,
                  is_staff: payload.is_staff || false,
                  is_superuser: payload.is_superuser || false,
                }
                
                setState({
                  user,
                  tokens,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                })
                return
              } catch (error) {
                console.error('Failed to decode user from token:', error)
              }
            }
          }
          
          // Token invalid, clear it
          tokenStorage.clearTokens()
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Login with credentials.
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await service.login(credentials)
      
      setState({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const authError = error as AuthError
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
        isAuthenticated: false,
      }))
      throw authError
    }
  }, [service])

  /**
   * Logout current user.
   */
  const logout = useCallback(async () => {
    try {
      await service.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  }, [service])

  /**
   * Refresh authentication tokens.
   */
  const refreshAuth = useCallback(async () => {
    const tokens = tokenStorage.getTokens()
    if (!tokens?.refresh) {
      return
    }

    try {
      const newTokens = await service.refreshTokens(tokens.refresh)
      setState(prev => ({
        ...prev,
        tokens: newTokens,
      }))
    } catch (error) {
      // Refresh failed, logout user
      await logout()
    }
  }, [service, tokenStorage, logout])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication context.
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

