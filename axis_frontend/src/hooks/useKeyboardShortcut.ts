/**
 * Keyboard Shortcut Hook
 *
 * Provides keyboard shortcut functionality with modifier key support
 */

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

export interface UseKeyboardShortcutOptions {
  /**
   * Whether the shortcut is enabled
   */
  enabled?: boolean
  /**
   * Prevent default browser behavior
   */
  preventDefault?: boolean
  /**
   * Stop event propagation
   */
  stopPropagation?: boolean
}

/**
 * Register a keyboard shortcut
 *
 * @param shortcut - Keyboard shortcut configuration
 * @param callback - Function to call when shortcut is triggered
 * @param options - Additional options
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  callback: () => void,
  options: UseKeyboardShortcutOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
  } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if shortcut matches
      const matches =
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (!shortcut.ctrlKey || event.ctrlKey) &&
        (!shortcut.metaKey || event.metaKey) &&
        (!shortcut.shiftKey || event.shiftKey) &&
        (!shortcut.altKey || event.altKey)

      if (!matches) return

      // Don't trigger if user is typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in inputs
        if (shortcut.key.toLowerCase() !== 'escape') {
          return
        }
      }

      if (preventDefault) {
        event.preventDefault()
      }

      if (stopPropagation) {
        event.stopPropagation()
      }

      callback()
    },
    [shortcut, callback, preventDefault, stopPropagation]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

/**
 * Format shortcut for display (e.g., "Ctrl+K", "⌘+N")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  // Use Mac symbols if on Mac
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)

  if (shortcut.ctrlKey) {
    parts.push(isMac ? '⌃' : 'Ctrl')
  }

  if (shortcut.metaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }

  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift')
  }

  // Capitalize key
  const key = shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase()
  parts.push(key)

  return parts.join(isMac ? '' : '+')
}
