/**
 * Sidebar Navigation Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle sidebar navigation and layout
 * - Open/Closed: Extensible with additional menu items
 *
 * Inspired by modern dashboard designs with clean sidebar navigation
 */

import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Building2,
  FileCheck,
  Users,
  Stethoscope,
  Shield,
  FolderOpen,
  X,
  Settings,
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

interface NavSection {
  items: NavItem[]
}

// Core operational sections
const coreSection: NavSection = {
  items: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Sessions', path: '/sessions', icon: Calendar },
  ],
}

// Management sections
const managementSection: NavSection = {
  items: [
    { label: 'Clients', path: '/clients', icon: Building2 },
    { label: 'Contracts', path: '/contracts', icon: FileCheck },
    { label: 'Persons', path: '/persons', icon: Users },
  ],
}

// Services sections
const servicesSection: NavSection = {
  items: [
    { label: 'Services', path: '/services', icon: Stethoscope },
    { label: 'Service Providers', path: '/service-providers', icon: Shield },
    { label: 'Documents', path: '/documents', icon: FolderOpen },
  ],
}

// Configuration sections
const configSection: NavSection = {
  items: [
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()

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

  const renderNavSection = (section: NavSection) => {
    return section.items.map((item) => {
      const Icon = item.icon
      const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all',
            isActive
              ? 'bg-white/10 text-theme'
              : 'text-theme-secondary hover:text-theme hover:bg-white/5'
          )}
        >
          <Icon className="h-[14px] w-[14px] flex-shrink-0" />
          <span>{item.label}</span>
        </Link>
      )
    })
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
          'flex flex-col h-screen bg-theme transition-transform duration-300 ease-in-out',
          'w-64 flex-shrink-0',
          // On mobile: fixed positioning with slide animation
          'fixed lg:relative lg:translate-x-0',
          // On mobile: translate based on isOpen
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Z-index: high on mobile (overlay), normal on desktop (in flow)
          'z-50 lg:z-auto'
        )}
      >
        {/* User Profile Section - Top */}
        <div className="h-16 px-4 lg:px-6 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-theme truncate">
              {getUserDisplayName()}
            </h2>
            <Link
              to="/profile"
              onClick={onClose}
              className="text-theme-tertiary hover:text-theme-secondary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M8 1.33334L14.6667 8.00001L8 14.6667M13.3333 8.00001H1.33334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
          <p className="text-sm text-theme-tertiary truncate">
            {user?.email || 'user@example.com'}
          </p>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="space-y-0">
            {/* Core Section */}
            <div className="py-2">
              {renderNavSection(coreSection)}
            </div>

            {/* Management Section */}
            <div className="py-2 border-t border-white/5">
              {renderNavSection(managementSection)}
            </div>

            {/* Services Section */}
            <div className="py-2 border-t border-white/5">
              {renderNavSection(servicesSection)}
            </div>

            {/* Configuration Section */}
            <div className="py-2 border-t border-white/5">
              {renderNavSection(configSection)}
            </div>
          </nav>
        </div>

        {/* Logo Section - Bottom */}
        <div className="px-4 py-4 border-t border-white/10">
          <Link to="/dashboard" onClick={onClose} className="flex items-center justify-center">
            <Logo size="sm" showText={true} />
          </Link>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-theme-secondary hover:text-theme transition-colors p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </aside>
    </>
  )
}

