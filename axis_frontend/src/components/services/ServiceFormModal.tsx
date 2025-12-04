/**
 * Service Form Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle service creation and editing
 * - Open/Closed: Extensible with additional fields
 */

import { useState, useEffect } from 'react'
import { X, Stethoscope } from 'lucide-react'
import { ServiceStatus, type ServiceFormData } from '@/api/services'
import { useServiceCategories } from '@/hooks/useServices'
import { FormField } from '@/components/forms/FormField'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormButton } from '@/components/forms/FormButton'

interface ServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServiceFormData) => Promise<void>
  initialData?: ServiceFormData
  isLoading?: boolean
  title?: string
}

export function ServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  title = 'Add New Service',
}: ServiceFormModalProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    status: ServiceStatus.ACTIVE,
    is_billable: false,
    requires_provider: false,
  })

  const { data: categoriesData } = useServiceCategories()
  const categories = Array.isArray(categoriesData) ? categoriesData : []

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        name: '',
        status: ServiceStatus.ACTIVE,
        is_billable: false,
        requires_provider: false,
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (field: keyof ServiceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-gray-900 border border-white/10 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Stethoscope className="h-5 w-5 text-cream-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Name */}
            <div className="md:col-span-2">
              <FormField
                label="Service Name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Individual Counseling"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <FormTextarea
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value || undefined)}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            {/* Category */}
            <FormSelect
              label="Category"
              name="category_id"
              value={formData.category_id || ''}
              onChange={(e) => handleChange('category_id', e.target.value || undefined)}
              options={[
                { value: '', label: 'No Category' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />

            {/* Status */}
            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as ServiceStatus)}
              options={Object.values(ServiceStatus).map((status) => ({
                value: status,
                label: status,
              }))}
              required
            />

            {/* Duration */}
            <FormField
              label="Duration (minutes)"
              name="duration_minutes"
              type="number"
              value={formData.duration_minutes?.toString() || ''}
              onChange={(e) =>
                handleChange(
                  'duration_minutes',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="e.g., 60"
            />

            {/* Default Price */}
            <FormField
              label="Default Price"
              name="default_price"
              value={formData.default_price || ''}
              onChange={(e) => handleChange('default_price', e.target.value || undefined)}
              placeholder="e.g., 150.00"
            />

            {/* Max Sessions */}
            <FormField
              label="Max Sessions Per Person"
              name="max_sessions_per_person"
              type="number"
              value={formData.max_sessions_per_person?.toString() || ''}
              onChange={(e) =>
                handleChange(
                  'max_sessions_per_person',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Leave empty for unlimited"
            />

            {/* Checkboxes */}
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_billable || false}
                  onChange={(e) => handleChange('is_billable', e.target.checked)}
                  className="h-4 w-4 rounded bg-white/5 border-white/10 text-amber-600 focus:ring-cream-500/50"
                />
                <span className="text-sm text-gray-300">Billable Service</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_provider || false}
                  onChange={(e) => handleChange('requires_provider', e.target.checked)}
                  className="h-4 w-4 rounded bg-white/5 border-white/10 text-amber-600 focus:ring-cream-500/50"
                />
                <span className="text-sm text-gray-300">Requires Provider</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <FormButton type="submit" loading={isLoading}>
              {initialData ? 'Update Service' : 'Create Service'}
            </FormButton>
          </div>
        </form>
      </div>
    </div>
  )
}
