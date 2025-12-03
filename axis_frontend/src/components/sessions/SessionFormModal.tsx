/**
 * Session Form Modal Component
 *
 * Modal for creating and editing service sessions.
 */

import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import type { ServiceSessionFormData, SessionStatus } from '@/api/services'
import { SessionStatus as SessionStatusEnum } from '@/api/services'
import { FormField } from '@/components/forms/FormField'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormButton } from '@/components/forms/FormButton'
import { useServices } from '@/hooks/useServices'
import { useProviders } from '@/hooks/useServices'
import { usePersons } from '@/hooks/usePersons'

interface SessionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServiceSessionFormData) => Promise<void>
  initialData?: ServiceSessionFormData
  loading?: boolean
  title?: string
}

export function SessionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  title = 'Schedule New Session',
}: SessionFormModalProps) {
  const [formData, setFormData] = useState<ServiceSessionFormData>({
    service_id: '',
    provider_id: '',
    person_id: '',
    scheduled_at: '',
  })

  const { data: services = [] } = useServices()
  const { data: providers = [] } = useProviders()
  const personsQuery = usePersons()
  const persons = personsQuery.data?.results || []

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        service_id: '',
        provider_id: '',
        person_id: '',
        scheduled_at: '',
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (field: keyof ServiceSessionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-gray-900 border border-white/10 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Service <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => handleChange('service_id', e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                <option value="">Select a service...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Person Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Person (Employee/Dependent) <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.person_id}
                onChange={(e) => handleChange('person_id', e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                <option value="">Select a person...</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.profile.full_name} ({person.person_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provider <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.provider_id}
                onChange={(e) => handleChange('provider_id', e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                <option value="">Select a provider...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.type}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled At */}
            <div className="md:col-span-2">
              <FormField
                label="Scheduled Date & Time"
                name="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => handleChange('scheduled_at', e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status || SessionStatusEnum.SCHEDULED}
                onChange={(e) => handleChange('status', e.target.value as SessionStatus)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                {Object.values(SessionStatusEnum).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <FormField
                label="Location"
                name="location"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value || undefined)}
                placeholder="e.g., Office, Online, Phone"
              />
            </div>

            {/* Group Session Toggle */}
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_group_session"
                checked={formData.is_group_session || false}
                onChange={(e) => handleChange('is_group_session', e.target.checked)}
                className="w-4 h-4 rounded bg-gray-800/50 border-white/10 text-emerald-600 focus:ring-emerald-500/50"
              />
              <label htmlFor="is_group_session" className="text-sm font-medium text-gray-300">
                Group Session
              </label>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <FormTextarea
                label="Session Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value || undefined)}
                placeholder="Add any notes or special instructions for this session..."
                rows={3}
              />
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
              {initialData ? 'Update Session' : 'Schedule Session'}
            </FormButton>
          </div>
        </form>
      </div>
    </div>
  )
}
