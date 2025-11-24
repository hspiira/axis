/**
 * Error Boundary Component
 *
 * SOLID Principles:
 * - Single Responsibility: Catch and handle React component errors
 * - Open/Closed: Extensible via custom fallback UI
 *
 * Catches errors in child components and displays fallback UI
 * instead of crashing the entire application.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error details and call optional error handler
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call optional error handler (e.g., for error tracking services)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(error, { extra: errorInfo })
  }

  /**
   * Reset error boundary state
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-black via-gray-950 to-black px-6">
          <div className="max-w-2xl w-full text-center">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <svg
                className="h-10 w-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-4xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-400 mb-8 text-lg">
              We're sorry for the inconvenience. An unexpected error occurred.
            </p>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8 text-left">
                <h2 className="text-lg font-semibold text-white mb-2">Error Details:</h2>
                <p className="text-red-400 text-sm mb-4 font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-gray-400 text-xs">
                    <summary className="cursor-pointer hover:text-white transition-colors mb-2">
                      Component Stack
                    </summary>
                    <pre className="whitespace-pre-wrap font-mono bg-black/50 p-4 rounded border border-white/10 overflow-auto max-h-60">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="px-8 py-4 bg-linear-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/50"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                Go to Homepage
              </button>
            </div>

            {/* Support Message */}
            <p className="text-gray-500 text-sm mt-8">
              If this problem persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
