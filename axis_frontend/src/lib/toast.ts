/**
 * Toast Notification Utilities
 *
 * SOLID Principles:
 * - Single Responsibility: Provide convenient toast notification functions
 * - Dependency Inversion: Wrapper around Sonner library
 *
 * Usage:
 * ```tsx
 * import { toast } from '@/lib/toast'
 *
 * // Success
 * toast.success('Client created successfully!')
 *
 * // Error
 * toast.error('Failed to create client')
 *
 * // Promise with loading state
 * toast.promise(
 *   createClient(data),
 *   {
 *     loading: 'Creating client...',
 *     success: 'Client created!',
 *     error: 'Failed to create client',
 *   }
 * )
 * ```
 */

import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification utilities
 */
export const toast = {
  /**
   * Display success message
   */
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Display error message
   */
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 5000, // Errors stay longer
    })
  },

  /**
   * Display info message
   */
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Display warning message
   */
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Display loading message (returns toast ID for updates)
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },

  /**
   * Display promise toast with loading/success/error states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },

  /**
   * Display custom toast
   */
  custom: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(message, options)
  },
}

/**
 * API error toast helper
 *
 * Handles common API error formats and displays user-friendly messages
 */
export function toastApiError(error: unknown, fallbackMessage = 'An error occurred') {
  const errorMessage = getErrorMessage(error)
  toast.error(fallbackMessage, errorMessage)
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }

    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }

    // Axios error format
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as { data?: { message?: string; error?: string } }
      if (response.data?.message) {
        return response.data.message
      }
      if (response.data?.error) {
        return response.data.error
      }
    }
  }

  return 'An unexpected error occurred'
}
