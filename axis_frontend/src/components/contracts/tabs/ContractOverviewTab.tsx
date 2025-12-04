/**
 * Contract Overview Tab
 *
 * Comprehensive view of contract information including client, dates, billing, and status
 */

import {
  FileText,
  Building2,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileCheck,
  Clock,
  DollarSign,
} from 'lucide-react'
import { type ContractDetail, ContractStatus, PaymentStatus } from '@/api/contracts'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatCurrency } from '@/utils/formatters'

interface ContractOverviewTabProps {
  contract: ContractDetail
}

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  variant?: 'default' | 'warning' | 'success'
}

function Section({ icon, title, children, variant = 'default' }: SectionProps) {
  const variantClasses = {
    default: 'bg-white/5 border border-white/10',
    warning: 'bg-yellow-500/10 border border-yellow-500/20',
    success: 'bg-amber-500/10 border border-cream-500/20',
  }

  return (
    <div className={`rounded-lg p-6 ${variantClasses[variant]}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  if (!value || value === '—') return null

  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 min-w-fit">{label}:</span>
      <span className="text-white font-medium flex-1">{value}</span>
    </div>
  )
}

export function ContractOverviewTab({ contract }: ContractOverviewTabProps) {
  const getStatusIcon = () => {
    switch (contract.status) {
      case ContractStatus.ACTIVE:
        return <CheckCircle className="h-4 w-4" />
      case ContractStatus.EXPIRED:
        return <XCircle className="h-4 w-4" />
      case ContractStatus.RENEWED:
        return <RefreshCw className="h-4 w-4" />
      case ContractStatus.TERMINATED:
        return <XCircle className="h-4 w-4" />
      default:
        return <FileCheck className="h-4 w-4" />
    }
  }

  const getPaymentStatusBadge = () => {
    const statusClasses = {
      [PaymentStatus.PAID]: 'bg-amber-500/10 text-cream-400 border-cream-500/20',
      [PaymentStatus.PENDING]: 'bg-yellow-500/10 text-cream-400 border-yellow-500/20',
      [PaymentStatus.OVERDUE]: 'bg-red-500/10 text-red-400 border-red-500/20',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          statusClasses[contract.payment_status] || statusClasses[PaymentStatus.PENDING]
        }`}
      >
        {contract.payment_status}
      </span>
    )
  }

  const calculateDuration = () => {
    const start = new Date(contract.start_date)
    const end = new Date(contract.end_date)
    const diffMonths = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )
    return diffMonths > 0 ? `${diffMonths} months` : '—'
  }

  return (
    <div className="space-y-6">
      {/* Contract Header */}
      <div className="flex items-start gap-6 bg-white/5 border border-white/10 rounded-lg p-6">
        {/* Icon */}
        <div className="shrink-0">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cream-500/20 to-cream-600/20 border-2 border-cream-500/30 flex items-center justify-center">
            <FileText className="h-12 w-12 text-cream-400" />
          </div>
        </div>

        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white mb-2">
            {contract.client?.name || 'Unknown Client'}
          </h2>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <StatusBadge status={contract.status} />
            {getPaymentStatusBadge()}
            {contract.is_active && (
              <span className="flex items-center gap-1 text-xs text-cream-400 px-2 py-1 bg-amber-500/10 rounded-full">
                <CheckCircle className="h-3 w-3" />
                Currently Active
              </span>
            )}
            {contract.is_expired && (
              <span className="flex items-center gap-1 text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded-full">
                <XCircle className="h-3 w-3" />
                Expired
              </span>
            )}
            {contract.is_pending_renewal && (
              <span className="flex items-center gap-1 text-xs text-cream-400 px-2 py-1 bg-yellow-500/10 rounded-full">
                <RefreshCw className="h-3 w-3" />
                Pending Renewal
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <DollarSign className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {formatCurrency(parseFloat(contract.billing_rate), contract.currency)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {contract.days_remaining > 0
                  ? `${contract.days_remaining} days remaining`
                  : contract.days_remaining === 0
                  ? 'Expires today'
                  : 'Expired'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <Section icon={<Building2 className="h-5 w-5 text-cream-400" />} title="Client Information">
          <div className="space-y-3">
            <InfoRow label="Client Name" value={contract.client?.name} />
            <InfoRow label="Client Email" value={contract.client?.email} />
            <InfoRow label="Client ID" value={contract.client?.id} />
          </div>
        </Section>

        {/* Contract Period */}
        <Section icon={<Calendar className="h-5 w-5 text-cream-400" />} title="Contract Period">
          <div className="space-y-3">
            <InfoRow label="Start Date" value={formatDate(contract.start_date)} />
            <InfoRow label="End Date" value={formatDate(contract.end_date)} />
            <InfoRow label="Duration" value={calculateDuration()} />
            {contract.renewal_date && (
              <InfoRow label="Renewal Date" value={formatDate(contract.renewal_date)} />
            )}
            <InfoRow
              label="Days Remaining"
              value={
                contract.days_remaining > 0 ? (
                  <span
                    className={
                      contract.days_remaining < 30 ? 'text-cream-400' : 'text-cream-400'
                    }
                  >
                    {contract.days_remaining} days
                  </span>
                ) : (
                  <span className="text-red-400">Expired</span>
                )
              }
            />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Information */}
        <Section icon={<CreditCard className="h-5 w-5 text-cream-400" />} title="Billing Information">
          <div className="space-y-3">
            <InfoRow
              label="Billing Rate"
              value={formatCurrency(parseFloat(contract.billing_rate), contract.currency)}
            />
            <InfoRow label="Currency" value={contract.currency} />
            <InfoRow label="Payment Frequency" value={contract.payment_frequency || '—'} />
            <InfoRow label="Payment Status" value={getPaymentStatusBadge()} />
            {contract.last_billing_date && (
              <InfoRow label="Last Billing" value={formatDate(contract.last_billing_date)} />
            )}
            {contract.next_billing_date && (
              <InfoRow label="Next Billing" value={formatDate(contract.next_billing_date)} />
            )}
          </div>
        </Section>

        {/* Contract Settings */}
        <Section icon={<FileCheck className="h-5 w-5 text-cream-400" />} title="Contract Settings">
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 min-w-fit">Status:</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                {getStatusIcon()}
                {contract.status}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 min-w-fit">Renewable:</span>
              <span
                className={`font-medium flex items-center gap-1.5 ${
                  contract.is_renewable ? 'text-cream-400' : 'text-gray-400'
                }`}
              >
                {contract.is_renewable ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Yes
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    No
                  </>
                )}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 min-w-fit">Auto-Renew:</span>
              <span
                className={`font-medium flex items-center gap-1.5 ${
                  contract.is_auto_renew ? 'text-cream-400' : 'text-gray-400'
                }`}
              >
                {contract.is_auto_renew ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Disabled
                  </>
                )}
              </span>
            </div>
          </div>
        </Section>
      </div>

      {/* Payment Terms */}
      {contract.payment_terms && (
        <Section icon={<FileText className="h-5 w-5 text-cream-400" />} title="Payment Terms">
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {contract.payment_terms}
          </p>
        </Section>
      )}

      {/* Document Information */}
      {(contract.document_url || contract.signed_by || contract.signed_at) && (
        <Section icon={<FileCheck className="h-5 w-5 text-cream-400" />} title="Document Information">
          <div className="space-y-3">
            {contract.document_url && (
              <InfoRow
                label="Document"
                value={
                  <a
                    href={contract.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream-400 hover:text-yellow-300 underline"
                  >
                    View Contract Document
                  </a>
                }
              />
            )}
            <InfoRow label="Signed By" value={contract.signed_by} />
            {contract.signed_at && (
              <InfoRow label="Signed On" value={formatDate(contract.signed_at)} />
            )}
          </div>
        </Section>
      )}

      {/* Termination Reason */}
      {contract.termination_reason && (
        <Section
          icon={<AlertCircle className="h-5 w-5 text-cream-400" />}
          title="Termination Reason"
          variant="warning"
        >
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {contract.termination_reason}
          </p>
        </Section>
      )}

      {/* Notes */}
      {contract.notes && (
        <Section icon={<FileText className="h-5 w-5 text-cream-400" />} title="Notes">
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{contract.notes}</p>
        </Section>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/10">
        <span>Created: {formatDate(contract.created_at)}</span>
        <span>Last Updated: {formatDate(contract.updated_at)}</span>
      </div>
    </div>
  )
}
