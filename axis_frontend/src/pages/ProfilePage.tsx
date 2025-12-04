/**
 * Profile Page
 *
 * Modern, comprehensive profile and settings management with tabbed interface
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Bell,
  Lock,
  Palette,
  Globe,
  LogOut,
  Camera,
  Edit2,
  Save,
  X,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'

type TabType = 'profile' | 'account' | 'security' | 'notifications' | 'preferences'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { setPageTitle } = usePageTitle()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setPageTitle('Profile & Settings', 'Manage your account, security, and preferences')
    return () => setPageTitle(null)
  }, [setPageTitle])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'account' as TabType, label: 'Account', icon: Mail },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'preferences' as TabType, label: 'Preferences', icon: Palette },
  ]

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-cream-500/10 to-cream-600/10 border border-cream-500/10 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cream-500/30 to-cream-600/30 border-2 border-cream-500/50 flex items-center justify-center">
                <User className="h-12 w-12 text-cream-400" />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-cream-500 rounded-full hover:bg-cream-400 transition-colors">
                <Camera className="h-4 w-4 text-gray-900" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username || 'User'}
                  </h1>
                  <p className="text-theme-secondary">{user?.email}</p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  {user?.is_staff && (
                    <span className="px-3 py-1 bg-cream-500/20 text-cream-400 border border-cream-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Staff
                    </span>
                  )}
                  {user?.is_superuser && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Administrator
                    </span>
                  )}
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {user?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto border-b border-cream-500/10">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 px-6 py-2.5 flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap text-sm',
                    activeTab === tab.id
                      ? 'border-cream-500 text-cream-400 bg-white/5'
                      : 'border-transparent text-theme-secondary hover:text-theme hover:bg-white/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && <ProfileTab user={user} isEditing={isEditing} />}
          {activeTab === 'account' && <AccountTab user={user} />}
          {activeTab === 'security' && <SecurityTab onLogout={handleLogout} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </AppLayout>
  )
}

// Profile Tab Component
function ProfileTab({ user, isEditing }: { user: any; isEditing: boolean }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-cream-400" />
          Personal Information
        </h3>
        <div className="space-y-4">
          <FormField label="First Name" value={user?.first_name} isEditing={isEditing} />
          <FormField label="Last Name" value={user?.last_name} isEditing={isEditing} />
          <FormField label="Username" value={user?.username} isEditing={isEditing} />
          <FormField
            label="Job Title"
            value="System Administrator"
            isEditing={isEditing}
            placeholder="Enter your job title"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-cream-400" />
          Contact Information
        </h3>
        <div className="space-y-4">
          <FormField
            label="Email"
            value={user?.email}
            isEditing={isEditing}
            icon={<Mail className="h-4 w-4" />}
          />
          <FormField
            label="Phone"
            value="+1 (555) 123-4567"
            isEditing={isEditing}
            icon={<Phone className="h-4 w-4" />}
            placeholder="Enter phone number"
          />
          <FormField
            label="Location"
            value="San Francisco, CA"
            isEditing={isEditing}
            icon={<Globe className="h-4 w-4" />}
            placeholder="Enter your location"
          />
        </div>
      </div>

      {/* Organization */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-cream-400" />
          Organization
        </h3>
        <div className="space-y-4">
          <FormField
            label="Company"
            value="Axis Management"
            isEditing={isEditing}
            placeholder="Enter company name"
          />
          <FormField
            label="Department"
            value="Operations"
            isEditing={isEditing}
            placeholder="Enter department"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4">Bio</h3>
        {isEditing ? (
          <textarea
            className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme resize-none focus:outline-none focus:ring-2 focus:ring-cream-500"
            rows={4}
            placeholder="Tell us about yourself..."
            defaultValue="Experienced system administrator focused on streamlining operations and improving efficiency."
          />
        ) : (
          <p className="text-theme-secondary text-sm">
            Experienced system administrator focused on streamlining operations and improving efficiency.
          </p>
        )}
      </div>
    </div>
  )
}

// Account Tab Component
function AccountTab({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Account Details */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4">Account Details</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-theme-tertiary mb-2">User ID</label>
            <p className="text-theme font-mono text-sm bg-theme px-3 py-2 rounded-lg border border-cream-500/10">
              {user?.id || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-theme-tertiary mb-2">
              Account Created
            </label>
            <p className="text-theme text-sm">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-theme-tertiary mb-2">
              Last Login
            </label>
            <p className="text-theme text-sm">{new Date().toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-theme-tertiary mb-2">
              Account Type
            </label>
            <p className="text-theme text-sm">{user?.is_superuser ? 'Administrator' : 'Standard'}</p>
          </div>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4">Email Preferences</h3>
        <div className="space-y-3">
          <ToggleOption label="Receive newsletter" description="Monthly updates and announcements" />
          <ToggleOption
            label="Product updates"
            description="New features and improvements"
            defaultChecked
          />
          <ToggleOption
            label="Account activity"
            description="Login alerts and security notifications"
            defaultChecked
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Danger Zone
        </h3>
        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors text-left flex items-center justify-between">
            <div>
              <div className="font-medium">Deactivate Account</div>
              <div className="text-sm text-red-400/70">Temporarily disable your account</div>
            </div>
            <X className="h-5 w-5" />
          </button>
          <button className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors text-left flex items-center justify-between">
            <div>
              <div className="font-medium">Delete Account</div>
              <div className="text-sm text-red-400/70">Permanently delete your account and data</div>
            </div>
            <AlertCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Security Tab Component
function SecurityTab({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-6">
      {/* Password */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-cream-400" />
          Password
        </h3>
        <p className="text-theme-secondary text-sm mb-4">
          Last changed 3 months ago. We recommend changing your password regularly.
        </p>
        <button className="px-6 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors">
          Change Password
        </button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-cream-400" />
          Two-Factor Authentication
        </h3>
        <p className="text-theme-secondary text-sm mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <div className="flex items-center justify-between p-4 bg-theme border border-cream-500/10 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="font-medium text-theme">Not Enabled</div>
              <div className="text-xs text-theme-tertiary">Increase your account security</div>
            </div>
          </div>
          <button className="px-4 py-2 bg-cream-500 text-gray-900 rounded-lg hover:bg-cream-400 font-medium transition-colors text-sm">
            Enable
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <SessionItem
            device="MacBook Pro - Chrome"
            location="San Francisco, CA"
            current
            lastActive="Current session"
          />
          <SessionItem
            device="iPhone - Safari"
            location="San Francisco, CA"
            lastActive="2 hours ago"
          />
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4">Sign Out</h3>
        <p className="text-theme-secondary text-sm mb-4">
          Sign out of your account on this device.
        </p>
        <button
          onClick={onLogout}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

// Notifications Tab Component
function NotificationsTab() {
  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-cream-400" />
          Email Notifications
        </h3>
        <div className="space-y-3">
          <ToggleOption
            label="New assignments"
            description="Get notified when you're assigned to a new task"
            defaultChecked
          />
          <ToggleOption
            label="Session reminders"
            description="Receive reminders before scheduled sessions"
            defaultChecked
          />
          <ToggleOption label="Weekly digest" description="Summary of activity each week" />
          <ToggleOption
            label="Contract updates"
            description="Changes to contracts and agreements"
            defaultChecked
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-cream-400" />
          Push Notifications
        </h3>
        <div className="space-y-3">
          <ToggleOption
            label="Real-time updates"
            description="Instant notifications for important events"
            defaultChecked
          />
          <ToggleOption
            label="Chat messages"
            description="Get notified of new messages"
            defaultChecked
          />
          <ToggleOption label="System alerts" description="Critical system notifications" />
        </div>
      </div>

      {/* Notification Schedule */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4">Notification Schedule</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-tertiary mb-2">
              Quiet Hours Start
            </label>
            <input
              type="time"
              className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
              defaultValue="22:00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-tertiary mb-2">
              Quiet Hours End
            </label>
            <input
              type="time"
              className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500"
              defaultValue="08:00"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Preferences Tab Component
function PreferencesTab() {
  return (
    <div className="space-y-6">
      {/* Display */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-cream-400" />
          Display
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-tertiary mb-2">Theme</label>
            <select className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500">
              <option>Dark (Current)</option>
              <option>Light</option>
              <option>Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-tertiary mb-2">
              Date Format
            </label>
            <select className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-tertiary mb-2">
              Time Format
            </label>
            <select className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500">
              <option>12-hour (AM/PM)</option>
              <option>24-hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-cream-400" />
          Language & Region
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-tertiary mb-2">Language</label>
            <select className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500">
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-tertiary mb-2">Timezone</label>
            <select className="w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-cream-500">
              <option>Pacific Time (PT)</option>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-theme-secondary border border-cream-500/10 rounded-lg p-6">
        <h3 className="text-base font-semibold text-theme mb-4">Data & Privacy</h3>
        <div className="space-y-3">
          <ToggleOption
            label="Analytics"
            description="Help improve the platform by sharing usage data"
            defaultChecked
          />
          <ToggleOption
            label="Personalization"
            description="Use my data to personalize my experience"
            defaultChecked
          />
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-theme rounded-lg transition-colors text-sm font-medium">
            Download My Data
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function FormField({
  label,
  value,
  isEditing,
  icon,
  placeholder,
}: {
  label: string
  value?: string
  isEditing: boolean
  icon?: React.ReactNode
  placeholder?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-theme-tertiary mb-2">{label}</label>
      {isEditing ? (
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary">{icon}</div>}
          <input
            type="text"
            className={cn(
              'w-full px-3 py-2 bg-theme border border-cream-500/10 rounded-lg text-theme text-sm focus:outline-none focus:ring-2 focus:ring-cream-500',
              icon && 'pl-10'
            )}
            defaultValue={value || ''}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 group">
          <div className="flex items-center gap-2 text-theme text-sm">
            {icon && <div className="text-theme-tertiary">{icon}</div>}
            <p>{value || '—'}</p>
          </div>
          {value && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded transition-all"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-theme-tertiary" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ToggleOption({
  label,
  description,
  defaultChecked,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  const [checked, setChecked] = useState(defaultChecked || false)

  return (
    <div className="flex items-start justify-between p-4 bg-theme border border-cream-500/10 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-theme text-sm">{label}</div>
        <div className="text-xs text-theme-tertiary mt-1">{description}</div>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-cream-500' : 'bg-gray-600'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-4 w-4 rounded-full transition-transform shadow-sm',
            checked ? 'bg-gray-900 translate-x-5' : 'bg-white'
          )}
        />
      </button>
    </div>
  )
}

function SessionItem({
  device,
  location,
  current,
  lastActive,
}: {
  device: string
  location: string
  current?: boolean
  lastActive: string
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-theme border border-cream-500/10 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium text-theme">{device}</div>
          {current && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs">
              Current
            </span>
          )}
        </div>
        <div className="text-xs text-theme-tertiary mt-1">{location}</div>
        <div className="text-xs text-theme-secondary mt-1">{lastActive}</div>
      </div>
      {!current && (
        <button className="px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors">
          Revoke
        </button>
      )}
    </div>
  )
}
