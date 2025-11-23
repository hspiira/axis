/**
 * Profile Page
 *
 * Displays and manages user profile and account settings.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/AppLayout'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <p className="text-white text-lg">{user?.email || 'Not available'}</p>
            </div>

            {user?.username && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Username
                </label>
                <p className="text-white text-lg">{user.username}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {user?.first_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    First Name
                  </label>
                  <p className="text-white">{user.first_name}</p>
                </div>
              )}

              {user?.last_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Last Name
                  </label>
                  <p className="text-white">{user.last_name}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Account Status
              </label>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                {user?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Staff Member
                </label>
                <p className="text-white">{user?.is_staff ? 'Yes' : 'No'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Administrator
                </label>
                <p className="text-white">{user?.is_superuser ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Account Actions</h2>

          <div className="space-y-4">
            <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all text-left">
              Change Password
            </button>

            <button className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all text-left">
              Update Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all text-left"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
