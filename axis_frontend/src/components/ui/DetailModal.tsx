/**
 * Generic Detail Modal Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display comprehensive entity information in modal
 * - Open/Closed: Extensible for any entity type
 * - Liskov Substitution: Can be used for any entity with proper sections
 */

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState, type ReactNode } from 'react'

export interface DetailSection {
  title: string
  icon: ReactNode
  items: DetailItem[]
  columns?: 1 | 2
}

export interface DetailItem {
  label: string
  value: string | null | undefined
  icon?: ReactNode
  link?: boolean
  className?: string
}

interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  title: string
  subtitle?: ReactNode
  sections: DetailSection[]
}

export function DetailModal({
  isOpen,
  onClose,
  onEdit,
  title,
  subtitle,
  sections,
}: DetailModalProps) {
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
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-4xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden',
          'rounded-xl transition-all duration-300',
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              {subtitle && <div className="flex items-center gap-3">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {sections.map((section, index) => (
            <section key={index}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {section.icon}
                {section.title}
              </h3>
              <div
                className={cn(
                  'grid gap-4 bg-white/5 p-4 rounded-lg border border-white/10',
                  section.columns === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                )}
              >
                {section.items.map((item, itemIndex) => (
                  <DetailItemDisplay key={itemIndex} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailItemDisplay({ label, value, icon, link, className }: DetailItem) {
  const displayValue = value || 'N/A'
  const isEmpty = !value

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      {link && !isEmpty ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-colors"
        >
          {icon}
          {displayValue}
        </a>
      ) : (
        <p
          className={cn(
            'text-sm flex items-center gap-2',
            isEmpty ? 'text-gray-600 italic' : 'text-gray-300'
          )}
        >
          {icon}
          {displayValue}
        </p>
      )}
    </div>
  )
}
