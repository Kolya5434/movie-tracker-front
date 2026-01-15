import { use } from 'react'
import type { Movie } from '../types/movie.ts'
import { STATUS_LABELS, TYPE_LABELS } from '../constants/constants.ts'
import classes from './MovieList.module.scss'

interface MovieListProps {
  moviePromise: Promise<Movie[]>
  onMovieClick?: (movie: Movie) => void
}

export function MovieList({ moviePromise, onMovieClick }: MovieListProps) {
  const movies = use(moviePromise)

  if (!movies || movies.length === 0) {
    return <div className={classes.empty}>Список порожній</div>
  }

  return (
    <ul className={classes.list}>
      {movies.map((movie) => (
        <li
          key={movie.id}
          className={classes.item}
          onClick={() => onMovieClick?.(movie)}
        >
          <div className={classes.header}>
            <h3 className={classes.title}>{movie.title}</h3>
            <span className={`${classes.rating} ${movie.rating && movie.rating >= 8 ? classes.high : ''}`}>
              {movie.rating ?? '-'}
            </span>
          </div>
          <div className={classes.meta}>
            {TYPE_LABELS[movie.type] || movie.type} • {STATUS_LABELS[movie.status] || movie.status}
          </div>
        </li>
      ))}
    </ul>
  )
}
