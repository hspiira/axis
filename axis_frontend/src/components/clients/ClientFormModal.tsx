/**
 * Client Form Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display client form in a modal
 * - Open/Closed: Can be extended with additional modal features
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ClientForm } from './ClientForm'
import type { ClientFormData } from '@/api/clients'
import { cn } from '@/lib/utils'

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
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  const handleSubmit = async (data: ClientFormData) => {
    await onSubmit(data)
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-4xl bg-gray-950 border border-white/10 shadow-2xl overflow-hidden',
          'rounded-xl transition-all duration-300',
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gray-950/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Close modal"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <ClientForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

