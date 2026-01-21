/**
 * Authentication type definitions.
 * 
 * Single Responsibility: Define all authentication-related types and interfaces.
 */

export interface AuthTokens {
  access: string
  refresh: string
}

export interface AuthUser {
  id: string
  email: string
  username?: string | null
  first_name?: string
  last_name?: string
  status: string
  email_verified?: string | null
  is_staff: boolean
  is_superuser: boolean
}

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthError {
  message: string
  code?: string
  field?: string
}

export interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
}

