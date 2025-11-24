/**
 * Toast Notification Component
 *
 * SOLID Principles:
 * - Single Responsibility: Display toast notifications
 * - Open/Closed: Uses Sonner library for extensibility
 *
 * Built on top of Sonner (https://sonner.emilkowal.ski/)
 */

import { Toaster as SonnerToaster } from 'sonner'

/**
 * Global toast notification container
 *
 * Add this to your App.tsx or root layout:
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <Toaster />
 *       <YourAppContent />
 *     </>
 *   )
 * }
 * ```
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          backdropFilter: 'blur(8px)',
        },
        className: 'toast',
        duration: 4000,
      }}
    />
  )
}
