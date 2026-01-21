/**
 * Error Alert Component
 *
 * Displays user-friendly error messages with retry capability
 */

import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { AxiosError } from 'axios'

interface ErrorAlertProps {
  error: Error | AxiosError | string | null
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorAlert({ error, onRetry, onDismiss, className = '' }: ErrorAlertProps) {
  if (!error) return null

  // Parse error message
  const getErrorMessage = (): { title: string; description: string } => {
    if (typeof error === 'string') {
      return {
        title: 'Error',
        description: error,
      }
    }

    // Handle Axios errors
    if ('isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as AxiosError<{ error?: string; detail?: string; message?: string }>

      // Network errors
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return {
          title: 'Network Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
        }
      }

      // Server errors with custom messages
      if (error.response?.data) {
        const data = error.response.data
        const message = data.error || data.detail || data.message

        if (message) {
          return {
            title: `Error ${error.response.status}`,
            description: typeof message === 'string' ? message : JSON.stringify(message),
          }
        }
      }

      // Standard HTTP errors
      const statusMessages: Record<number, { title: string; description: string }> = {
        400: {
          title: 'Bad Request',
          description: 'The request was invalid. Please check your input and try again.',
        },
        401: {
          title: 'Authentication Required',
          description: 'You need to be logged in to access this resource. Please sign in and try again.',
        },
        403: {
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
        },
        404: {
          title: 'Not Found',
          description: 'The requested resource could not be found.',
        },
        409: {
          title: 'Conflict',
          description: 'This action conflicts with existing data. Please refresh and try again.',
        },
        422: {
          title: 'Validation Error',
          description: 'The provided data is invalid. Please check your input and try again.',
        },
        429: {
          title: 'Too Many Requests',
          description: 'You have made too many requests. Please wait a moment and try again.',
        },
        500: {
          title: 'Server Error',
          description: 'An internal server error occurred. Our team has been notified. Please try again later.',
        },
        502: {
          title: 'Bad Gateway',
          description: 'The server is temporarily unavailable. Please try again in a few moments.',
        },
        503: {
          title: 'Service Unavailable',
          description: 'The service is temporarily unavailable. Please try again later.',
        },
        504: {
          title: 'Gateway Timeout',
          description: 'The server took too long to respond. Please try again.',
        },
      }

      const status = error.response?.status
      if (status && statusMessages[status]) {
        return statusMessages[status]
      }

      return {
        title: `Error ${status || 'Unknown'}`,
        description: error.message || 'An unexpected error occurred.',
      }
    }

    // Generic error
    return {
      title: 'Error',
      description: error.message || 'An unexpected error occurred.',
    }
  }

  const { title, description } = getErrorMessage()

  return (
    <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h3 className="text-red-400 font-semibold mb-1">{title}</h3>
          <p className="text-red-400/80 text-sm">{description}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4 text-red-400" />
          </button>
        )}
      </div>
    </div>
  )
}
