/**
 * ResourcePageLayout Component
 *
 * Unified layout for resource management pages (Clients, Services, Documents, etc.)
 * Eliminates duplication of page structure, title management, and common layout patterns.
 *
 * Features:
 * - Automatic page title management with cleanup
 * - Consistent container and spacing
 * - Optional stats, filters, and action sections
 * - Flexible content area
 * - Modal rendering slot
 */

import { useEffect, type ReactNode } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'

interface ResourcePageLayoutProps {
  // Page title configuration
  title: string
  subtitle?: string

  // Optional sections (rendered in order)
  stats?: ReactNode
  filters?: ReactNode
  actions?: ReactNode

  // Main content
  children: ReactNode

  // Modals rendered at the end
  modals?: ReactNode

  // Layout variants
  variant?: 'default' | 'full-width' | 'compact'
  spacing?: 'default' | 'compact' | 'spacious'
}

const containerClasses = {
  default: 'max-w-7xl mx-auto px-4 lg:px-6 py-6',
  'full-width': 'p-6',
  compact: 'max-w-5xl mx-auto px-4 lg:px-6 py-4',
}

const spacingClasses = {
  default: 'space-y-6',
  compact: 'space-y-4',
  spacious: 'space-y-8',
}

export function ResourcePageLayout({
  title,
  subtitle,
  stats,
  filters,
  actions,
  children,
  modals,
  variant = 'default',
  spacing = 'default',
}: ResourcePageLayoutProps) {
  const { setPageTitle } = usePageTitle()

  // Automatic page title management with cleanup
  useEffect(() => {
    setPageTitle(title, subtitle)
    return () => setPageTitle(null)
  }, [setPageTitle, title, subtitle])

  return (
    <AppLayout>
      <div className={containerClasses[variant]}>
        <div className={spacingClasses[spacing]}>
          {/* Optional Stats Section */}
          {stats && <div className="stats-section">{stats}</div>}

          {/* Optional Filters and Actions */}
          {(filters || actions) && (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {filters && <div className="flex-1 min-w-0">{filters}</div>}
              {actions && <div className="shrink-0">{actions}</div>}
            </div>
          )}

          {/* Main Content */}
          <div className="main-content">{children}</div>
        </div>
      </div>

      {/* Modals */}
      {modals}
    </AppLayout>
  )
}
