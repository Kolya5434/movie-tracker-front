import { useEffect } from 'react'
import { RangeSlider } from './RangeSlider'
import classes from './FilterDrawer.module.scss'

export interface FilterValues {
  ratingRange: [number, number]
}

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  values: FilterValues
  onChange: (values: FilterValues) => void
  onReset: () => void
}

export function FilterDrawer({ isOpen, onClose, values, onChange, onReset }: FilterDrawerProps) {
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
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const hasActiveFilters = values.ratingRange[0] > 0 || values.ratingRange[1] < 10

  return (
    <>
      <div
        className={`${classes.overlay} ${isOpen ? classes.open : ''}`}
        onClick={onClose}
      />
      <div className={`${classes.drawer} ${isOpen ? classes.open : ''}`}>
        <div className={classes.header}>
          <h2 className={classes.title}>Фільтри</h2>
          <button className={classes.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={classes.content}>
          <div className={classes.section}>
            <label className={classes.label}>Рейтинг</label>
            <RangeSlider
              min={0}
              max={10}
              step={0.5}
              value={values.ratingRange}
              onChange={(ratingRange) => onChange({ ...values, ratingRange })}
            />
          </div>
        </div>

        <div className={classes.footer}>
          {hasActiveFilters && (
            <button className={classes.resetButton} onClick={onReset}>
              Скинути
            </button>
          )}
          <button className={classes.applyButton} onClick={onClose}>
            Застосувати
          </button>
        </div>
      </div>
    </>
  )
}
