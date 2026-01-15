import { useState, useRef, type TouchEvent } from 'react'
import type { Movie } from '../types/movie'
import { STATUS_LABELS, TYPE_LABELS } from '../constants/constants'
import classes from './MovieList.module.scss'

interface MovieItemProps {
  movie: Movie
  onClick?: (movie: Movie) => void
  onEdit?: (movie: Movie) => void
  onDelete?: (movie: Movie) => void
}

export function MovieItem({ movie, onClick, onEdit, onDelete }: MovieItemProps) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const startX = useRef(0)
  const currentOffset = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    const touchX = e.touches[0].clientX
    const delta = touchX - startX.current

    if (delta > 150 || delta < -150) return

    currentOffset.current = delta
    setOffset(delta)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    const threshold = 60

    if (currentOffset.current > threshold) {
      setOffset(80)
    } else if (currentOffset.current < -threshold) {
      setOffset(-80)
    } else {
      setOffset(0)
    }

    currentOffset.current = 0
  }

  const handleEditAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOffset(0)
    setTimeout(() => onEdit?.(movie), 300)
  }

  const handleDeleteAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOffset(0)
    setTimeout(() => onDelete?.(movie), 300)
  }

  return (
    <li className={classes.swipeContainer}>
      <div className={classes.backgroundActions}>
        <div className={`${classes.actionBtn} ${classes.editAction}`} style={{ opacity: offset > 0 ? 1 : 0 }}>
          <button onClick={handleEditAction}>✏️</button>
        </div>

        <div className={`${classes.actionBtn} ${classes.deleteAction}`} style={{ opacity: offset < 0 ? 1 : 0 }}>
          <button onClick={handleDeleteAction}>🗑️</button>
        </div>
      </div>

      <div
        className={classes.item}
        onClick={() => onClick?.(movie)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div className={classes.content}>
          <h3 className={classes.title}>{movie.title}</h3>
          <div className={classes.meta}>
            {TYPE_LABELS[movie.type] || movie.type} • {STATUS_LABELS[movie.status] || movie.status}
          </div>
        </div>

        <div className={classes.actions}>
          <span className={`${classes.rating} ${movie.rating && movie.rating >= 8 ? classes.high : ''}`}>
            {movie.rating ?? '-'}
          </span>
        </div>
      </div>
    </li>
  )
}