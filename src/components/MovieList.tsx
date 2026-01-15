import { use } from 'react'
import type { Movie } from '../types/movie.ts'
import { STATUS_LABELS, TYPE_LABELS } from '../constants/constants.ts'
import classes from './MovieList.module.scss'

interface MovieListProps {
  moviePromise: Promise<Movie[]>
  onMovieClick?: (movie: Movie) => void
  limit?: number
}

export function MovieList({ moviePromise, onMovieClick, limit }: MovieListProps) {
  const allMovies = use(moviePromise)

  if (!allMovies || allMovies.length === 0) {
    return <div className={classes.empty}>Список порожній</div>
  }

  const movies = limit ? allMovies.slice(0, limit) : allMovies

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
          <span className={`${classes.rating} ${movie.rating && movie.rating >= 8 ? classes.high : ''}`}>
            {movie.rating ?? '-'}
          </span>
        </li>
      ))}
    </ul>
  )
}
