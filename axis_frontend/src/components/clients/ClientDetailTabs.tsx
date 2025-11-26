/**
 * Client Detail Tabs Component
 *
 * SOLID Principles:
 * - Single Responsibility: Manages tabbed navigation for client details
 * - Open/Closed: Easy to add new tabs without modifying existing code
 * - Interface Segregation: Each tab is a separate component
 */

import { useState } from 'react'
import {
  Building2,
  FileText,
  Users,
  Activity,
  Briefcase,
} from 'lucide-react'
import { type ClientDetail } from '@/api/clients'
import { cn } from '@/lib/utils'
import { ClientOverviewTab } from './tabs/ClientOverviewTab'
import { ClientContractsTab } from './tabs/ClientContractsTab'
import { ClientDocumentsTab } from './tabs/ClientDocumentsTab'
import { ClientPersonsTab } from './tabs/ClientPersonsTab'
import { ClientActivityTab } from './tabs/ClientActivityTab'

interface ClientDetailTabsProps {
  client: ClientDetail
  onEdit?: () => void
}

type TabId = 'overview' | 'contracts' | 'documents' | 'persons' | 'activity'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  component: React.ComponentType<{ client: ClientDetail }>
  badge?: number
}

export function ClientDetailTabs({ client, onEdit }: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Building2 className="h-4 w-4" />,
      component: ClientOverviewTab,
    },
    {
      id: 'contracts',
      label: 'Contracts',
      icon: <Briefcase className="h-4 w-4" />,
      component: ClientContractsTab,
      badge: client.active_contracts_count,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText className="h-4 w-4" />,
      component: ClientDocumentsTab,
    },
    {
      id: 'persons',
      label: 'Persons',
      icon: <Users className="h-4 w-4" />,
      component: ClientPersonsTab,
      badge: client.total_employees,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Activity className="h-4 w-4" />,
      component: ClientActivityTab,
    },
  ]

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-gray-950/50 sticky top-0 z-10">
        <div className="flex gap-1 px-6 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                'border-b-2 whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-white/20'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {ActiveComponent && <ActiveComponent client={client} />}
      </div>
    </div>
  )
}
