import { useState, useRef, useEffect, type TouchEvent } from 'react'
import type { Movie } from '../types/movie'
import { STATUS_LABELS, TYPE_LABELS } from '../constants/constants'
import type { ViewMode } from './MovieList'
import classes from './MovieList.module.scss'

interface MovieItemProps {
  movie: Movie
  viewMode?: ViewMode
  onClick?: (movie: Movie) => void
  onEdit?: (movie: Movie) => void
  onDelete?: (movie: Movie) => void
  isActive?: boolean
  onSwipeStart?: () => void
  onSwipeEnd?: () => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SWIPE_THRESHOLD = 60
const FULL_SWIPE_THRESHOLD = 140
const SWIPE_OPEN_OFFSET = 80

export function MovieItem({
  movie,
  viewMode = 'list',
  onClick,
  onEdit,
  onDelete,
  isActive,
  onSwipeStart,
  onSwipeEnd,
}: MovieItemProps) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const startX = useRef(0)
  const currentOffset = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)

  // Reset offset when another item becomes active
  useEffect(() => {
    if (!isActive && offset !== 0) {
      setOffset(0)
    }
  }, [isActive])

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
    onSwipeStart?.()
  }

  const handleTouchMove = (e: TouchEvent) => {
    const touchX = e.touches[0].clientX
    const delta = touchX - startX.current

    // Allow more movement for full swipe
    const maxOffset = FULL_SWIPE_THRESHOLD + 20
    if (delta > maxOffset || delta < -maxOffset) return

    currentOffset.current = delta
    setOffset(delta)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    const swipeOffset = currentOffset.current

    // Full swipe right - trigger edit
    if (swipeOffset >= FULL_SWIPE_THRESHOLD) {
      setOffset(0)
      onSwipeEnd?.()
      onEdit?.(movie)
    }
    // Full swipe left - trigger delete
    else if (swipeOffset <= -FULL_SWIPE_THRESHOLD) {
      setOffset(0)
      onSwipeEnd?.()
      onDelete?.(movie)
    }
    // Partial swipe right - open edit action
    else if (swipeOffset > SWIPE_THRESHOLD) {
      setOffset(SWIPE_OPEN_OFFSET)
    }
    // Partial swipe left - open delete action
    else if (swipeOffset < -SWIPE_THRESHOLD) {
      setOffset(-SWIPE_OPEN_OFFSET)
    }
    // Not enough swipe - reset
    else {
      setOffset(0)
      onSwipeEnd?.()
    }

    currentOffset.current = 0
  }

  const handleEditAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOffset(0)
    onSwipeEnd?.()
    setTimeout(() => onEdit?.(movie), 300)
  }

  const handleDeleteAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOffset(0)
    onSwipeEnd?.()
    setTimeout(() => onDelete?.(movie), 300)
  }

  const isFullSwipeRight = offset >= FULL_SWIPE_THRESHOLD
  const isFullSwipeLeft = offset <= -FULL_SWIPE_THRESHOLD

  const showEpisodes = movie.type !== 'movie' && movie.total_episodes && movie.total_episodes > 1

  // Card view
  if (viewMode === 'card') {
    return (
      <li className={classes.cardItem} onClick={() => onClick?.(movie)}>
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className={classes.poster} />
        ) : (
          <div className={classes.posterPlaceholder}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5 5.5V18.5C19.5 19.0523 19.0523 19.5 18.5 19.5H5.5C4.94772 19.5 4.5 19.0523 4.5 18.5V5.5C4.5 4.94772 4.94772 4.5 5.5 4.5H18.5C19.0523 4.5 19.5 4.94772 19.5 5.5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4.5 8H7.5M4.5 12H7.5M4.5 16H7.5M16.5 8H19.5M16.5 12H19.5M16.5 16H19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 14.5L13.5 12L10 9.5V14.5Z" fill="currentColor"/>
            </svg>
          </div>
        )}
        <div className={classes.cardContent}>
          <h3 className={classes.cardTitle}>{movie.title}</h3>
          <div className={classes.cardMeta}>
            {TYPE_LABELS[movie.type] || movie.type} • {STATUS_LABELS[movie.status] || movie.status}
          </div>
          <div className={classes.cardDate}>{formatDate(movie.created_at)}</div>
          {movie.rating && (
            <span className={`${classes.cardRating} ${movie.rating >= 8 ? classes.high : ''}`}>
              {movie.rating}
            </span>
          )}
        </div>
      </li>
    )
  }

  // List view
  return (
    <li className={classes.swipeContainer}>
      <div className={classes.backgroundActions}>
        <div
          className={`${classes.actionBtn} ${classes.editAction} ${isFullSwipeRight ? classes.fullSwipe : ''}`}
          style={{ opacity: offset > 0 ? 1 : 0 }}
        >
          <button onClick={handleEditAction}>✏️</button>
        </div>

        <div
          className={`${classes.actionBtn} ${classes.deleteAction} ${isFullSwipeLeft ? classes.fullSwipe : ''}`}
          style={{ opacity: offset < 0 ? 1 : 0 }}
        >
          <button onClick={handleDeleteAction}>🗑</button>
        </div>
      </div>

      <div
        ref={itemRef}
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
        {movie.poster_url ? (
          <img src={movie.poster_url} alt="" className={classes.listPoster} />
        ) : (
          <div className={classes.listPosterPlaceholder}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5 5.5V18.5C19.5 19.0523 19.0523 19.5 18.5 19.5H5.5C4.94772 19.5 4.5 19.0523 4.5 18.5V5.5C4.5 4.94772 4.94772 4.5 5.5 4.5H18.5C19.0523 4.5 19.5 4.94772 19.5 5.5Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4.5 8H7.5M4.5 12H7.5M4.5 16H7.5M16.5 8H19.5M16.5 12H19.5M16.5 16H19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 14.5L13.5 12L10 9.5V14.5Z" fill="currentColor"/>
            </svg>
          </div>
        )}
        <div className={classes.content}>
          <h3 className={classes.title}>{movie.title}</h3>
          <div className={classes.meta}>
            {TYPE_LABELS[movie.type] || movie.type} • {STATUS_LABELS[movie.status] || movie.status}
            {showEpisodes && ` • ${movie.watched_episodes ?? 0}/${movie.total_episodes}`}
          </div>
          <div className={classes.date}>{formatDate(movie.created_at)}</div>
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