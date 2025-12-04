/**
 * Application Router Configuration
 *
 * SOLID Principles:
 * - Single Responsibility: Define all application routes in one place
 * - Open/Closed: Easy to extend with new routes without modifying existing ones
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SessionsPage } from '@/pages/SessionsPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { ContractsPage } from '@/pages/ContractsPage'
import { ContractDetailPage } from '@/pages/ContractDetailPage'
import { PersonsPage } from '@/pages/PersonsPage'
import { PersonDetailPage } from '@/pages/PersonDetailPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { ServiceProvidersPage } from '@/pages/ServiceProvidersPage'
import { ServiceAssignmentsPage } from '@/pages/ServiceAssignmentsPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { IndustriesSettingsPage } from '@/pages/settings/IndustriesSettingsPage'
import { ServiceCategoriesSettingsPage } from '@/pages/settings/ServiceCategoriesSettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Application route configuration
 * Uses React Router v6 with data router pattern
 */
export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <LandingPage />,
  },

  // Protected Routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sessions',
    element: (
      <ProtectedRoute>
        <SessionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clients',
    element: (
      <ProtectedRoute>
        <ClientsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clients/:id',
    element: (
      <ProtectedRoute>
        <ClientDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clients/:clientId/persons/:id',
    element: (
      <ProtectedRoute>
        <PersonDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/contracts',
    element: (
      <ProtectedRoute>
        <ContractsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/contracts/:id',
    element: (
      <ProtectedRoute>
        <ContractDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/persons',
    element: (
      <ProtectedRoute>
        <PersonsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/persons/:id',
    element: (
      <ProtectedRoute>
        <PersonDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/services',
    element: (
      <ProtectedRoute>
        <ServicesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/service-providers',
    element: (
      <ProtectedRoute>
        <ServiceProvidersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/service-assignments',
    element: (
      <ProtectedRoute>
        <ServiceAssignmentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/documents',
    element: (
      <ProtectedRoute>
        <DocumentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/industries',
    element: (
      <ProtectedRoute>
        <IndustriesSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/service-categories',
    element: (
      <ProtectedRoute>
        <ServiceCategoriesSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // Redirects and Fallbacks
  {
    path: '/home',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
