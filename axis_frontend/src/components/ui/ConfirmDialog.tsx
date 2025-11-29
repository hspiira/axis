/**
 * Confirm Dialog Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle user confirmation dialogs
 * - Open/Closed: Can be extended with different variants and actions
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormButton } from '@/components/forms/FormButton'

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (inputValue?: string) => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmDialogVariant
  requireInput?: boolean
  inputLabel?: string
  inputPlaceholder?: string
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  requireInput = false,
  inputLabel,
  inputPlaceholder,
  isLoading = false,
}: ConfirmDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      setInputValue('')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    if (isLoading) return
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  const handleConfirm = () => {
    if (requireInput) {
      onConfirm(inputValue)
    } else {
      onConfirm()
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <XCircle className="h-12 w-12 text-red-400" />,
          iconBg: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-yellow-400" />,
          iconBg: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
        }
      case 'success':
        return {
          icon: <CheckCircle className="h-12 w-12 text-emerald-400" />,
          iconBg: 'bg-emerald-500/20',
          borderColor: 'border-emerald-500/30',
        }
      default:
        return {
          icon: <Info className="h-12 w-12 text-emerald-400" />,
          iconBg: 'bg-emerald-500/20',
          borderColor: 'border-emerald-500/30',
        }
    }
  }

  const variantStyles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full max-w-md bg-gray-900 border border-white/10 shadow-2xl overflow-hidden',
          'rounded-xl transition-all duration-300',
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={cn('p-3 rounded-full', variantStyles.iconBg, variantStyles.borderColor, 'border')}>
              {variantStyles.icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center">{title}</h3>

          {/* Message */}
          <p className="text-gray-400 text-center text-sm leading-relaxed">{message}</p>

          {/* Optional Input */}
          {requireInput && (
            <div className="space-y-2">
              {inputLabel && (
                <label className="block text-sm font-medium text-gray-400">
                  {inputLabel}
                </label>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                disabled={isLoading}
                className={cn(
                  'w-full py-2 px-3 bg-white/5 border rounded-lg',
                  'text-white placeholder-gray-500 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50',
                  'transition-all duration-200',
                  'backdrop-blur-sm',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                )}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <FormButton
              variant="secondary"
              fullWidth
              onClick={handleClose}
              disabled={isLoading}
              type="button"
            >
              {cancelText}
            </FormButton>
            <FormButton
              variant={variant === 'danger' ? 'danger' : 'primary'}
              fullWidth
              onClick={handleConfirm}
              loading={isLoading}
              disabled={requireInput && !inputValue.trim()}
              type="button"
            >
              {confirmText}
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  )
}
