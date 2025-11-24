/**
 * Dashboard Page
 *
 * Main landing page for authenticated users.
 * Displays overview metrics and quick actions.
 */

import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/AppLayout'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.first_name || user?.email || 'User'}
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your wellness programs today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Active Cases"
            value="1,247"
            change="+12%"
            trend="up"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Providers"
            value="892"
            change="+5%"
            trend="up"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            title="Sessions This Month"
            value="3,421"
            change="+8%"
            trend="up"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            title="Satisfaction Rate"
            value="98.5%"
            change="+2%"
            trend="up"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Manage Cases"
            description="View and manage employee wellness cases"
            href="/cases"
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <QuickActionCard
            title="Client Management"
            description="Manage client organizations and contracts"
            href="/clients"
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <QuickActionCard
            title="Provider Network"
            description="View and manage service providers"
            href="/contracts"
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </AppLayout>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
}

function StatCard({ title, value, change, trend, icon }: StatCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-purple-400">{icon}</div>
        <span
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {change}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}

function QuickActionCard({ title, description, href, icon }: QuickActionCardProps) {
  return (
    <Link
      to={href}
      className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all backdrop-blur-sm hover:scale-105"
    >
      <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
        {description}
      </p>
    </Link>
  )
}
