/**
 * Client Form Component - Multi-Step Form
 *
 * SOLID Principles:
 * - Single Responsibility: Handle client form input and validation
 * - Open/Closed: Extensible with additional fields
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
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { clientFormSchema, type ClientFormValues } from '@/schemas'

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Building2 },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Contact', icon: User },
  { id: 4, title: 'Classification', icon: Briefcase },
  { id: 5, title: 'Additional', icon: FileText },
] as const

export function ClientForm({ initialData, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const { data: industriesData } = useIndustries()
  const industries = Array.isArray(industriesData) ? industriesData : []
  const [currentStep, setCurrentStep] = useState(1)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
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

  // Validate current step before moving forward
  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof ClientFormData)[][] = [
      ['name', 'status', 'email', 'phone', 'website'], // Step 1
      ['address', 'billing_address', 'timezone'], // Step 2
      ['contact_person', 'contact_email', 'contact_phone'], // Step 3
      ['industry_id', 'preferred_contact_method', 'tax_id'], // Step 4
      ['notes', 'is_verified'], // Step 5
    ]

    const fields = fieldsToValidate[step - 1] || []
    const result = await trigger(fields as any)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
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
        )

      case 2:
        return (
          <div className="space-y-4">
            <FormTextarea
              label="Address"
              placeholder="Enter physical address"
              rows={3}
              {...register('address')}
              error={errors.address}
            />
            <FormTextarea
              label="Billing Address"
              placeholder="Enter billing address (if different)"
              rows={3}
              {...register('billing_address')}
              error={errors.billing_address}
              helperText="Leave blank if same as physical address"
            />
            <FormField
              label="Timezone"
              placeholder="e.g., America/New_York"
              {...register('timezone')}
              error={errors.timezone}
              helperText="IANA timezone identifier"
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Contact Person"
                placeholder="Full name"
                leftIcon={<User className="h-4 w-4" />}
                {...register('contact_person')}
                error={errors.contact_person}
              />
              <FormField
                label="Contact Email"
                type="email"
                placeholder="contact@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                {...register('contact_email')}
                error={errors.contact_email}
              />
              <FormField
                label="Contact Phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                leftIcon={<Phone className="h-4 w-4" />}
                {...register('contact_phone')}
                error={errors.contact_phone}
              />
            </div>
          </div>
        )

      case 4:
        return (
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
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <FormTextarea
              label="Notes"
              placeholder="Internal notes and observations"
              rows={4}
              {...register('notes')}
              error={errors.notes}
            />
            {status === BaseStatus.ACTIVE && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  {...register('is_verified')}
                  className="h-4 w-4 rounded bg-white/5 border-white/10 text-emerald-600 focus:ring-emerald-500/50"
                />
                <label htmlFor="is_verified" className="text-sm text-gray-400">
                  Mark as verified
                </label>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          const isClickable = currentStep > step.id

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                    isActive
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-gray-500',
                    isClickable && 'cursor-pointer hover:border-emerald-500/50',
                    !isClickable && 'cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </button>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isActive ? 'text-emerald-400' : isCompleted ? 'text-emerald-500/70' : 'text-gray-500'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    currentStep > step.id ? 'bg-emerald-500' : 'bg-white/10'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">{renderStepContent()}</div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
        <div className="flex gap-3">
          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Client' : 'Create Client'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
