import { useEffect, useRef } from 'react'
import classes from './UndoToast.module.scss'

interface UndoToastProps {
  message: string
  duration?: number
  onUndo: () => void
  onComplete: () => void
  isVisible: boolean
}

export function UndoToast({
  message,
  duration = 5000,
  onUndo,
  onComplete,
  isVisible,
}: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onUndoRef = useRef(onUndo)

  // Keep refs updated in effect
  useEffect(() => {
    onCompleteRef.current = onComplete
    onUndoRef.current = onUndo
  })

  useEffect(() => {
    if (!isVisible) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setTimeout(() => {
      onCompleteRef.current()
    }, duration)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isVisible, duration])

  const handleUndo = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onUndoRef.current()
  }

  if (!isVisible) return null

  return (
    <div className={classes.toast}>
      <div
        className={classes.progressBar}
        style={{ animationDuration: `${duration}ms` }}
      />
      <div className={classes.content}>
        <span className={classes.message}>{message}</span>
        <button className={classes.undoButton} onClick={handleUndo}>
          Скасувати
        </button>
      </div>
    </div>
  )
}
