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
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ClientSelector } from './ClientSelector'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Sidebar is always open on desktop, only toggle on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen w-full bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 gap-4 flex-shrink-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <ClientSelector />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-black via-gray-950 to-black relative p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
