/**
 * Axios Configuration with Interceptors
 *
 * SOLID Principles:
 * - Single Responsibility: Configure HTTP client with authentication
 * - Open/Closed: Extensible via interceptors without modifying core logic
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Centralized Axios instance with interceptors for:
 * - Automatic JWT token attachment
 * - Automatic token refresh on 401 errors
 * - Request queuing during token refresh
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Token refresh state
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

/**
 * Request Interceptor
 * Attaches access token to all requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('auth_access_token')

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    // Attach client ID if available (for multi-tenancy)
    const clientId = localStorage.getItem('current_client_id')
    if (clientId) {
      config.headers['X-Client-ID'] = clientId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor
 * Handles 401 errors and automatic token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't retry if:
    // 1. Not a 401 error
    // 2. Already retried
    // 3. Request is to auth endpoints (avoid infinite loops)
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/token/')
    ) {
      return Promise.reject(error)
    }

    // If currently refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => apiClient(originalRequest))
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('auth_refresh_token')

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      // Attempt to refresh the access token
      const response = await axios.post<AuthTokens>(
        `${API_BASE_URL}/api/auth/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const { access, refresh } = response.data

      // Update tokens in localStorage
      localStorage.setItem('auth_access_token', access)
      localStorage.setItem('auth_refresh_token', refresh)

      // Update the authorization header for the original request
      originalRequest.headers.Authorization = `Bearer ${access}`

      // Process all queued requests with new token
      processQueue()

      // Retry the original request
      return apiClient(originalRequest)
    } catch (refreshError) {
      // Token refresh failed - logout user
      processQueue(refreshError)

      // Clear tokens
      localStorage.removeItem('auth_access_token')
      localStorage.removeItem('auth_refresh_token')
      localStorage.removeItem('current_client_id')

      // Redirect to landing page
      window.location.href = '/'

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

/**
 * Auth-specific axios instance without interceptors
 * Used for login/token endpoints to avoid infinite loops
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})
