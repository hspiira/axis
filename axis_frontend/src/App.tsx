/**
 * Main Application Component
 *
 * SOLID Principles:
 * - Single Responsibility: Bootstrap application with providers and routing
 * - Dependency Inversion: Depends on router abstraction, not concrete routes
 */

import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { ClientProvider } from './contexts/ClientContext'
import { router } from './router'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClientProvider>
          <RouterProvider router={router} />
        </ClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
