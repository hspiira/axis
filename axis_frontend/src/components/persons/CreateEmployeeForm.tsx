/**
 * Create Employee Form
 *
 * Form for creating client employees
 */

import { useState, useEffect } from 'react'
import { X, ChevronLeft, Loader2 } from 'lucide-react'
import { personsApi, EmploymentStatus, type CreateClientEmployeeRequest } from '@/api/persons'
import { getActiveClients, type ClientList } from '@/api/clients'
import { cleanFormData, validateRequiredFields } from '@/utils/formHelpers'

interface CreateEmployeeFormProps {
  onClose: () => void
  onSuccess: () => void
  onBack: () => void
  initialClientId?: string
}

export function CreateEmployeeForm({
  onClose,
  onSuccess,
  onBack,
  initialClientId,
}: CreateEmployeeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientList[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [formData, setFormData] = useState<CreateClientEmployeeRequest>({
    client_id: initialClientId || '',
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    country: '',
    employee_department: '',
    employee_id_number: '',
    employment_status: EmploymentStatus.FULL_TIME,
    employment_start_date: '',
    job_title: '',
  })

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getActiveClients()
        setClients(data)
      } catch (err) {
        setError('Failed to load clients')
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      const { isValid, missing } = validateRequiredFields(formData, ['client_id', 'full_name'])

      if (!isValid) {
        throw new Error(`Required fields missing: ${missing.join(', ')}`)
      }

      // Clean up form data - convert empty strings to undefined
      const cleanedData = cleanFormData(formData)

      await personsApi.createEmployee(cleanedData)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof CreateClientEmployeeRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-gray-950 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <h2 className="text-2xl font-bold text-white">Add Client Employee</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Client Organization <span className="text-red-400">*</span>
          </label>
          {loadingClients ? (
            <div className="text-gray-400">Loading clients...</div>
          ) : (
            <select
              value={formData.client_id}
              onChange={(e) => handleChange('client_id', e.target.value)}
              required
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Personal Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="PreferNotToSay">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Employment Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Employee ID</label>
              <input
                type="text"
                value={formData.employee_id_number}
                onChange={(e) => handleChange('employee_id_number', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="EMP-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Department</label>
              <input
                type="text"
                value={formData.employee_department}
                onChange={(e) => handleChange('employee_department', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Employment Status</label>
              <select
                value={formData.employment_status}
                onChange={(e) => handleChange('employment_status', e.target.value as EmploymentStatus)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
              >
                <option value={EmploymentStatus.FULL_TIME}>Full Time</option>
                <option value={EmploymentStatus.PART_TIME}>Part Time</option>
                <option value={EmploymentStatus.CONTRACT}>Contract</option>
                <option value={EmploymentStatus.PROBATION}>Probation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Employment Start Date</label>
            <input
              type="date"
              value={formData.employment_start_date}
              onChange={(e) => handleChange('employment_start_date', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || loadingClients}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Employee
          </button>
        </div>
      </form>
    </>
  )
}
