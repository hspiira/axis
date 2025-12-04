/**
 * useModal Hook
 *
 * Simplifies modal state management with a clean API
 *
 * @example
 * const uploadModal = useModal()
 * const detailModal = useModal<DocumentDetail>()
 *
 * <DocumentUploadModal {...uploadModal.props} />
 * <DocumentDetailModal {...detailModal.props} document={detailModal.data} />
 */

import { useState, useCallback } from 'react'

export interface UseModalReturn<T = undefined> {
  isOpen: boolean
  data: T | null
  open: (data?: T) => void
  close: () => void
  props: {
    isOpen: boolean
    onClose: () => void
  }
}

export function useModal<T = undefined>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData as T)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Clear data after animation completes
    setTimeout(() => setData(null), 300)
  }, [])

  return {
    isOpen,
    data,
    open,
    close,
    props: {
      isOpen,
      onClose: close,
    },
  }
}

/**
 * useConfirmDialog Hook
 *
 * Specialized hook for confirmation dialogs
 *
 * @example
 * const deleteConfirm = useConfirmDialog<Document>()
 *
 * <ConfirmDialog
 *   {...deleteConfirm.props}
 *   title="Delete Document"
 *   message={`Delete "${deleteConfirm.data?.title}"?`}
 *   onConfirm={deleteConfirm.confirm}
 * />
 */

export interface UseConfirmDialogReturn<T = undefined> extends UseModalReturn<T> {
  confirm: () => Promise<void>
  setOnConfirm: (fn: (data: T | null) => Promise<void>) => void
}

export function useConfirmDialog<T = undefined>(): UseConfirmDialogReturn<T> {
  const modal = useModal<T>()
  const [onConfirmFn, setOnConfirmFn] = useState<((data: T | null) => Promise<void>) | null>(null)

  const confirm = useCallback(async () => {
    if (onConfirmFn) {
      await onConfirmFn(modal.data)
    }
    modal.close()
  }, [onConfirmFn, modal])

  const setOnConfirm = useCallback((fn: (data: T | null) => Promise<void>) => {
    setOnConfirmFn(() => fn)
  }, [])

  return {
    ...modal,
    confirm,
    setOnConfirm,
  }
}
