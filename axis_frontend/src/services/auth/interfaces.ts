/**
 * Authentication service interfaces.
 * 
 * SOLID Principles:
 * - Interface Segregation: Separate interfaces for different auth concerns
 * - Dependency Inversion: Depend on abstractions, not concrete implementations
 */

import type { LoginCredentials, AuthResponse, AuthTokens, AuthError } from '@/types/auth'

/**
 * Core authentication operations interface.
 * Single Responsibility: Define contract for authentication operations.
 */
export interface IAuthService {
  /**
   * Authenticate user with credentials.
   * @param credentials - User login credentials
   * @returns Promise resolving to auth response with user and tokens
   * @throws AuthError if authentication fails
   */
  login(credentials: LoginCredentials): Promise<AuthResponse>

  /**
   * Refresh authentication tokens.
   * @param refreshToken - Current refresh token
   * @returns Promise resolving to new tokens
   * @throws AuthError if refresh fails
   */
  refreshTokens(refreshToken: string): Promise<AuthTokens>

  /**
   * Verify token validity.
   * @param token - Access token to verify
   * @returns Promise resolving to verification result
   */
  verifyToken(token: string): Promise<boolean>

  /**
   * Logout current user.
   * Clears tokens and session data.
   */
  logout(): Promise<void>
}

/**
 * Token storage operations interface.
 * Single Responsibility: Define contract for token persistence.
 */
export interface ITokenStorage {
  /**
   * Save tokens to storage.
   * @param tokens - Authentication tokens
   */
  saveTokens(tokens: AuthTokens): void

  /**
   * Retrieve tokens from storage.
   * @returns Tokens or null if not found
   */
  getTokens(): AuthTokens | null

  /**
   * Clear tokens from storage.
   */
  clearTokens(): void
}

/**
 * User session management interface.
 * Single Responsibility: Define contract for user session operations.
 */
export interface IUserSession {
  /**
   * Get current authenticated user.
   * @returns User object or null if not authenticated
   */
  getCurrentUser(): Promise<AuthUser | null>

  /**
   * Check if user is authenticated.
   * @returns True if user has valid session
   */
  isAuthenticated(): boolean
}

