import { use } from 'react'
import type { Movie } from '../types/movie'
import classes from './Stats.module.scss'

interface StatsProps {
  moviePromise: Promise<Movie[]>
}

export function Stats({ moviePromise }: StatsProps) {
  const movies = use(moviePromise)
  const total = movies.length
  const finished = movies.filter(m => m.status === 'finished').length
  const watching = movies.filter(m => m.status === 'watching').length
  const planned = movies.filter(m => m.status === 'planned').length

  const rated = movies.filter(m => m.rating !== null && m.rating !== undefined)
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, m) => sum + (m.rating ?? 0), 0) / rated.length).toFixed(1)
    : '-'

  const movieCount = movies.filter(m => m.type === 'movie').length
  const seriesCount = movies.filter(m => m.type === 'series').length
  const cartoonCount = movies.filter(m => m.type === 'cartoon').length

  return (
    <div className={classes.stats}>
      <div className={classes.statItem}>
        <span className={classes.statValue}>{total}</span>
        <span className={classes.statLabel}>Всього</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statValue}>{finished}</span>
        <span className={classes.statLabel}>Завершено</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statValue}>{watching}</span>
        <span className={classes.statLabel}>Дивлюсь</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statValue}>{planned}</span>
        <span className={classes.statLabel}>Планую</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statValue}>{avgRating}</span>
        <span className={classes.statLabel}>Сер. оцінка</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statValue}>{movieCount}/{seriesCount}/{cartoonCount}</span>
        <span className={classes.statLabel}>Ф/С/М</span>
      </div>
    </div>
  )
}
