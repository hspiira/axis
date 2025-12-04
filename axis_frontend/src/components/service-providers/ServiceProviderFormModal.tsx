/**
 * Service Provider Form Modal Component
 *
 * Modal form for creating and editing service providers.
 */

import { useEffect, useState } from 'react'
import { X, Shield } from 'lucide-react'
import type { ServiceProviderFormData, ProviderStatus, ServiceProviderType } from '@/api/services'
import { ProviderStatus as ProviderStatusEnum, ServiceProviderType as ProviderTypeEnum } from '@/api/services'
import { FormField } from '@/components/forms/FormField'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormButton } from '@/components/forms/FormButton'

interface ServiceProviderFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServiceProviderFormData) => Promise<void>
  initialData?: ServiceProviderFormData
  loading?: boolean
  title?: string
}

export function ServiceProviderFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  title = 'Create New Service Provider',
}: ServiceProviderFormModalProps) {
  const [formData, setFormData] = useState<ServiceProviderFormData>({
    name: '',
    type: ProviderTypeEnum.COUNSELOR,
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        name: '',
        type: ProviderTypeEnum.COUNSELOR,
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (field: keyof ServiceProviderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'qualifications' | 'specializations', value: string) => {
    try {
      const parsed = value ? JSON.parse(value) : []
      handleChange(field, parsed)
    } catch {
      // Invalid JSON, ignore
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-gray-900 border border-white/10 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-cream-400" />
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <FormField
                label="Provider Name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Dr. Sarah Johnson, Mental Health Clinic"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Provider Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as ServiceProviderType)}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cream-500 focus:border-transparent"
              >
                <option value={ProviderTypeEnum.COUNSELOR}>Counselor</option>
                <option value={ProviderTypeEnum.CLINIC}>Clinic</option>
                <option value={ProviderTypeEnum.HOTLINE}>Hotline</option>
                <option value={ProviderTypeEnum.COACH}>Coach</option>
                <option value={ProviderTypeEnum.OTHER}>Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status || ProviderStatusEnum.ACTIVE}
                onChange={(e) => handleChange('status', e.target.value as ProviderStatus)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cream-500 focus:border-transparent"
              >
                <option value={ProviderStatusEnum.ACTIVE}>Active</option>
                <option value={ProviderStatusEnum.INACTIVE}>Inactive</option>
                <option value={ProviderStatusEnum.ON_LEAVE}>On Leave</option>
                <option value={ProviderStatusEnum.SUSPENDED}>Suspended</option>
                <option value={ProviderStatusEnum.TERMINATED}>Terminated</option>
                <option value={ProviderStatusEnum.RESIGNED}>Resigned</option>
              </select>
            </div>

            {/* Contact Email */}
            <FormField
              label="Contact Email"
              name="contact_email"
              type="email"
              value={formData.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value || undefined)}
              placeholder="provider@example.com"
            />

            {/* Contact Phone */}
            <FormField
              label="Contact Phone"
              name="contact_phone"
              type="tel"
              value={formData.contact_phone || ''}
              onChange={(e) => handleChange('contact_phone', e.target.value || undefined)}
              placeholder="+1 (555) 123-4567"
            />

            {/* Location */}
            <div className="md:col-span-2">
              <FormField
                label="Location"
                name="location"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value || undefined)}
                placeholder="e.g., New York, NY or Virtual/Remote"
              />
            </div>

            {/* Verified */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Verification Status
              </label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  checked={formData.is_verified || false}
                  onChange={(e) => handleChange('is_verified', e.target.checked)}
                  className="w-4 h-4 bg-white/5 border border-white/10 rounded text-amber-600 focus:ring-2 focus:ring-cream-500"
                />
                <label className="ml-2 text-sm text-gray-300">
                  Provider is verified
                </label>
              </div>
            </div>

            {/* Rating */}
            <FormField
              label="Rating (0-5)"
              name="rating"
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={formData.rating || ''}
              onChange={(e) => handleChange('rating', e.target.value || undefined)}
              placeholder="4.5"
            />

            {/* Qualifications */}
            <div className="md:col-span-2">
              <FormTextarea
                label="Qualifications (JSON Array)"
                name="qualifications"
                value={
                  formData.qualifications
                    ? JSON.stringify(formData.qualifications, null, 2)
                    : ''
                }
                onChange={(e) => handleArrayChange('qualifications', e.target.value)}
                placeholder='["Licensed Professional Counselor", "PhD in Psychology"]'
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter qualifications as JSON array (optional)
              </p>
            </div>

            {/* Specializations */}
            <div className="md:col-span-2">
              <FormTextarea
                label="Specializations (JSON Array)"
                name="specializations"
                value={
                  formData.specializations
                    ? JSON.stringify(formData.specializations, null, 2)
                    : ''
                }
                onChange={(e) => handleArrayChange('specializations', e.target.value)}
                placeholder='["Anxiety", "Depression", "Trauma", "Family Counseling"]'
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter specializations as JSON array (optional)
              </p>
            </div>

            {/* Availability */}
            <div className="md:col-span-2">
              <FormTextarea
                label="Availability Schedule (JSON)"
                name="availability"
                value={
                  formData.availability
                    ? JSON.stringify(formData.availability, null, 2)
                    : ''
                }
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : undefined
                    handleChange('availability', parsed)
                  } catch {
                    // Invalid JSON, keep the string value for user to fix
                  }
                }}
                placeholder='{"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"]}'
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter availability schedule as JSON object (optional)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <FormButton type="submit" loading={loading}>
              {initialData ? 'Update Provider' : 'Create Provider'}
            </FormButton>
          </div>
        </form>
      </div>
    </div>
  )
}
