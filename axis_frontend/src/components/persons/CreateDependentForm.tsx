/**
 * Create Dependent Form
 *
 * Form for creating dependents of existing employees
 */

import { useState, useEffect } from 'react'
import { X, ChevronLeft, Loader2, Search } from 'lucide-react'
import { personsApi, RelationshipType, type CreateDependentRequest, type PersonListItem, PersonType } from '@/api/persons'

interface CreateDependentFormProps {
  onClose: () => void
  onSuccess: () => void
  onBack: () => void
}

export function CreateDependentForm({ onClose, onSuccess, onBack }: CreateDependentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<PersonListItem[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [employeeSearch, setEmployeeSearch] = useState('')

  const [formData, setFormData] = useState<CreateDependentRequest>({
    primary_employee_id: '',
    full_name: '',
    relationship_type: RelationshipType.CHILD,
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
  })

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await personsApi.list({
          person_type: PersonType.CLIENT_EMPLOYEE,
          status: 'Active',
        })
        setEmployees(data.results)
      } catch (err) {
        setError('Failed to load employees')
      } finally {
        setLoadingEmployees(false)
      }
    }
    fetchEmployees()
  }, [])

  // Filter employees by search
  const filteredEmployees = employees.filter((emp) =>
    emp.profile.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.profile.email?.toLowerCase().includes(employeeSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.primary_employee_id || !formData.full_name || !formData.relationship_type) {
        throw new Error('Primary employee, full name, and relationship type are required')
      }

      await personsApi.createDependent(formData)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dependent')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof CreateDependentRequest, value: string) => {
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
          <h2 className="text-2xl font-bold text-white">Add Dependent</h2>
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

        {/* Primary Employee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Primary Employee <span className="text-red-400">*</span>
          </label>
          <p className="text-sm text-gray-400 mb-3">
            Select the employee this dependent is related to
          </p>

          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-12 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
            />
          </div>

          {loadingEmployees ? (
            <div className="text-gray-400">Loading employees...</div>
          ) : (
            <select
              value={formData.primary_employee_id}
              onChange={(e) => handleChange('primary_employee_id', e.target.value)}
              required
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
            >
              <option value="">Select an employee</option>
              {filteredEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.profile.full_name}
                  {employee.client_name && ` - ${employee.client_name}`}
                  {employee.profile.email && ` (${employee.profile.email})`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Relationship Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Relationship Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Relationship Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.relationship_type}
              onChange={(e) => handleChange('relationship_type', e.target.value as RelationshipType)}
              required
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
            >
              <option value={RelationshipType.SPOUSE}>Spouse</option>
              <option value={RelationshipType.CHILD}>Child</option>
              <option value={RelationshipType.PARENT}>Parent</option>
              <option value={RelationshipType.SIBLING}>Sibling</option>
              <option value={RelationshipType.OTHER}>Other</option>
            </select>
          </div>
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              placeholder="Jane Doe"
            />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder="jane.doe@example.com"
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
            disabled={isLoading || loadingEmployees}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Dependent
          </button>
        </div>
      </form>
    </>
  )
}
