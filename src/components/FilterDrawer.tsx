import { useEffect } from 'react'
import { RangeSlider } from './RangeSlider'
import classes from './FilterDrawer.module.scss'

export interface FilterValues {
  ratingRange: [number, number]
  yearRange: [number, number]
  genres: string[]
}

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  values: FilterValues
  onChange: (values: FilterValues) => void
  onReset: () => void
  availableGenres: string[]
  yearBounds: [number, number]
}

export function FilterDrawer({ isOpen, onClose, values, onChange, onReset, availableGenres, yearBounds }: FilterDrawerProps) {
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

  const toggleGenre = (genre: string) => {
    const newGenres = values.genres.includes(genre)
      ? values.genres.filter(g => g !== genre)
      : [...values.genres, genre]
    onChange({ ...values, genres: newGenres })
  }

  const hasActiveFilters =
    values.ratingRange[0] > 0 ||
    values.ratingRange[1] < 10 ||
    values.yearRange[0] > yearBounds[0] ||
    values.yearRange[1] < yearBounds[1] ||
    values.genres.length > 0

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

          {yearBounds[0] < yearBounds[1] && (
            <div className={classes.section}>
              <label className={classes.label}>Рік</label>
              <RangeSlider
                min={yearBounds[0]}
                max={yearBounds[1]}
                step={1}
                value={values.yearRange}
                onChange={(yearRange) => onChange({ ...values, yearRange })}
              />
            </div>
          )}

          {availableGenres.length > 0 && (
            <div className={classes.section}>
              <label className={classes.label}>Жанри</label>
              <div className={classes.genreChips}>
                {availableGenres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    className={`${classes.genreChip} ${values.genres.includes(genre) ? classes.active : ''}`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
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
