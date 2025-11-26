/**
 * Client Persons Tab
 *
 * Lists all persons (employees/dependents) under this client
 */

import { type ClientDetail } from '@/api/clients'
import { Users, Search, UserPlus } from 'lucide-react'

interface ClientPersonsTabProps {
  client: ClientDetail
}

export function ClientPersonsTab({ client }: ClientPersonsTabProps) {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-gray-400">Total Employees</span>
          </div>
          <p className="text-2xl font-bold text-white">{client.total_employees || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-gray-400">Dependents</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
        </div>
      </div>

      {/* Persons List */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Employees & Dependents</h3>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Person
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search persons..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Placeholder */}
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Persons list will appear here</p>
          <p className="text-sm text-gray-500 mt-1">
            This will show all employees and dependents for {client.name}
          </p>
        </div>
      </div>
    </div>
  )
}
