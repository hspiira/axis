/**
 * Contract Billing Tab
 *
 * Displays billing information, payment history, and payment status
 */

import { CreditCard, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { type ContractDetail, PaymentStatus } from '@/api/contracts'
import { formatDate, formatCurrency } from '@/utils/formatters'

interface ContractBillingTabProps {
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
    success: 'bg-emerald-500/10 border border-emerald-500/20',
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

export function ContractBillingTab({ contract }: ContractBillingTabProps) {
  const getPaymentStatusBadge = () => {
    const statusClasses = {
      [PaymentStatus.PAID]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      [PaymentStatus.PENDING]: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
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

  return (
    <div className="space-y-6">
      {/* Payment Status Overview */}
      <Section
        icon={<CreditCard className="h-5 w-5 text-emerald-400" />}
        title="Payment Status"
        variant={
          contract.payment_status === PaymentStatus.PAID
            ? 'success'
            : contract.payment_status === PaymentStatus.OVERDUE
            ? 'warning'
            : 'default'
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Current Status</span>
            {getPaymentStatusBadge()}
          </div>
          {contract.is_payment_overdue && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>Payment is overdue</span>
            </div>
          )}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Information */}
        <Section icon={<DollarSign className="h-5 w-5 text-emerald-400" />} title="Billing Details">
          <div className="space-y-3">
            <InfoRow
              label="Billing Rate"
              value={formatCurrency(parseFloat(contract.billing_rate), contract.currency)}
            />
            <InfoRow label="Currency" value={contract.currency} />
            <InfoRow label="Payment Frequency" value={contract.payment_frequency || '—'} />
            {contract.payment_terms && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Payment Terms:</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {contract.payment_terms}
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Payment Schedule */}
        <Section icon={<Calendar className="h-5 w-5 text-emerald-400" />} title="Payment Schedule">
          <div className="space-y-3">
            {contract.last_billing_date && (
              <InfoRow label="Last Billing" value={formatDate(contract.last_billing_date)} />
            )}
            {contract.next_billing_date && (
              <InfoRow
                label="Next Billing"
                value={
                  <span
                    className={
                      new Date(contract.next_billing_date) < new Date()
                        ? 'text-yellow-400'
                        : 'text-white'
                    }
                  >
                    {formatDate(contract.next_billing_date)}
                  </span>
                }
              />
            )}
            {contract.renewal_date && (
              <InfoRow label="Renewal Date" value={formatDate(contract.renewal_date)} />
            )}
          </div>
        </Section>
      </div>

      {/* Payment History Placeholder */}
      <Section icon={<CreditCard className="h-5 w-5 text-emerald-400" />} title="Payment History">
        <div className="text-center py-8">
          <p className="text-gray-400">Payment history will be displayed here</p>
          <p className="text-sm text-gray-500 mt-2">Feature coming soon</p>
        </div>
      </Section>
    </div>
  )
}

