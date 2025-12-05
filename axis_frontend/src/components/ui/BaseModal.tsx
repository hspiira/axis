/**
 * Base Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Handle modal backdrop, animations, and header layout
 * - Open/Closed: Extensible through children and customization props
 * - Dependency Inversion: Consumers provide content through children prop
 *
 * Reusable modal wrapper that eliminates duplication across all modal components.
 * Provides consistent backdrop, animations, header structure, and accessibility features.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BaseModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Modal title */
  title: string
  /** Optional subtitle or badges */
  subtitle?: ReactNode
  /** Modal content */
  children: ReactNode
  /** Maximum width of modal */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  /** Disable close when loading */
  isLoading?: boolean
  /** Custom header content (replaces default header) */
  customHeader?: ReactNode
  /** Hide close button */
  hideCloseButton?: boolean
  /** Custom background color */
  bgColor?: string
  /** Custom z-index */
  zIndex?: number
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  isLoading = false,
  customHeader,
  hideCloseButton = false,
  bgColor = 'bg-gray-900',
  zIndex = 100,
}: BaseModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full border border-white/10 shadow-2xl overflow-hidden',
          'rounded-xl transition-all duration-300',
          maxWidthClasses[maxWidth],
          bgColor,
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        {customHeader || (
          <div className={cn(
            'sticky top-0 z-10 p-6 border-b border-white/10 backdrop-blur-sm',
            `${bgColor}/95`
          )}>
            <div className="flex items-center justify-between">
              <div>
                <h2 id="modal-title" className="text-2xl font-bold text-white">
                  {title}
                </h2>
                {subtitle && <div className="mt-2">{subtitle}</div>}
              </div>
              {!hideCloseButton && (
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  aria-label="Close modal"
                  disabled={isLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
