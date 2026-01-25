import { use, useState } from 'react'
import type { Movie } from '../types/movie'
import classes from './RandomPicker.module.scss'

interface RandomPickerProps {
  moviePromise: Promise<Movie[]>
  onMovieClick: (movie: Movie) => void
}

export function RandomPicker({ moviePromise, onMovieClick }: RandomPickerProps) {
  const movies = use(moviePromise)
  const [pickedMovie, setPickedMovie] = useState<Movie | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const plannedMovies = movies.filter(m => m.status === 'planned')

  const handlePick = () => {
    if (plannedMovies.length === 0 || isAnimating) return

    setIsAnimating(true)
    setPickedMovie(null)

    // Анімація "рулетки" - швидко показуємо різні фільми
    let count = 0
    const maxCount = 15
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * plannedMovies.length)
      setPickedMovie(plannedMovies[randomIndex])
      count++

      if (count >= maxCount) {
        clearInterval(interval)
        // Фінальний вибір
        const finalIndex = Math.floor(Math.random() * plannedMovies.length)
        setPickedMovie(plannedMovies[finalIndex])
        setIsAnimating(false)
      }
    }, 100)
  }

  const handleClose = () => {
    setPickedMovie(null)
  }

  const handleView = () => {
    if (pickedMovie) {
      onMovieClick(pickedMovie)
      setPickedMovie(null)
    }
  }

  if (plannedMovies.length === 0) {
    return null
  }

  return (
    <>
      <button className={classes.pickerButton} onClick={handlePick} disabled={isAnimating}>
        <span className={classes.icon}>🎲</span>
        <span>Що подивитись?</span>
        <span className={classes.count}>{plannedMovies.length}</span>
      </button>

      {pickedMovie && !isAnimating && (
        <div className={classes.overlay} onClick={handleClose}>
          <div className={classes.modal} onClick={e => e.stopPropagation()}>
            <button className={classes.closeBtn} onClick={handleClose}>✕</button>

            <div className={classes.result}>
              {pickedMovie.poster_url && (
                <img
                  src={pickedMovie.poster_url}
                  alt={pickedMovie.title}
                  className={classes.poster}
                />
              )}
              <h3 className={classes.title}>{pickedMovie.title}</h3>
              <p className={classes.hint}>Сьогодні дивимось це!</p>

              <div className={classes.actions}>
                <button className={classes.secondaryBtn} onClick={handlePick}>
                  Ще раз
                </button>
                <button className={classes.primaryBtn} onClick={handleView}>
                  Переглянути
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAnimating && pickedMovie && (
        <div className={classes.overlay}>
          <div className={classes.modal}>
            <div className={classes.spinning}>
              {pickedMovie.poster_url && (
                <img
                  src={pickedMovie.poster_url}
                  alt=""
                  className={classes.spinningPoster}
                />
              )}
              <p className={classes.spinningTitle}>{pickedMovie.title}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
