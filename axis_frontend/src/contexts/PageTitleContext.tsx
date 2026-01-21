/**
 * Page Title Context
 *
 * Provides a way for pages to set their title and description
 * which will be displayed in the header bar instead of on the page.
 */

import { createContext, useContext, useState, type ReactNode } from 'react'

interface PageTitleContextValue {
  title: string | null
  description: string | null
  setPageTitle: (title: string | null, description?: string | null) => void
}

const PageTitleContext = createContext<PageTitleContextValue | undefined>(undefined)

interface PageTitleProviderProps {
  children: ReactNode
}

export function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [title, setTitle] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)

  const setPageTitle = (newTitle: string | null, newDescription?: string | null) => {
    setTitle(newTitle)
    setDescription(newDescription ?? null)
  }

  return (
    <PageTitleContext.Provider value={{ title, description, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  const context = useContext(PageTitleContext)
  if (context === undefined) {
    throw new Error('usePageTitle must be used within a PageTitleProvider')
  }
  return context
}

