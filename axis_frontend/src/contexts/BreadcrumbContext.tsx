/**
 * Breadcrumb Context
 *
 * Provides a way for detail pages to set breadcrumbs
 * which will be displayed in the header bar.
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { type LinkProps } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
  onClick?: () => void
}

export interface MenuAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void | Promise<void>
  variant?: 'default' | 'danger'
  disabled?: boolean
  loading?: boolean
  tooltip?: string
}

interface BreadcrumbContextValue {
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  pushBreadcrumb: (crumb: BreadcrumbItem) => void
  popBreadcrumb: () => void
  clearBreadcrumbs: () => void
  menuActions: MenuAction[]
  setMenuActions: (actions: MenuAction[]) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(undefined)

interface BreadcrumbProviderProps {
  children: ReactNode
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [menuActions, setMenuActions] = useState<MenuAction[]>([])

  const pushBreadcrumb = (crumb: BreadcrumbItem) => {
    setBreadcrumbs((prev) => [...prev, crumb])
  }

  const popBreadcrumb = () => {
    setBreadcrumbs((prev) => prev.slice(0, -1))
  }

  const clearBreadcrumbs = () => {
    setBreadcrumbs([])
  }

  return (
    <BreadcrumbContext.Provider
      value={{
        breadcrumbs,
        setBreadcrumbs,
        pushBreadcrumb,
        popBreadcrumb,
        clearBreadcrumbs,
        menuActions,
        setMenuActions,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext)
  if (context === undefined) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider')
  }
  return context
}

