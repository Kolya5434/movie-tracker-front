import { useEffect } from 'react'
import classes from './ConfirmModal.module.scss'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Видалити',
  cancelText = 'Скасувати',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div className={classes.overlay} onClick={!isLoading ? onCancel : undefined}>
      <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={classes.title}>{title}</h2>
        <p className={classes.message}>{message}</p>
        <div className={classes.actions}>
          <button
            className={classes.cancelButton}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={classes.confirmButton}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Видалення...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
