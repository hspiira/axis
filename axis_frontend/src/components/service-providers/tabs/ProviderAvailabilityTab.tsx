/**
 * Provider Availability Tab
 *
 * Displays and manages provider's availability schedule
 */

import { Calendar, Clock, AlertCircle, Info } from 'lucide-react'
import { type ServiceProvider } from '@/api/services'

interface ProviderAvailabilityTabProps {
  provider: ServiceProvider
}

export function ProviderAvailabilityTab({ provider }: ProviderAvailabilityTabProps) {
  const hasAvailability = provider.availability && Object.keys(provider.availability).length > 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status Banner */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${
        provider.is_available
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-gray-500/10 border-gray-500/30'
      }`}>
        <div className={`p-2 rounded-lg ${
          provider.is_available ? 'bg-emerald-500/20' : 'bg-gray-500/20'
        }`}>
          <Clock className={`h-5 w-5 ${
            provider.is_available ? 'text-emerald-400' : 'text-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">
            Provider Status: {provider.is_available ? 'Available' : 'Unavailable'}
          </h3>
          <p className="text-sm text-gray-300">
            {provider.is_available
              ? 'This provider is currently accepting new sessions.'
              : 'This provider is not currently accepting new sessions.'}
          </p>
        </div>
      </div>

      {/* Availability Schedule */}
      {hasAvailability ? (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cream-400" />
            Availability Schedule
          </h3>

          <div className="space-y-4">
            {Object.entries(provider.availability!).map(([key, value]) => {
              const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
              const displayValue = typeof value === 'object' && value !== null
                ? JSON.stringify(value, null, 2)
                : String(value)

              return (
                <div key={key} className="bg-white/5 border border-cream-500/10 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-2">{displayKey}</h4>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                        {displayValue}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No availability schedule configured</p>
            <p className="text-sm text-gray-500">
              Availability information will be displayed here once configured
            </p>
          </div>
        </div>
      )}

      {/* Provider Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-white mb-1">About Availability Management</p>
          <p>
            Availability schedules help coordinate session scheduling and ensure providers are matched
            with clients at times that work for both parties. Contact the provider directly to discuss
            specific availability or scheduling needs.
          </p>
        </div>
      </div>

      {/* Contact Information */}
      {(provider.contact_email || provider.contact_phone) && (
        <div className="bg-white/5 border border-cream-500/10 rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-cream-400" />
            Contact for Scheduling
          </h3>
          <div className="space-y-3">
            {provider.contact_email && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <a
                  href={`mailto:${provider.contact_email}`}
                  className="text-sm text-cream-400 hover:text-cream-300 transition-colors"
                >
                  {provider.contact_email}
                </a>
              </div>
            )}
            {provider.contact_phone && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Phone</p>
                <a
                  href={`tel:${provider.contact_phone}`}
                  className="text-sm text-cream-400 hover:text-cream-300 transition-colors"
                >
                  {provider.contact_phone}
                </a>
              </div>
            )}
            {provider.location && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Location</p>
                <p className="text-sm text-white">{provider.location}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
