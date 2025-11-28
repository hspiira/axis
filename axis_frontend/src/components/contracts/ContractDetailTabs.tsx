/**
 * Contract Detail Tabs Component
 *
 * SOLID Principles:
 * - Single Responsibility: Manages tabbed navigation for contract details
 * - Open/Closed: Easy to add new tabs without modifying existing code
 * - Interface Segregation: Each tab is a separate component
 */

import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  CreditCard,
  Activity,
  StickyNote,
  File,
} from 'lucide-react'
import { type ContractDetail } from '@/api/contracts'
import { cn } from '@/lib/utils'
import { ContractOverviewTab } from './tabs/ContractOverviewTab'
import { ContractBillingTab } from './tabs/ContractBillingTab'
import { ContractDocumentsTab } from './tabs/ContractDocumentsTab'
import { ContractNotesTab } from './tabs/ContractNotesTab'
import { ContractActivityTab } from './tabs/ContractActivityTab'

interface ContractDetailTabsProps {
  contract: ContractDetail
  activeTab?: string
  onEdit?: () => void
}

type TabId = 'overview' | 'billing' | 'documents' | 'notes' | 'activity'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  component: React.ComponentType<{ contract: ContractDetail }>
}

export function ContractDetailTabs({ contract }: ContractDetailTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read activeTab directly from URL searchParams to ensure it updates when URL changes
  const activeTab = (searchParams.get('tab') || 'overview') as TabId

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
      icon: <FileText className="h-4 w-4" />,
      component: ContractOverviewTab,
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <CreditCard className="h-4 w-4" />,
      component: ContractBillingTab,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <File className="h-4 w-4" />,
      component: ContractDocumentsTab,
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <StickyNote className="h-4 w-4" />,
      component: ContractNotesTab,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Activity className="h-4 w-4" />,
      component: ContractActivityTab,
    },
  ]

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-gray-950/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 px-6 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {ActiveComponent && <ActiveComponent contract={contract} />}
        </div>
      </div>
    </div>
  )
}
