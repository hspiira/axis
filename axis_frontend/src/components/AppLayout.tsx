/**
 * Application Layout Component
 *
 * Provides consistent layout structure for authenticated pages.
 * Includes header navigation and footer.
 */

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ClientSelector } from './ClientSelector'
import { Logo } from './Logo'
import { Footer } from './Footer'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Logo size="md" showText={true} />
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors relative group"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                to="/cases"
                className="text-sm text-gray-400 hover:text-white transition-colors relative group"
              >
                Cases
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                to="/clients"
                className="text-sm text-gray-400 hover:text-white transition-colors relative group"
              >
                Clients
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                to="/contracts"
                className="text-sm text-gray-400 hover:text-white transition-colors relative group"
              >
                Providers
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>

              <div className="h-6 w-px bg-white/20"></div>

              <ClientSelector />

              <Link
                to="/profile"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-300"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
