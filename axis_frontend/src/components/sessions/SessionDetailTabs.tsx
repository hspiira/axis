/**
 * Session Detail Tabs Component
 *
 * Tab navigation for session detail page with URL-based active tab management.
 */

import { useSearchParams } from 'react-router-dom'
import { Info, FileText, Star, Paperclip, History } from 'lucide-react'
import { type ServiceSession } from '@/api/services'
import { SessionOverviewTab } from './tabs/SessionOverviewTab'
import { SessionNotesTab } from './tabs/SessionNotesTab'
import { SessionFeedbackTab } from './tabs/SessionFeedbackTab'
import { SessionDocumentsTab } from './tabs/SessionDocumentsTab'
import { SessionHistoryTab } from './tabs/SessionHistoryTab'

export type TabId = 'overview' | 'notes' | 'feedback' | 'documents' | 'history'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  component: React.ComponentType<{ session: ServiceSession }>
}

interface SessionDetailTabsProps {
  session: ServiceSession
  activeTab?: TabId
}

export function SessionDetailTabs({ session, activeTab: propActiveTab }: SessionDetailTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlActiveTab = (searchParams.get('tab') || 'overview') as TabId
  const activeTab = (propActiveTab as TabId | undefined) ?? urlActiveTab

  const handleTabChange = (tabId: TabId) => {
    const newParams = new URLSearchParams(searchParams)
    if (tabId === 'overview') {
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
      component: SessionOverviewTab,
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <FileText className="h-4 w-4" />,
      component: SessionNotesTab,
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: <Star className="h-4 w-4" />,
      component: SessionFeedbackTab,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <Paperclip className="h-4 w-4" />,
      component: SessionDocumentsTab,
    },
    {
      id: 'history',
      label: 'History',
      icon: <History className="h-4 w-4" />,
      component: SessionHistoryTab,
    },
  ]

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || SessionOverviewTab

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-cream-500/10">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cream-500 text-cream-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      <div className="py-4">
        <ActiveComponent session={session} />
      </div>
    </div>
  )
}
