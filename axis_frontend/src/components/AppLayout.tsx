/**
 * Application Layout Component
 *
 * Provides consistent layout structure for authenticated pages.
 * Includes sidebar navigation and main content area.
 *
 * SOLID Principles:
 * - Single Responsibility: Layout structure only
 * - Open/Closed: Can be extended with additional layout features
 */

import { useState } from 'react'
import { Menu, Info } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { usePageTitle } from '@/contexts/PageTitleContext'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Sidebar is always open on desktop, only toggle on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { title, description } = usePageTitle()

  return (
    <div className="flex h-screen w-full bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          {title && (
            <div className="flex items-center gap-2 group relative">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">{title}</h1>
                {description && (
                  <Info className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors cursor-help flex-shrink-0" />
                )}
              </div>
              {/* Tooltip - appears on hover of the entire title area */}
              {description && (
                <div className="absolute top-full left-0 mt-3 w-72 p-3 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                  <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
                  {/* Arrow pointing up */}
                  <div className="absolute -top-1.5 left-6 w-3 h-3 bg-gray-900/95 border-l border-t border-white/20 rotate-45"></div>
                </div>
              )}
            </div>
          )}
        </header>

      {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-black via-gray-950 to-black relative">
          {children}
        </main>
      </div>
    </div>
  )
}
