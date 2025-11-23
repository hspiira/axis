/**
 * Token storage implementation.
 * 
 * SOLID Principles:
 * - Single Responsibility: Handle token persistence only
 * - Open/Closed: Can be extended with different storage backends (localStorage, sessionStorage, cookies)
 */

import type { AuthTokens } from '@/types/auth'
import type { ITokenStorage } from './interfaces'

const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

/**
 * LocalStorage-based token storage implementation.
 * Implements ITokenStorage interface for dependency inversion.
 */
export class LocalStorageTokenStorage implements ITokenStorage {
  /**
   * Save tokens to localStorage.
   * @param tokens - Authentication tokens
   */
  saveTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
    } catch (error) {
      console.error('Failed to save tokens to localStorage:', error)
      throw new Error('Failed to save authentication tokens')
    }
  }

  /**
   * Retrieve tokens from localStorage.
   * @returns Tokens or null if not found
   */
  getTokens(): AuthTokens | null {
    try {
      const access = localStorage.getItem(ACCESS_TOKEN_KEY)
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)

      if (!access || !refresh) {
        return null
      }

      return { access, refresh }
    } catch (error) {
      console.error('Failed to retrieve tokens from localStorage:', error)
      return null
    }
  }

  /**
   * Clear tokens from localStorage.
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to clear tokens from localStorage:', error)
    }
  }
}

