/**
 * Settings Page
 *
 * Displays and manages configuration models and system settings.
 */

import { useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Settings, Building2, Briefcase, Users, Shield, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface SettingsSection {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  items: {
    label: string
    path: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

const settingsSections: SettingsSection[] = [
  {
    title: 'Client Configuration',
    description: 'Manage client-related settings',
    icon: Building2,
    path: '/settings/clients',
    items: [
      { label: 'Industries', path: '/settings/industries', icon: Briefcase },
    ],
  },
  {
    title: 'Service Configuration',
    description: 'Manage service-related settings',
    icon: Briefcase,
    path: '/settings/services',
    items: [
      { label: 'Service Categories', path: '/settings/service-categories', icon: Briefcase },
      { label: 'Service Providers', path: '/settings/service-providers', icon: Users },
    ],
  },
  {
    title: 'System Configuration',
    description: 'Manage system-wide settings',
    icon: Settings,
    path: '/settings/system',
    items: [
      { label: 'Roles & Permissions', path: '/settings/roles', icon: Shield },
      { label: 'KPIs & Metrics', path: '/settings/kpis', icon: BarChart3 },
    ],
  },
]

export function SettingsPage() {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Settings', 'Manage system configuration and settings')
    return () => setPageTitle(null)
  }, [setPageTitle])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Manage configuration models and system settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => {
            const SectionIcon = section.icon
            return (
              <div
                key={section.path}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <SectionIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          'text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                        )}
                      >
                        <ItemIcon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}

