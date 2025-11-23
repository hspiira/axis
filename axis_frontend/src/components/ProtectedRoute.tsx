/**
 * Protected Route Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle route protection based on authentication
 * - Open/Closed: Extensible for additional authorization checks
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the landing page while preserving the intended destination.
 */
export function ProtectedRoute({
  children,
  redirectTo = '/'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Render protected content
  return <>{children}</>
}
