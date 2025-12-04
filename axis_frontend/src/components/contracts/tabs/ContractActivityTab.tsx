/**
 * Contract Activity Tab
 *
 * Displays activity history for this contract
 */

import { Activity, FileCheck, RefreshCw, XCircle, CheckCircle, Calendar } from 'lucide-react'
import { type ContractDetail, ContractStatus } from '@/api/contracts'
import { formatDate } from '@/utils/formatters'

interface ContractActivityTabProps {
  contract: ContractDetail
}

interface ActivityItem {
  id: string
  type: 'created' | 'activated' | 'terminated' | 'renewed' | 'updated' | 'payment'
  title: string
  description: string
  date: string
  icon: React.ReactNode
}

export function ContractActivityTab({ contract }: ContractActivityTabProps) {
  // Build activity timeline from contract data
  const activities: ActivityItem[] = []

  // Created
  activities.push({
    id: 'created',
    type: 'created',
    title: 'Contract Created',
    description: 'Contract was created',
    date: contract.created_at,
    icon: <FileCheck className="h-4 w-4" />,
  })

  // Activated
  if (contract.status === ContractStatus.ACTIVE && contract.is_active) {
    activities.push({
      id: 'activated',
      type: 'activated',
      title: 'Contract Activated',
      description: 'Contract was activated',
      date: contract.updated_at,
      icon: <CheckCircle className="h-4 w-4" />,
    })
  }

  // Terminated
  if (contract.status === ContractStatus.TERMINATED && contract.termination_reason) {
    activities.push({
      id: 'terminated',
      type: 'terminated',
      title: 'Contract Terminated',
      description: contract.termination_reason,
      date: contract.updated_at,
      icon: <XCircle className="h-4 w-4" />,
    })
  }

  // Renewed
  if (contract.status === ContractStatus.RENEWED) {
    activities.push({
      id: 'renewed',
      type: 'renewed',
      title: 'Contract Renewed',
      description: contract.renewal_date
        ? `Renewed until ${formatDate(contract.renewal_date)}`
        : 'Contract was renewed',
      date: contract.renewal_date || contract.updated_at,
      icon: <RefreshCw className="h-4 w-4" />,
    })
  }

  // Payment status changes
  if (contract.payment_status) {
    activities.push({
      id: 'payment',
      type: 'payment',
      title: `Payment Status: ${contract.payment_status}`,
      description: `Payment status updated to ${contract.payment_status}`,
      date: contract.last_billing_date || contract.updated_at,
      icon: <Calendar className="h-4 w-4" />,
    })
  }

  // Updated
  if (contract.updated_at !== contract.created_at) {
    activities.push({
      id: 'updated',
      type: 'updated',
      title: 'Contract Updated',
      description: 'Contract information was updated',
      date: contract.updated_at,
      icon: <FileCheck className="h-4 w-4" />,
    })
  }

  // Sort by date (newest first)
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'created':
      case 'activated':
      case 'renewed':
        return 'text-cream-400 bg-amber-500/10 border-cream-500/20'
      case 'terminated':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'payment':
        return 'text-cream-400 bg-amber-500/10 border-cream-500/20'
      default:
        return 'text-gray-400 bg-white/5 border-white/10'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-cream-400" />
            Activity History
          </h3>
        </div>

        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                <div className="shrink-0 mt-0.5">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No activity found for this contract</p>
          </div>
        )}
      </div>
    </div>
  )
}

