/**
 * Client Detail Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display comprehensive client information
 * - Open/Closed: Uses generic DetailModal for extensibility
 * - Dependency Inversion: Depends on reusable UI components
 */

import {
  Building2,
  MapPin,
  User,
  Briefcase,
  FileText,
  Calendar,
  CheckCircle,
  Globe,
  Mail,
  Phone,
} from 'lucide-react'
import { type ClientDetail } from '@/api/clients'
import { DetailModal, type DetailSection } from '@/components/ui/DetailModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/utils/formatters'

interface ClientDetailModalProps {
  client: ClientDetail
  isOpen: boolean
  onClose: () => void
  onEdit?: (client: ClientDetail) => void
}

export function ClientDetailModal({ client, isOpen, onClose, onEdit }: ClientDetailModalProps) {
  const sections: DetailSection[] = [
    {
      title: 'Basic Information',
      icon: <Building2 className="h-5 w-5 text-emerald-400" />,
      items: [
        { label: 'Client Name', value: client.name },
        { label: 'Status', value: client.status },
        { label: 'Industry', value: client.industry?.name || client.industry_name },
        { label: 'Verified', value: client.is_verified ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'Contact Information',
      icon: <User className="h-5 w-5 text-emerald-400" />,
      items: [
        { label: 'Email', value: client.email, icon: <Mail className="h-4 w-4" /> },
        { label: 'Phone', value: client.phone, icon: <Phone className="h-4 w-4" /> },
        { label: 'Contact Person', value: client.contact_person },
        {
          label: 'Contact Email',
          value: client.contact_email,
          icon: <Mail className="h-4 w-4" />,
        },
        {
          label: 'Contact Phone',
          value: client.contact_phone,
          icon: <Phone className="h-4 w-4" />,
        },
        {
          label: 'Website',
          value: client.website,
          icon: <Globe className="h-4 w-4" />,
          link: true,
        },
        { label: 'Preferred Contact', value: client.preferred_contact_method },
      ],
    },
    {
      title: 'Location Information',
      icon: <MapPin className="h-5 w-5 text-emerald-400" />,
      items: [
        { label: 'Address', value: client.address, className: 'md:col-span-2' },
        { label: 'Billing Address', value: client.billing_address, className: 'md:col-span-2' },
        { label: 'Timezone', value: client.timezone },
      ],
    },
    {
      title: 'Business Information',
      icon: <Briefcase className="h-5 w-5 text-emerald-400" />,
      items: [
        { label: 'Tax ID', value: client.tax_id },
        { label: 'Industry Code', value: client.industry?.code },
      ],
    },
    {
      title: 'Additional Information',
      icon: <FileText className="h-5 w-5 text-emerald-400" />,
      columns: 1,
      items: [{ label: 'Notes', value: client.notes, className: 'md:col-span-2' }],
    },
    {
      title: 'Metadata',
      icon: <Calendar className="h-5 w-5 text-emerald-400" />,
      items: [
        { label: 'Created At', value: formatDate(client.created_at) },
        { label: 'Updated At', value: formatDate(client.updated_at) },
      ],
    },
  ]

  const subtitle = (
    <>
      <StatusBadge status={client.status} />
      {client.is_verified && <CheckCircle className="h-5 w-5 text-emerald-400" />}
      {client.industry_name && (
        <span className="text-sm text-gray-400">
          <Briefcase className="inline h-4 w-4 mr-1" />
          {client.industry_name}
        </span>
      )}
    </>
  )

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      onEdit={onEdit ? () => onEdit(client) : undefined}
      title={client.name}
      subtitle={subtitle}
      sections={sections}
    />
  )
}
