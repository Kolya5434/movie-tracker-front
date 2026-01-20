import { useState, useEffect } from 'react'
import type { Movie } from '../types/movie'
import { STATUS_LABELS, TYPE_LABELS } from '../constants/constants'
import { tmdbAPIKey } from '../environment'
import classes from './MovieDetails.module.scss'

interface MovieDetailsProps {
  movie: Movie
  onEdit: () => void
  onClose: () => void
}

interface TMDBDetails {
  overview: string
  genres: string[]
  vote_average: number
  runtime?: number
  number_of_seasons?: number
  number_of_episodes?: number
  first_air_date?: string
  release_date?: string
}

interface TMDBRecommendation {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  vote_average: number
}

export function MovieDetails({ movie, onEdit, onClose }: MovieDetailsProps) {
  const [tmdbDetails, setTmdbDetails] = useState<TMDBDetails | null>(null)
  const [recommendations, setRecommendations] = useState<TMDBRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Блокуємо скрол body та Escape для закриття
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    async function fetchDetails() {
      if (!movie.title) {
        setIsLoading(false)
        return
      }

      try {
        const isSeriesType = movie.type === 'series' || movie.type === 'cartoon'
        const searchType = isSeriesType ? 'tv' : 'movie'

        // Пошук фільму
        const searchUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${tmdbAPIKey}&query=${encodeURIComponent(movie.title)}&language=uk-UA`
        const searchRes = await fetch(searchUrl)
        const searchData = await searchRes.json()

        if (searchData.results && searchData.results.length > 0) {
          const tmdbId = searchData.results[0].id

          // Отримання деталей
          const detailsUrl = `https://api.themoviedb.org/3/${searchType}/${tmdbId}?api_key=${tmdbAPIKey}&language=uk-UA`
          const detailsRes = await fetch(detailsUrl)
          const details = await detailsRes.json()

          setTmdbDetails({
            overview: details.overview || '',
            genres: details.genres?.map((g: { name: string }) => g.name) || [],
            vote_average: details.vote_average || 0,
            runtime: details.runtime,
            number_of_seasons: details.number_of_seasons,
            number_of_episodes: details.number_of_episodes,
            first_air_date: details.first_air_date,
            release_date: details.release_date
          })

          // Завантаження рекомендацій
          const recsUrl = `https://api.themoviedb.org/3/${searchType}/${tmdbId}/recommendations?api_key=${tmdbAPIKey}&language=uk-UA`
          const recsRes = await fetch(recsUrl)
          const recsData = await recsRes.json()
          if (recsData.results) {
            setRecommendations(recsData.results.slice(0, 6))
          }
        }
      } catch (error) {
        console.error('Error fetching TMDB details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()
  }, [movie.title, movie.type])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.modal} onClick={e => e.stopPropagation()}>
        <button className={classes.closeBtn} onClick={onClose}>✕</button>

        <div className={classes.content}>
          {movie.poster_url && (
            <div className={classes.posterSection}>
              <img src={movie.poster_url} alt={movie.title} className={classes.poster} />
            </div>
          )}

          <div className={classes.info}>
            <h2 className={classes.title}>{movie.title}</h2>

            <div className={classes.badges}>
              <span className={classes.badge}>{TYPE_LABELS[movie.type]}</span>
              <span className={`${classes.badge} ${classes.statusBadge}`}>
                {STATUS_LABELS[movie.status]}
              </span>
              {movie.rating && (
                <span className={`${classes.badge} ${classes.ratingBadge}`}>
                  ★ {movie.rating}
                </span>
              )}
              {tmdbDetails && tmdbDetails.vote_average > 0 && (
                <span className={classes.badge}>
                  TMDB: {tmdbDetails.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            {isLoading ? (
              <p className={classes.loading}>Завантаження...</p>
            ) : (
              <>
                {tmdbDetails?.genres && tmdbDetails.genres.length > 0 && (
                  <div className={classes.genres}>
                    {tmdbDetails.genres.map(genre => (
                      <span key={genre} className={classes.genre}>{genre}</span>
                    ))}
                  </div>
                )}

                {tmdbDetails?.overview && (
                  <p className={classes.overview}>{tmdbDetails.overview}</p>
                )}

                <div className={classes.meta}>
                  {tmdbDetails?.release_date && (
                    <div className={classes.metaItem}>
                      <span className={classes.metaLabel}>Дата виходу</span>
                      <span>{formatDate(tmdbDetails.release_date)}</span>
                    </div>
                  )}
                  {tmdbDetails?.first_air_date && (
                    <div className={classes.metaItem}>
                      <span className={classes.metaLabel}>Перша серія</span>
                      <span>{formatDate(tmdbDetails.first_air_date)}</span>
                    </div>
                  )}
                  {tmdbDetails?.runtime && (
                    <div className={classes.metaItem}>
                      <span className={classes.metaLabel}>Тривалість</span>
                      <span>{tmdbDetails.runtime} хв</span>
                    </div>
                  )}
                  {tmdbDetails?.number_of_seasons && (
                    <div className={classes.metaItem}>
                      <span className={classes.metaLabel}>Сезони</span>
                      <span>{tmdbDetails.number_of_seasons}</span>
                    </div>
                  )}
                  {movie.total_episodes && (
                    <div className={classes.metaItem}>
                      <span className={classes.metaLabel}>Серій переглянуто</span>
                      <span>{movie.watched_episodes ?? 0} / {movie.total_episodes}</span>
                    </div>
                  )}
                  <div className={classes.metaItem}>
                    <span className={classes.metaLabel}>Додано</span>
                    <span>{formatDate(movie.created_at)}</span>
                  </div>
                </div>
              </>
            )}

            {movie.review && (
              <div className={classes.review}>
                <h4>Нотатки</h4>
                <p>{movie.review}</p>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className={classes.recommendations}>
                <h4>Схожі</h4>
                <div className={classes.recGrid}>
                  {recommendations.map(rec => (
                    <div key={rec.id} className={classes.recItem}>
                      {rec.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w154${rec.poster_path}`}
                          alt={rec.title || rec.name}
                        />
                      ) : (
                        <div className={classes.recNoImage}>?</div>
                      )}
                      <span className={classes.recTitle}>{rec.title || rec.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className={classes.editBtn} onClick={onEdit}>
              Редагувати
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
