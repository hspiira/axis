/**
 * Main Application Component
 *
 * SOLID Principles:
 * - Single Responsibility: Bootstrap application with providers and routing
 * - Dependency Inversion: Depends on router abstraction, not concrete routes
 */

import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from './components/Toaster'
import { AuthProvider } from './contexts/AuthContext'
import { ClientProvider } from './contexts/ClientContext'
import { QueryClientProvider, queryClient } from './lib/react-query'
import { router } from './router'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClientProvider>
            <RouterProvider router={router} />
            <Toaster />
          </ClientProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
