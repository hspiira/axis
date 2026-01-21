/**
 * Contract Form Modal
 *
 * Reusable modal for creating and editing contracts.
 */

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, DollarSign } from 'lucide-react'
import { type ContractFormData, ContractStatus, PaymentStatus } from '@/api/contracts'
import { useClients } from '@/hooks/useClients' // Assuming you have a hook to fetch clients
import { toast } from '@/lib/toast'

interface ContractFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ContractFormData) => Promise<void>
  initialData?: Partial<ContractFormData>
  isLoading: boolean
  title: string
}

// Zod schema for validation
const contractSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  billing_rate: z.number().min(0, 'Billing rate must be non-negative'),
  currency: z.string().optional(),
  payment_frequency: z.string().optional(),
  payment_terms: z.string().optional(),
  document_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
})

export function ContractFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  title,
}: ContractFormModalProps) {
  const { data: clients = [], isLoading: isLoadingClients } = useClients()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: initialData || { currency: 'UGX' },
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    } else {
      reset({ currency: 'UGX' })
    }
  }, [initialData, reset])

  const handleFormSubmit = async (data: ContractFormData) => {
    try {
      await onSubmit(data)
      onClose()
    } catch (error) {
      // Error is handled by the mutation hook, but you could add extra logic here
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 border border-white/10 rounded-xl shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Client Selector */}
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-300 mb-1">
              Client
            </label>
            <select
              id="client_id"
              {...register('client_id')}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3"
              disabled={isLoadingClients}
            >
              <option value="">{isLoadingClients ? 'Loading clients...' : 'Select a client'}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            {errors.client_id && <p className="text-red-400 text-xs mt-1">{errors.client_id.message}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input type="date" id="start_date" {...register('start_date')} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3" />
              {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
              <input type="date" id="end_date" {...register('end_date')} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3" />
              {errors.end_date && <p className="text-red-400 text-xs mt-1">{errors.end_date.message}</p>}
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="billing_rate" className="block text-sm font-medium text-gray-300 mb-1">Billing Rate</label>
                <Controller
                    name="billing_rate"
                    control={control}
                    render={({ field }) => (
                        <input 
                            type="number" 
                            id="billing_rate" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3" 
                        />
                    )}
                />
              {errors.billing_rate && <p className="text-red-400 text-xs mt-1">{errors.billing_rate.message}</p>}
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
              <input type="text" id="currency" {...register('currency')} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3" />
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label htmlFor="payment_frequency" className="block text-sm font-medium text-gray-300 mb-1">Payment Frequency</label>
              <input type="text" id="payment_frequency" {...register('payment_frequency')} placeholder="e.g., Monthly, Quarterly" className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3" />
            </div>
             <div>
              <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-300 mb-1">Payment Terms</label>
              <input type="text" id="payment_terms" {...register('payment_terms')} placeholder="e.g., Net 30" className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3" />
            </div>
          </div>

          {/* Document URL */}
          <div>
            <label htmlFor="document_url" className="block text-sm font-medium text-gray-300 mb-1">Document URL</label>
            <input type="text" id="document_url" {...register('document_url')} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3" />
            {errors.document_url && <p className="text-red-400 text-xs mt-1">{errors.document_url.message}</p>}
          </div>
          
          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea id="notes" {...register('notes')} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3"></textarea>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg text-sm font-medium disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Save Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
