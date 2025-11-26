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
import { PageTitleProvider } from './contexts/PageTitleContext'
import { BreadcrumbProvider } from './contexts/BreadcrumbContext'
import { QueryClientProvider, queryClient } from './lib/react-query'
import { router } from './router'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClientProvider>
            <PageTitleProvider>
              <BreadcrumbProvider>
                <RouterProvider router={router} />
                <Toaster />
              </BreadcrumbProvider>
            </PageTitleProvider>
          </ClientProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
