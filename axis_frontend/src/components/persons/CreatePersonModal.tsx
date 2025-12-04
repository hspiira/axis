/**
 * Create Person Modal
 *
 * Person type selection and creation forms
 */

import { useState } from 'react'
import { X, Users, UserPlus, Shield, Briefcase } from 'lucide-react'
import { PersonType } from '@/api/persons'
import { CreateEmployeeForm } from './CreateEmployeeForm'
import { CreateDependentForm } from './CreateDependentForm'

interface CreatePersonModalProps {
  onClose: () => void
  onSuccess: () => void
  initialClientId?: string
}

type PersonTypeSelection = PersonType | null

const personTypeOptions = [
  {
    type: PersonType.CLIENT_EMPLOYEE,
    label: 'Client Employee',
    description: 'Add an employee from a client organization',
    icon: Users,
  },
  {
    type: PersonType.DEPENDENT,
    label: 'Dependent',
    description: 'Add a dependent of an existing employee',
    icon: UserPlus,
  },
  {
    type: PersonType.PLATFORM_STAFF,
    label: 'Platform Staff',
    description: 'Add a platform administrator or coordinator',
    icon: Shield,
  },
  {
    type: PersonType.SERVICE_PROVIDER,
    label: 'Service Provider',
    description: 'Add a therapist, counselor, or service provider',
    icon: Briefcase,
  },
]

export function CreatePersonModal({ onClose, onSuccess, initialClientId }: CreatePersonModalProps) {
  const [selectedType, setSelectedType] = useState<PersonTypeSelection>(null)

  // Handle back to type selection
  const handleBack = () => {
    setSelectedType(null)
  }

  // Render type selection
  if (!selectedType) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Add Person</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-400 mb-4">Select the type of person you want to add</p>

            <div className="space-y-2">
              {personTypeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg text-left transition-all hover:bg-white/10 hover:border-cream-500/50 group"
                  >
                    <Icon className="h-6 w-6 text-amber-500 group-hover:text-cream-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{option.label}</h3>
                      <p className="text-sm text-gray-400">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render appropriate form based on selected type
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {selectedType === PersonType.CLIENT_EMPLOYEE && (
          <CreateEmployeeForm
            onClose={onClose}
            onSuccess={onSuccess}
            onBack={handleBack}
            initialClientId={initialClientId}
          />
        )}
        {selectedType === PersonType.DEPENDENT && (
          <CreateDependentForm onClose={onClose} onSuccess={onSuccess} onBack={handleBack} />
        )}
        {selectedType === PersonType.PLATFORM_STAFF && (
          <div className="p-6">
            <p className="text-gray-400">Platform Staff form coming soon...</p>
            <button onClick={handleBack} className="mt-4 text-cream-400">
              Back to selection
            </button>
          </div>
        )}
        {selectedType === PersonType.SERVICE_PROVIDER && (
          <div className="p-6">
            <p className="text-gray-400">Service Provider form coming soon...</p>
            <button onClick={handleBack} className="mt-4 text-cream-400">
              Back to selection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
