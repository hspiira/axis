/**
 * Service Provider Detail Tabs Component
 *
 * SOLID Principles:
 * - Single Responsibility: Manages tabbed navigation for provider details
 * - Open/Closed: Easy to add new tabs without modifying existing code
 * - Interface Segregation: Each tab is a separate component
 */

import { useSearchParams } from 'react-router-dom'
import {
  Info,
  Calendar,
  Star,
  Clock,
} from 'lucide-react'
import { type ServiceProvider } from '@/api/services'
import { cn } from '@/lib/utils'
import { ProviderOverviewTab } from './tabs/ProviderOverviewTab'
import { ProviderSessionsTab } from './tabs/ProviderSessionsTab'
import { ProviderRatingsTab } from './tabs/ProviderRatingsTab'
import { ProviderAvailabilityTab } from './tabs/ProviderAvailabilityTab'

interface ServiceProviderDetailTabsProps {
  provider: ServiceProvider
  activeTab?: string
}

type TabId = 'overview' | 'sessions' | 'ratings' | 'availability'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  component: React.ComponentType<{ provider: ServiceProvider }>
}

export function ServiceProviderDetailTabs({ provider, activeTab: propActiveTab }: ServiceProviderDetailTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read activeTab directly from URL searchParams to ensure it updates when URL changes
  const urlActiveTab = (searchParams.get('tab') || 'overview') as TabId
  const activeTab = (propActiveTab as TabId | undefined) ?? urlActiveTab

  // Handle tab change - update URL
  const handleTabChange = (tabId: TabId) => {
    const newParams = new URLSearchParams(searchParams)
    if (tabId === 'overview') {
      // Remove tab param for default tab
      newParams.delete('tab')
    } else {
      newParams.set('tab', tabId)
    }
    setSearchParams(newParams)
  }

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Info className="h-4 w-4" />,
      component: ProviderOverviewTab,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <Calendar className="h-4 w-4" />,
      component: ProviderSessionsTab,
    },
    {
      id: 'ratings',
      label: 'Ratings & Feedback',
      icon: <Star className="h-4 w-4" />,
      component: ProviderRatingsTab,
    },
    {
      id: 'availability',
      label: 'Availability',
      icon: <Clock className="h-4 w-4" />,
      component: ProviderAvailabilityTab,
    },
  ]

  // Find the active tab component
  const ActiveTabComponent = tabs.find((tab) => tab.id === activeTab)?.component || ProviderOverviewTab

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-cream-500/10">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap text-sm font-medium',
                  isActive
                    ? 'border-cream-500 text-cream-400'
                    : 'border-transparent text-theme-secondary hover:text-theme hover:border-cream-500/30'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <ActiveTabComponent provider={provider} />
      </div>
    </div>
  )
}
