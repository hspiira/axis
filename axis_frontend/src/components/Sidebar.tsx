/**
 * Sidebar Navigation Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle sidebar navigation and layout
 * - Open/Closed: Extensible with additional menu items
 *
 * Inspired by modern dashboard designs with clean sidebar navigation
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Building2,
  FileCheck,
  User,
  Search,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Cases', path: '/cases', icon: FileText },
  { label: 'Clients', path: '/clients', icon: Building2 },
  { label: 'Contracts', path: '/contracts', icon: FileCheck },
]

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.email || 'User'
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <aside
        className={cn(
          'flex flex-col h-screen bg-gray-900/50 border-r border-white/10 transition-transform duration-300 ease-in-out',
          'w-64 flex-shrink-0',
          // On mobile: fixed positioning with slide animation
          'fixed lg:relative lg:translate-x-0',
          // On mobile: translate based on isOpen
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Z-index: high on mobile (overlay), normal on desktop (in flow)
          'z-50 lg:z-auto'
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/dashboard" onClick={onClose}>
            <Logo size="md" showText={true} />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Search Section */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main Menu
          </p>
        </div>
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-white/10">
        <Link
          to="/profile"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
            location.pathname === '/profile'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || 'No email'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
        </Link>

        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  )
}

