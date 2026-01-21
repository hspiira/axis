/**
 * Authentication service implementation.
 * 
 * SOLID Principles:
 * - Single Responsibility: Orchestrate authentication operations
 * - Dependency Inversion: Depends on interfaces, not concrete implementations
 * - Open/Closed: Can be extended for different auth providers without modification
 */

import type { LoginCredentials, AuthResponse, AuthTokens, AuthError } from '@/types/auth'
import type { IAuthService, ITokenStorage } from './interfaces'
import { authApiClient } from '@/api/auth'

/**
 * Authentication service implementation.
 * Coordinates between API client and token storage.
 */
export class AuthService implements IAuthService {
  constructor(
    private apiClient = authApiClient,
    private tokenStorage: ITokenStorage
  ) {}

  /**
   * Authenticate user with credentials.
   * @param credentials - User login credentials
   * @returns Promise resolving to auth response
   * @throws AuthError if authentication fails
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.login(credentials)
      
      // Persist tokens
      this.tokenStorage.saveTokens(response.tokens)
      
      return response
    } catch (error) {
      // Re-throw auth errors
      throw error as AuthError
    }
  }

  /**
   * Refresh authentication tokens.
   * @param refreshToken - Current refresh token
   * @returns Promise resolving to new tokens
   * @throws AuthError if refresh fails
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const tokens = await this.apiClient.refreshTokens(refreshToken)
      
      // Update stored tokens
      this.tokenStorage.saveTokens(tokens)
      
      return tokens
    } catch (error) {
      // Clear invalid tokens
      this.tokenStorage.clearTokens()
      throw error as AuthError
    }
  }

  /**
   * Verify token validity.
   * @param token - Access token to verify
   * @returns Promise resolving to verification result
   */
  async verifyToken(token: string): Promise<boolean> {
    return this.apiClient.verifyToken(token)
  }

  /**
   * Logout current user.
   * Clears tokens and session data.
   */
  async logout(): Promise<void> {
    this.tokenStorage.clearTokens()
  }
}

