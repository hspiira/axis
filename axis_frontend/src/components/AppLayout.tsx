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

import { useState, useRef, useEffect } from 'react'
import { Menu, Info, ChevronRight, Settings, MoreVertical, Loader2, LogOut, Sun, Moon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useBreadcrumbs } from '@/contexts/BreadcrumbContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Sidebar is always open on desktop, only toggle on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { title, description } = usePageTitle()
  const { breadcrumbs, menuActions } = useBreadcrumbs()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (menuOpen || profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen, profileMenuOpen])

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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen w-full bg-theme">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-theme bg-theme flex items-center justify-between px-4 lg:px-6 gap-4 shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-theme-secondary hover:text-theme transition-colors p-2"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Breadcrumbs (for detail pages) */}
            {breadcrumbs.length > 0 ? (
              <div className="flex items-center gap-2 text-sm min-w-0 flex-1 overflow-hidden">
                {breadcrumbs.length > 3 ? (
                  // Show ellipsis for long breadcrumbs
                  <>
                    {/* First breadcrumb */}
                    <div className="flex items-center gap-2 shrink-0">
                      {breadcrumbs[0].to ? (
                        <Link
                          to={breadcrumbs[0].to}
                          className="text-theme-secondary hover:text-theme transition-colors"
                        >
                          {breadcrumbs[0].label}
                        </Link>
                      ) : (
                        <span className="text-theme-secondary">{breadcrumbs[0].label}</span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-theme-tertiary shrink-0" />
                    {/* Ellipsis */}
                    <span className="text-theme-tertiary px-1">...</span>
                    <ChevronRight className="h-4 w-4 text-theme-tertiary shrink-0" />
                    {/* Last two breadcrumbs */}
                    {breadcrumbs.slice(-2).map((crumb, idx) => {
                      const actualIndex = breadcrumbs.length - 2 + idx
                      const isLast = actualIndex === breadcrumbs.length - 1
                      return (
                        <div key={actualIndex} className="flex items-center gap-2 shrink-0">
                          {idx > 0 && <ChevronRight className="h-4 w-4 text-theme-tertiary shrink-0" />}
                          {isLast ? (
                            <span className="text-theme font-medium truncate max-w-[200px]" title={crumb.label}>
                              {crumb.label}
                            </span>
                          ) : crumb.to ? (
                            <Link
                              to={crumb.to}
                              className="text-theme-secondary hover:text-theme transition-colors truncate max-w-[200px]"
                              title={crumb.label}
                            >
                              {crumb.label}
                            </Link>
                          ) : (
                            <span className="text-theme-secondary truncate max-w-[200px]" title={crumb.label}>
                              {crumb.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </>
                ) : (
                  // Show all breadcrumbs when 3 or fewer
                  breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1
                    return (
                      <div key={index} className="flex items-center gap-2 shrink-0">
                        {index > 0 && <ChevronRight className="h-4 w-4 text-theme-tertiary shrink-0" />}
                        {isLast ? (
                          // Last item (current page) - not clickable
                          <span className="text-theme font-medium truncate max-w-[200px]" title={crumb.label}>
                            {crumb.label}
                          </span>
                        ) : crumb.to ? (
                          <Link
                            to={crumb.to}
                            className="text-theme-secondary hover:text-theme transition-colors truncate max-w-[200px]"
                            title={crumb.label}
                          >
                            {crumb.label}
                          </Link>
                        ) : crumb.onClick ? (
                          <button
                            onClick={crumb.onClick}
                            className="text-theme-secondary hover:text-theme transition-colors truncate max-w-[200px]"
                            title={crumb.label}
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span className="text-theme-secondary truncate max-w-[200px]" title={crumb.label}>
                            {crumb.label}
                          </span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              /* Page Title (for main pages) */
              title && (
                <div className="flex items-center gap-2 group relative">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-theme">{title}</h1>
                    {description && (
                      <Info className="h-4 w-4 text-theme-tertiary group-hover:text-theme-secondary transition-colors cursor-help shrink-0" />
                    )}
                  </div>
                  {/* Tooltip - appears on hover of the entire title area */}
                  {description && (
                    <div className="absolute top-full left-0 mt-3 w-72 p-3 bg-theme/95 backdrop-blur-sm border border-theme rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <p className="text-sm text-theme-secondary leading-relaxed">{description}</p>
                      {/* Arrow pointing up */}
                      <div className="absolute -top-1.5 left-6 w-3 h-3 bg-theme/95 border-l border-t border-theme rotate-45"></div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-theme-secondary hover:text-theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Gear Icon Menu (for detail pages with breadcrumbs) */}
            {breadcrumbs.length > 0 && menuActions.length > 0 && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-theme-secondary hover:text-theme shrink-0"
                  aria-label="Actions menu"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-theme border border-theme rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                      {menuActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={async () => {
                            if (action.disabled || action.loading) return
                            await action.onClick()
                            setMenuOpen(false)
                          }}
                          disabled={action.disabled || action.loading}
                          title={action.tooltip}
                          className={cn(
                            'w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2',
                            action.disabled || action.loading
                              ? 'opacity-50 cursor-not-allowed'
                              : action.variant === 'danger'
                              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                              : 'text-theme-secondary hover:bg-white/10 hover:text-theme'
                          )}
                        >
                          {action.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            action.icon || <MoreVertical className="h-4 w-4" />
                          )}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                  {getUserInitials()}
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-theme border border-theme rounded-lg shadow-xl z-50 overflow-hidden">
                  {/* User Info */}
                  <div className="p-4 border-b border-theme">
                    <p className="text-sm font-semibold text-theme truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-theme-secondary truncate mt-1">
                      {user?.email || 'user@example.com'}
                    </p>
                    <p className="text-xs text-theme-tertiary mt-1">Download for macOS</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-theme-secondary hover:bg-white/10 hover:text-theme transition-colors flex items-center justify-between"
                    >
                      <span>Log Out</span>
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

      {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-theme relative">
          {children}
        </main>
      </div>
    </div>
  )
}
