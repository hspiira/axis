/**
 * Client Form Component - Tabbed Single-Page Form
 *
 * SOLID Principles:
 * - Single Responsibility: Handle client form input and validation
 * - Open/Closed: Extensible with additional fields
 *
 * Redesigned for better UX:
 * - Single-page tabbed interface instead of multi-step wizard
 * - All fields accessible at once
 * - Visual grouping with collapsible sections
 * - Cleaner navigation
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BaseStatus, ContactMethod, type ClientFormData } from '@/api/clients'
import { FormField, FormSelect, FormTextarea, type SelectOption } from '@/components/forms'
import { useIndustries } from '@/hooks/useClients'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Briefcase,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { clientFormSchema, type ClientFormValues } from '@/schemas'

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

type TabId = 'basic' | 'contact' | 'classification' | 'additional'

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'basic', label: 'Basic Info', icon: Building2 },
  { id: 'contact', label: 'Contact & Location', icon: MapPin },
  { id: 'classification', label: 'Classification', icon: Briefcase },
  { id: 'additional', label: 'Additional', icon: FileText },
]

export function ClientForm({ initialData, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const { data: industriesData } = useIndustries()
  const industries = Array.isArray(industriesData) ? industriesData : []
  const [activeTab, setActiveTab] = useState<TabId>('basic')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      website: initialData?.website || '',
      address: initialData?.address || '',
      billing_address: initialData?.billing_address || '',
      timezone: initialData?.timezone || '',
      tax_id: initialData?.tax_id || '',
      contact_person: initialData?.contact_person || '',
      contact_email: initialData?.contact_email || '',
      contact_phone: initialData?.contact_phone || '',
      industry_id: initialData?.industry_id || '',
      status: initialData?.status || BaseStatus.ACTIVE,
      preferred_contact_method: initialData?.preferred_contact_method || undefined,
      is_verified: initialData?.is_verified || false,
      notes: initialData?.notes || '',
    },
  })

  const onSubmitForm = async (data: ClientFormValues) => {
    // Convert empty strings to undefined for optional fields
    const cleanedData: ClientFormData = {
      ...data,
      email: data.email && data.email.trim() ? data.email.trim() : undefined,
      phone: data.phone && data.phone.trim() ? data.phone.trim() : undefined,
      website: data.website && data.website.trim() ? data.website.trim() : undefined,
      address: data.address && data.address.trim() ? data.address.trim() : undefined,
      billing_address:
        data.billing_address && data.billing_address.trim()
          ? data.billing_address.trim()
          : undefined,
      timezone: data.timezone && data.timezone.trim() ? data.timezone.trim() : undefined,
      tax_id: data.tax_id && data.tax_id.trim() ? data.tax_id.trim() : undefined,
      contact_person:
        data.contact_person && data.contact_person.trim() ? data.contact_person.trim() : undefined,
      contact_email:
        data.contact_email && data.contact_email.trim() ? data.contact_email.trim() : undefined,
      contact_phone:
        data.contact_phone && data.contact_phone.trim() ? data.contact_phone.trim() : undefined,
      industry_id: data.industry_id && data.industry_id.trim() ? data.industry_id : undefined,
      notes: data.notes && data.notes.trim() ? data.notes.trim() : undefined,
    }
    await onSubmit(cleanedData)
  }

  const statusOptions: SelectOption[] = Object.values(BaseStatus).map((status) => ({
    value: status,
    label: status,
  }))

  const contactMethodOptions: SelectOption[] = Object.values(ContactMethod).map((method) => ({
    value: method,
    label: method,
  }))

  const industryOptions: SelectOption[] = industries.map((industry) => ({
    value: industry.id,
    label: industry.name,
  }))

  const status = watch('status')

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-cream-500 text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Client Name"
                placeholder="Enter client name"
                required
                leftIcon={<Building2 className="h-4 w-4" />}
                {...register('name')}
                error={errors.name}
              />
              <FormSelect
                label="Status"
                options={statusOptions}
                placeholder="Select status"
                required
                {...register('status')}
                error={errors.status}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                type="email"
                placeholder="client@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                {...register('email')}
                error={errors.email}
              />
              <FormField
                label="Phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                leftIcon={<Phone className="h-4 w-4" />}
                {...register('phone')}
                error={errors.phone}
              />
            </div>
            <FormField
              label="Website"
              type="url"
              placeholder="https://example.com"
              leftIcon={<Globe className="h-4 w-4" />}
              {...register('website')}
              error={errors.website}
            />
          </div>
        )}

        {/* Contact & Location Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            {/* Primary Contact Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Contact
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Contact Person"
                  placeholder="Full name"
                  {...register('contact_person')}
                  error={errors.contact_person}
                />
                <FormField
                  label="Contact Email"
                  type="email"
                  placeholder="contact@example.com"
                  {...register('contact_email')}
                  error={errors.contact_email}
                />
                <FormField
                  label="Contact Phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register('contact_phone')}
                  error={errors.contact_phone}
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location Details
              </label>
              <FormTextarea
                label="Physical Address"
                placeholder="Enter physical address"
                rows={2}
                {...register('address')}
                error={errors.address}
              />
              <FormTextarea
                label="Billing Address"
                placeholder="Enter billing address (if different)"
                rows={2}
                {...register('billing_address')}
                error={errors.billing_address}
                helperText="Leave blank if same as physical address"
              />
              <FormField
                label="Timezone"
                placeholder="e.g., America/New_York"
                {...register('timezone')}
                error={errors.timezone}
                helperText="IANA timezone identifier (optional)"
              />
            </div>
          </div>
        )}

        {/* Classification Tab */}
        {activeTab === 'classification' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Industry"
                options={industryOptions}
                placeholder="Select industry"
                {...register('industry_id')}
                error={errors.industry_id}
              />
              <FormSelect
                label="Preferred Contact Method"
                options={contactMethodOptions}
                placeholder="Select method"
                {...register('preferred_contact_method')}
                error={errors.preferred_contact_method}
              />
            </div>
            <FormField
              label="Tax ID"
              placeholder="Tax identification number"
              leftIcon={<FileText className="h-4 w-4" />}
              {...register('tax_id')}
              error={errors.tax_id}
            />
            {status === BaseStatus.ACTIVE && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  {...register('is_verified')}
                  className="w-4 h-4 rounded bg-gray-800/50 border-white/10 text-amber-600 focus:ring-cream-500/50"
                />
                <label htmlFor="is_verified" className="text-sm font-medium text-gray-300">
                  Mark this client as verified
                </label>
              </div>
            )}
          </div>
        )}

        {/* Additional Tab */}
        {activeTab === 'additional' && (
          <div className="space-y-4">
            <FormTextarea
              label="Internal Notes"
              placeholder="Add internal notes and observations about this client..."
              rows={8}
              {...register('notes')}
              error={errors.notes}
              helperText="These notes are for internal use only and will not be visible to the client"
            />
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Client' : 'Create Client'}
        </button>
      </div>
    </form>
  )
}
