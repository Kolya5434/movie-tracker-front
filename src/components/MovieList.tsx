import { use, useState, useEffect, useCallback } from 'react'
import type { Movie } from '../types/movie.ts'
import classes from './MovieList.module.scss'
import { MovieItem } from './MovieItem'

export type ViewMode = 'list' | 'card'

const VIEW_MODE_KEY = 'movieListViewMode'

function getStoredViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  return stored === 'card' ? 'card' : 'list'
}

export type SortField = 'created_at' | 'rating' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface MovieFilters {
  type?: string
  status?: string
  ratingRange?: [number, number]
  search?: string
  sortBy?: SortField
  sortOrder?: SortOrder
}

interface MovieListProps {
  moviePromise: Promise<Movie[]>
  onMovieClick?: (movie: Movie) => void
  onEdit?: (movie: Movie) => void
  onDelete?: (movie: Movie) => void
  limit?: number
  filters?: MovieFilters
}

export function MovieList({ moviePromise, onMovieClick, onEdit, onDelete, limit, filters }: MovieListProps) {
  const [activeSwipeId, setActiveSwipeId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode)
  const allMovies = use(moviePromise)

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const next = prev === 'list' ? 'card' : 'list'
      localStorage.setItem(VIEW_MODE_KEY, next)
      return next
    })
  }, [])

  const closeSwipe = useCallback(() => {
    setActiveSwipeId(null)
  }, [])

  // Close swipe on any click outside
  useEffect(() => {
    if (activeSwipeId === null) return

    const handleClick = () => closeSwipe()
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [activeSwipeId, closeSwipe])

  if (!allMovies || allMovies.length === 0) {
    return <div className={classes.empty}>Список порожній</div>
  }

  let filtered = allMovies

  // Пошук по назві
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(m => m.title.toLowerCase().includes(searchLower))
  }

  if (filters?.type) filtered = filtered.filter(m => m.type === filters.type)
  if (filters?.status) filtered = filtered.filter(m => m.status === filters.status)
  if (filters?.ratingRange) {
    const [min, max] = filters.ratingRange
    filtered = filtered.filter(m => (m.rating ?? 0) >= min && (m.rating ?? 0) <= max)
  }

  // Сортування
  if (filters?.sortBy) {
    const order = filters.sortOrder === 'asc' ? 1 : -1
    filtered = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'uk') * order
        case 'rating':
          return ((a.rating ?? 0) - (b.rating ?? 0)) * order
        case 'created_at':
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order
      }
    })
  }

  if (filtered.length === 0) {
    return <div className={classes.empty}>Нічого не знайдено</div>
  }

  const movies = limit ? filtered.slice(0, limit) : filtered

  return (
    <div className={classes.container}>
      <div className={classes.toolbar}>
        <button
          className={classes.viewToggle}
          onClick={toggleViewMode}
          aria-label={viewMode === 'list' ? 'Switch to card view' : 'Switch to list view'}
        >
          {viewMode === 'list' ? (
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 12.7999C8 11.4744 9.07452 10.3999 10.4 10.3999H21.6C22.9255 10.3999 24 11.4744 24 12.7999V19.1999C24 20.5254 22.9255 21.5999 21.6 21.5999H10.4C9.07452 21.5999 8 20.5254 8 19.1999V12.7999ZM16.8 11.9999H21.6C22.0418 11.9999 22.4 12.3581 22.4 12.7999V15.1999H16.8V11.9999ZM15.2 11.9999H10.4C9.95817 11.9999 9.6 12.3581 9.6 12.7999V15.1999H15.2V11.9999ZM9.6 16.7999V19.1999C9.6 19.6417 9.95817 19.9999 10.4 19.9999H15.2V16.7999H9.6ZM16.8 19.9999H21.6C22.0418 19.9999 22.4 19.6417 22.4 19.1999V16.7999H16.8V19.9999Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M21.6 10C22.9255 10 24 11.0745 24 12.4V18.8C24 20.1255 22.9255 21.2 21.6 21.2H10.4C9.07452 21.2 8 20.1255 8 18.8V12.4C8 11.0745 9.07452 10 10.4 10H21.6ZM20 11.6H21.6C22.0418 11.6 22.4 11.9582 22.4 12.4V13.2H20V11.6ZM18.4 11.6V13.2H9.6V12.4C9.6 11.9582 9.95817 11.6 10.4 11.6H18.4ZM20 14.8H22.4V16.4H20V14.8ZM18.4 16.4V14.8H9.6V16.4H18.4ZM20 18H22.4V18.8C22.4 19.2418 22.0418 19.6 21.6 19.6H20V18ZM18.4 19.6V18H9.6V18.8C9.6 19.2418 9.95817 19.6 10.4 19.6H18.4Z" />
            </svg>
          )}
        </button>
      </div>
      <ul className={`${classes.list} ${viewMode === 'card' ? classes.cardGrid : ''}`}>
        {movies.map((movie) => (
          <MovieItem
            key={movie.id}
            movie={movie}
            viewMode={viewMode}
            onClick={onMovieClick}
            onEdit={onEdit}
            onDelete={onDelete}
            isActive={activeSwipeId === movie.id}
            onSwipeStart={() => setActiveSwipeId(movie.id)}
            onSwipeEnd={() => setActiveSwipeId(null)}
          />
        ))}
      </ul>
    </div>
  )
}