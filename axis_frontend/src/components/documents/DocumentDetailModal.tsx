/**
 * Document Detail Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display comprehensive document information
 * - Open/Closed: Extensible with additional document features
 */

import { useState, useEffect } from 'react'
import { X, Download, History, FileText, Lock, ExternalLink, Calendar, User, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DetailModal, type DetailSection } from '@/components/ui/DetailModal'
import type { DocumentDetail } from '@/api/documents'
import { formatShortDate } from '@/utils/formatters'

interface DocumentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  document: DocumentDetail | null
  onDownload?: () => void
  onViewVersions?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  contract: 'Contract',
  certification: 'Certification',
  kpi_report: 'KPI Report',
  feedback_summary: 'Feedback Summary',
  billing_report: 'Billing Report',
  utilization_report: 'Utilization Report',
  other: 'Other',
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-500/20 text-gray-400',
  Published: 'bg-emerald-500/20 text-emerald-400',
  Archived: 'bg-yellow-500/20 text-yellow-400',
  Expired: 'bg-red-500/20 text-red-400',
}

export function DocumentDetailModal({
  isOpen,
  onClose,
  document,
  onDownload,
  onViewVersions,
}: DocumentDetailModalProps) {
  if (!document) return null

  const sections: DetailSection[] = [
    {
      title: 'Document Information',
      icon: <FileText className="h-5 w-5 text-emerald-400" />,
      items: [
        { label: 'Title', value: document.title },
        { label: 'Type', value: TYPE_LABELS[document.type] || document.type },
        {
          label: 'Status',
          value: document.status,
          className: cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[document.status]),
        },
        { label: 'Version', value: `v${document.version}${document.is_latest ? ' (Latest)' : ''}` },
        { label: 'Description', value: document.description || 'No description' },
      ],
    },
    {
      title: 'File Information',
      icon: <FileText className="h-5 w-5 text-emerald-400" />,
      items: [
        { label: 'Filename', value: document.filename || 'N/A' },
        { label: 'File Type', value: document.file_type || 'N/A' },
        {
          label: 'File Size',
          value: document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
        },
        {
          label: 'File URL',
          value: document.file_url || document.url || 'N/A',
          link: !!(document.file_url || document.url),
          icon: <ExternalLink className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Access & Security',
      icon: <Lock className="h-5 w-5 text-yellow-400" />,
      items: [
        {
          label: 'Confidential',
          value: document.is_confidential ? 'Yes' : 'No',
          className: document.is_confidential ? 'text-yellow-400' : '',
        },
        { label: 'Active', value: document.is_active ? 'Yes' : 'No' },
        { label: 'Expired', value: document.is_expired ? 'Yes' : 'No' },
        {
          label: 'Expiry Date',
          value: document.expiry_date ? formatShortDate(document.expiry_date) : 'No expiry',
        },
      ],
    },
    {
      title: 'Relationships',
      icon: <Building2 className="h-5 w-5 text-purple-400" />,
      items: [
        { label: 'Client', value: document.client_name || 'Not assigned' },
        {
          label: 'Contract',
          value: document.contract_start_date
            ? `Contract (Started: ${formatShortDate(document.contract_start_date)})`
            : 'Not assigned',
        },
        { label: 'Uploaded By', value: document.uploaded_by_email || 'Unknown' },
      ],
    },
    {
      title: 'Metadata',
      icon: <Calendar className="h-5 w-5 text-gray-400" />,
      items: [
        { label: 'Created', value: formatShortDate(document.created_at) },
        { label: 'Updated', value: formatShortDate(document.updated_at) },
        {
          label: 'Tags',
          value: document.tags && document.tags.length > 0 ? document.tags.join(', ') : 'No tags',
        },
      ],
    },
  ]

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              STATUS_COLORS[document.status]
            )}
          >
            {document.status}
          </span>
          {document.is_confidential && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              <Lock className="h-3 w-3" />
              Confidential
            </span>
          )}
          {document.is_expired && (
            <span className="inline-flex items-center px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
              Expired
            </span>
          )}
          {!document.is_latest && (
            <span className="text-xs text-gray-500">Version {document.version}</span>
          )}
        </div>
      }
      sections={sections}
      onEdit={undefined}
    />
  )
}

