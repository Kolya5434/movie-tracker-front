import { use } from 'react'
import type { Movie } from '../types/movie.ts'
import { STATUS_LABELS, TYPE_LABELS } from '../constants/constants.ts'
import classes from './MovieList.module.scss'

export interface MovieFilters {
  type?: string
  status?: string
}

interface MovieListProps {
  moviePromise: Promise<Movie[]>
  onMovieClick?: (movie: Movie) => void
  onDelete?: (movie: Movie) => void
  limit?: number
  filters?: MovieFilters
}

export function MovieList({ moviePromise, onMovieClick, onDelete, limit, filters }: MovieListProps) {
  const allMovies = use(moviePromise)

  if (!allMovies || allMovies.length === 0) {
    return <div className={classes.empty}>Список порожній</div>
  }

  let filtered = allMovies
  if (filters?.type) {
    filtered = filtered.filter(m => m.type === filters.type)
  }
  if (filters?.status) {
    filtered = filtered.filter(m => m.status === filters.status)
  }

  if (filtered.length === 0) {
    return <div className={classes.empty}>Нічого не знайдено</div>
  }

  const movies = limit ? filtered.slice(0, limit) : filtered

  const handleDelete = (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation()
    onDelete?.(movie)
  }

  return (
    <ul className={classes.list}>
      {movies.map((movie) => (
        <li
          key={movie.id}
          className={classes.item}
          onClick={() => onMovieClick?.(movie)}
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
            {onDelete && (
              <button
                className={classes.deleteButton}
                onClick={(e) => handleDelete(e, movie)}
                title="Видалити"
              >
                ×
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
