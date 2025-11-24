/**
 * Sign-in modal component.
 * 
 * SOLID Principles:
 * - Single Responsibility: Handle sign-in UI and form submission only
 * - Dependency Inversion: Uses useAuth hook (abstraction)
 * - Open/Closed: Can be extended with additional auth methods (Microsoft OAuth, etc.)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/schemas/auth'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Sign-in modal component.
 * Provides email/password authentication form.
 */
export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Handle animation on open
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null)

    try {
      await login(data)
      reset()
      onClose()
      // Navigate to dashboard after successful login
      navigate('/dashboard')
    } catch (err) {
      const authError = err as { message?: string }
      setSubmitError(authError.message || 'Login failed. Please try again.')
    }
  }

  const handleMicrosoftSignIn = async () => {
    setSubmitError(null)
    try {
      // TODO: Implement Microsoft OAuth login
      // This will be integrated with @azure/msal-react in Phase 2
      setSubmitError('Microsoft sign-in coming soon')
    } catch (err) {
      setSubmitError('Microsoft sign-in failed')
    }
  }

  const handleClose = () => {
    reset()
    setSubmitError(null)
    setIsAnimating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop with blur - NO CLICK TO CLOSE */}
      <div
        className={cn(
          'absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-md bg-black border border-white/10 shadow-2xl overflow-hidden',
          'rounded-2xl transition-all duration-300',
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] opacity-50"></div>
        
        {/* Gradient accent (very subtle) */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        {/* Header */}
        <div className="relative p-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Sign In</h2>
              <p className="text-sm text-gray-500">Access your employee wellness platform</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 group"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="relative p-8 space-y-6">
          {/* Error Message */}
          {(submitError || error) && (
            <div className="p-4 bg-red-950/50 border border-red-900/30 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-red-400">
                {submitError || error?.message || 'An error occurred'}
              </p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" strokeWidth={2} />
              </div>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={cn(
                  'w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl',
                  'text-white placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50',
                  'transition-all duration-200',
                  'backdrop-blur-sm',
                  errors.email
                    ? 'border-red-900/50 focus:ring-red-500/50 focus:border-red-500/50'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                )}
                placeholder="admin@alchamey.eap"
                autoComplete="email"
                disabled={isSubmitting || isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" strokeWidth={2} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={cn(
                  'w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl',
                  'text-white placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50',
                  'transition-all duration-200',
                  'backdrop-blur-sm',
                  errors.password
                    ? 'border-red-900/50 focus:ring-red-500/50 focus:border-red-500/50'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                )}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting || isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-400 transition-colors z-10"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={cn(
              'w-full py-3.5 px-4 rounded-xl font-semibold',
              'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white',
              'hover:from-emerald-700 hover:to-emerald-800',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-black',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40',
              'transform hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            {isSubmitting || isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In with Email'
            )}
          </button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Microsoft Sign In */}
          <button
            type="button"
            onClick={handleMicrosoftSignIn}
            disabled={isSubmitting || isLoading}
            className={cn(
              'w-full py-3.5 px-4 rounded-xl font-semibold',
              'bg-white/5 border border-white/10 text-white',
              'hover:bg-white/10 hover:border-white/20',
              'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transform hover:scale-[1.02] active:scale-[0.98]',
              'flex items-center justify-center gap-3'
            )}
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            Sign in with Microsoft
          </button>

          {/* Footer Links */}
          <div className="pt-4 space-y-3 text-center border-t border-white/5">
            <a
              href="#forgot-password"
              className="block text-sm text-gray-500 hover:text-gray-400 transition-colors duration-200"
              onClick={(e) => {
                e.preventDefault()
                // TODO: Implement forgot password flow
              }}
            >
              Forgot your password?
            </a>
            <p className="text-xs text-gray-600">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

