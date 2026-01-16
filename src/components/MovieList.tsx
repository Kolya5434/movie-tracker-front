import { use, useState, useEffect, useCallback } from 'react'
import type { Movie } from '../types/movie.ts'
import classes from './MovieList.module.scss'
import { MovieItem } from './MovieItem'

export interface MovieFilters {
  type?: string
  status?: string
  ratingRange?: [number, number]
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
  const allMovies = use(moviePromise)

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
  if (filters?.type) filtered = filtered.filter(m => m.type === filters.type)
  if (filters?.status) filtered = filtered.filter(m => m.status === filters.status)
  if (filters?.ratingRange) {
    const [min, max] = filters.ratingRange
    filtered = filtered.filter(m => (m.rating ?? 0) >= min && (m.rating ?? 0) <= max)
  }

  if (filtered.length === 0) {
    return <div className={classes.empty}>Нічого не знайдено</div>
  }

  const movies = limit ? filtered.slice(0, limit) : filtered

  return (
    <ul className={classes.list}>
      {movies.map((movie) => (
        <MovieItem
          key={movie.id}
          movie={movie}
          onClick={onMovieClick}
          onEdit={onEdit}
          onDelete={onDelete}
          isActive={activeSwipeId === movie.id}
          onSwipeStart={() => setActiveSwipeId(movie.id)}
          onSwipeEnd={() => setActiveSwipeId(null)}
        />
      ))}
    </ul>
  )
}