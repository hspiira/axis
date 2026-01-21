/**
 * Authentication API client.
 * 
 * SOLID Principles:
 * - Single Responsibility: Handle HTTP requests for authentication only
 * - Dependency Inversion: Uses axios instance that can be injected
 */

import axios from 'axios'
import { authClient } from './axios-config'
import type { LoginCredentials, AuthTokens, AuthResponse, AuthError } from '@/types/auth'

/**
 * Authentication API client class.
 * Encapsulates all authentication-related API calls.
 * Uses dedicated authClient to avoid interceptor loops.
 */
export class AuthApiClient {
  private client = authClient

  /**
   * Login with email and password.
   * @param credentials - User login credentials
   * @returns Promise resolving to auth response
   * @throws AuthError if login fails
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // First, get JWT tokens
      const tokenResponse = await this.client.post<AuthTokens>('/token/', {
        email: credentials.email,
        password: credentials.password,
      })

      // Then, get user info (we'll need to implement a /me endpoint or use token claims)
      // For now, we'll create a minimal user object from the token
      // In production, you'd decode the JWT or call a /me endpoint
      const user = await this.getCurrentUser(tokenResponse.data.access)

      return {
        user,
        tokens: tokenResponse.data,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || error.response?.data?.message || 'Login failed'
        const authError: AuthError = {
          message,
          code: error.response?.status?.toString(),
        }
        throw authError
      }
      throw { message: 'An unexpected error occurred during login' } as AuthError
    }
  }

  /**
   * Refresh access token.
   * @param refreshToken - Current refresh token
   * @returns Promise resolving to new tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await this.client.post<AuthTokens>('/token/refresh/', {
        refresh: refreshToken,
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || error.response?.data?.message || 'Token refresh failed'
        throw { message, code: error.response?.status?.toString() } as AuthError
      }
      throw { message: 'An unexpected error occurred during token refresh' } as AuthError
    }
  }

  /**
   * Verify token validity.
   * @param token - Access token to verify
   * @returns Promise resolving to verification result
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await this.client.post('/token/verify/', { token })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get current user information.
   * Note: This assumes a /me endpoint exists. If not, we'll decode JWT.
   * @param accessToken - Access token for authentication
   * @returns Promise resolving to user object
   */
  private async getCurrentUser(accessToken: string) {
    // For now, we'll decode basic info from the token
    // In production, implement a GET /api/auth/me/ endpoint
    try {
      const tokenParts = accessToken.split('.')
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format')
      }

      const payload = JSON.parse(atob(tokenParts[1]))
      
      // Map JWT claims to AuthUser
      return {
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
    } catch (error) {
      console.error('Failed to decode user from token:', error)
      // Return minimal user object
      return {
        id: '',
        email: '',
        status: 'UNKNOWN',
        is_staff: false,
        is_superuser: false,
      }
    }
  }
}

// Export singleton instance
export const authApiClient = new AuthApiClient()

