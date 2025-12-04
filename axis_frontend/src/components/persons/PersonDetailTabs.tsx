/**
 * Person Detail Tabs Component
 *
 * SOLID Principles:
 * - Single Responsibility: Manages tabbed navigation for person details
 * - Open/Closed: Easy to add new tabs without modifying existing code
 * - Interface Segregation: Each tab is a separate component
 */

import { useSearchParams } from 'react-router-dom'
import {
  User,
  Heart,
  FileText,
  ClipboardList,
  Activity,
  Users,
  Calendar,
} from 'lucide-react'
import { type Person, PersonType } from '@/api/persons'
import { cn } from '@/lib/utils'
import { PersonOverviewTab } from './tabs/PersonOverviewTab'
import { PersonServicesTab } from './tabs/PersonServicesTab'
import { PersonSessionsTab } from './tabs/PersonSessionsTab'
import { PersonDocumentsTab } from './tabs/PersonDocumentsTab'
import { PersonNotesTab } from './tabs/PersonNotesTab'
import { PersonActivityTab } from './tabs/PersonActivityTab'
import { PersonFamilyTab } from './tabs/PersonFamilyTab'

interface PersonDetailTabsProps {
  person: Person
  activeTab?: string
  onEdit?: () => void
}

type TabId = 'overview' | 'family' | 'services' | 'sessions' | 'documents' | 'notes' | 'activity'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  component: React.ComponentType<{ person: Person }>
  show?: (person: Person) => boolean
}

export function PersonDetailTabs({ person, activeTab: propActiveTab, onEdit }: PersonDetailTabsProps) {
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
      icon: <User className="h-4 w-4" />,
      component: PersonOverviewTab,
    },
    {
      id: 'family',
      label: 'Family',
      icon: <Users className="h-4 w-4" />,
      component: PersonFamilyTab,
      show: (person) =>
        person.person_type === PersonType.CLIENT_EMPLOYEE || person.person_type === PersonType.DEPENDENT,
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Heart className="h-4 w-4" />,
      component: PersonServicesTab,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <Calendar className="h-4 w-4" />,
      component: PersonSessionsTab,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText className="h-4 w-4" />,
      component: PersonDocumentsTab,
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <ClipboardList className="h-4 w-4" />,
      component: PersonNotesTab,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Activity className="h-4 w-4" />,
      component: PersonActivityTab,
    },
  ]

  const visibleTabs = tabs.filter((tab) => !tab.show || tab.show(person))
  const ActiveComponent = visibleTabs.find((tab) => tab.id === activeTab)?.component

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-gray-950/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 px-6 overflow-x-auto scrollbar-thin">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                  'border-b-2 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-cream-500 text-cream-400'
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
          {ActiveComponent && <ActiveComponent person={person} />}
        </div>
      </div>
    </div>
  )
}
