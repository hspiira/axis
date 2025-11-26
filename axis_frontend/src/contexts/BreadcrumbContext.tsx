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
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface BreadcrumbContextValue {
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
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

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs, menuActions, setMenuActions }}>
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

