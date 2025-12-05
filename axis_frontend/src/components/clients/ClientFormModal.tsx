/**
 * Client Form Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display client form in a modal
 * - Open/Closed: Can be extended with additional modal features
 */

import { BaseModal } from '@/components/ui'
import { ClientForm } from './ClientForm'
import type { ClientFormData } from '@/api/clients'

interface ClientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClientFormData) => Promise<void>
  initialData?: Partial<ClientFormData>
  isLoading?: boolean
  title?: string
}

export function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  title = 'Add New Client',
}: ClientFormModalProps) {
  const handleSubmit = async (data: ClientFormData) => {
    await onSubmit(data)
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="4xl"
      isLoading={isLoading}
    >
      <div className="p-6">
        <ClientForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </BaseModal>
  )
}

