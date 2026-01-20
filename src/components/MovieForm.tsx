import { useForm, type SubmitHandler } from 'react-hook-form'
import { addMovie, type MovieInsert } from '../utils/addMovie'
import { updateMovie } from '../utils/updateMovie'
import { useState, useEffect, useRef } from 'react'
import type { Movie, MovieType } from '../types/movie'
import { CustomSelect } from './CustomSelect'
import { tmdbAPIKey } from '../environment'
import classes from './MovieForm.module.scss'

interface TMDBResult {
  id: number
  title?: string  // for movies
  name?: string   // for tv
  original_title?: string
  original_name?: string
  media_type: 'movie' | 'tv' | 'person'
  release_date?: string
  first_air_date?: string
  poster_path?: string | null
  vote_average?: number
  genre_ids?: number[]
}

// Маппінг TMDB genre IDs до назв
const GENRE_MAP: Record<number, string> = {
  28: 'Бойовик', 12: 'Пригоди', 16: 'Анімація', 35: 'Комедія',
  80: 'Кримінал', 99: 'Документальний', 18: 'Драма', 10751: 'Сімейний',
  14: 'Фентезі', 36: 'Історичний', 27: 'Жахи', 10402: 'Музика',
  9648: 'Детектив', 10749: 'Мелодрама', 878: 'Фантастика', 10770: 'Телефільм',
  53: 'Трилер', 10752: 'Військовий', 37: 'Вестерн',
  10759: 'Бойовик і Пригоди', 10762: 'Дитячий', 10763: 'Новини',
  10764: 'Реаліті', 10765: 'Фантастика і Фентезі', 10766: 'Мильна опера',
  10767: 'Ток-шоу', 10768: 'Війна і Політика'
}

interface TMDBSearchResult {
  tmdbId: number
  ukTitle: string
  ruTitle: string
  enTitle: string
  year: string
  mediaType: 'movie' | 'tv'
  posterPath: string | null
  tmdbRating: number | null
  genres: string[]
}

async function searchTMDB(query: string): Promise<TMDBSearchResult[]> {
  if (!query || query.length < 3) return []

  try {
    // Паралельно шукаємо з різними мовами
    const [ukRes, ruRes, enRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbAPIKey}&query=${encodeURIComponent(query)}&language=uk-UA`),
      fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbAPIKey}&query=${encodeURIComponent(query)}&language=ru-RU`),
      fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbAPIKey}&query=${encodeURIComponent(query)}&language=en-US`)
    ])

    const [ukData, ruData, enData] = await Promise.all([ukRes.json(), ruRes.json(), enRes.json()])

    const ukResults: TMDBResult[] = ukData.results || []
    const ruResults: TMDBResult[] = ruData.results || []
    const enResults: TMDBResult[] = enData.results || []

    // Об'єднуємо результати по ID
    const combined: TMDBSearchResult[] = ukResults
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 8)
      .map(ukItem => {
        const ruItem = ruResults.find(r => r.id === ukItem.id)
        const enItem = enResults.find(r => r.id === ukItem.id)

        const ukTitle = ukItem.title || ukItem.name || ''
        const ruTitle = ruItem?.title || ruItem?.name || ukTitle
        const enTitle = enItem?.title || enItem?.name || ukItem.original_title || ukItem.original_name || ''

        const dateStr = ukItem.release_date || ukItem.first_air_date || ''
        const year = dateStr ? dateStr.substring(0, 4) : ''

        const genres = (ukItem.genre_ids || [])
          .map(id => GENRE_MAP[id])
          .filter(Boolean)

        return {
          tmdbId: ukItem.id,
          ukTitle,
          ruTitle,
          enTitle,
          year,
          mediaType: ukItem.media_type as 'movie' | 'tv',
          posterPath: ukItem.poster_path ?? null,
          tmdbRating: ukItem.vote_average ?? null,
          genres
        }
      })

    return combined
  } catch (error) {
    console.error('TMDB search error:', error)
    return []
  }
}

interface ITypeOption {
  value: MovieType;
  label: string
}

const TYPE_OPTIONS: ITypeOption[] = [
  { value: 'movie', label: 'Фільм' },
  { value: 'series', label: 'Серіал' },
  { value: 'cartoon', label: 'Мультфільм' }
]

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Планую' },
  { value: 'watching', label: 'Дивлюсь' },
  { value: 'finished', label: 'Завершено' },
  { value: 'dropped', label: 'Кинув' }
]

interface MovieFormProps {
  movie?: Movie | null
  onSuccess: () => void
  onCancel?: () => void
  onDelete?: (movie: Movie) => void
}

interface FormValues {
  title: string
  type: MovieInsert['type']
  status: MovieInsert['status']
  rating: number | ''
  total_episodes: number | ''
  watched_episodes: number | ''
  poster_url: string
  review: string
  tmdb_id: number | null
  tmdb_rating: number | null
  is_favorite: boolean
  watched_at: string
  year: number | null
  genres: string[] | null
}

export function MovieForm({ movie, onSuccess, onCancel, onDelete }: MovieFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchResults, setSearchResults] = useState<TMDBSearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [userTyping, setUserTyping] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isEditing = !!movie

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      title: movie?.title ?? '',
      type: movie?.type ?? 'movie',
      status: movie?.status ?? 'planned',
      rating: movie?.rating ?? '',
      total_episodes: movie?.total_episodes ?? '',
      watched_episodes: movie?.watched_episodes ?? '',
      poster_url: movie?.poster_url ?? '',
      review: movie?.review ?? '',
      tmdb_id: movie?.tmdb_id ?? null,
      tmdb_rating: movie?.tmdb_rating ?? null,
      is_favorite: movie?.is_favorite ?? false,
      watched_at: movie?.watched_at ?? '',
      year: movie?.year ?? null,
      genres: movie?.genres ?? null
    }
  })

  const typeValue = watch('type') as MovieType
  const statusValue = watch('status')
  const titleValue = watch('title')

  // Debounced search - only when user is typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!userTyping || !titleValue || titleValue.length < 3) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchTMDB(titleValue)
      setSearchResults(results)
      setShowDropdown(results.length > 0)
      setIsSearching(false)
    }, 400)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [titleValue, userTyping])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResult = (result: TMDBSearchResult, titleType: 'uk' | 'ru' | 'en') => {
    const selectedTitle = titleType === 'uk' ? result.ukTitle : titleType === 'ru' ? result.ruTitle : result.enTitle
    setValue('title', selectedTitle)

    // Автоматично встановлюємо тип
    if (result.mediaType === 'tv') {
      setValue('type', 'series')
    } else {
      setValue('type', 'movie')
    }

    // Встановлюємо постер
    if (result.posterPath) {
      setValue('poster_url', `https://image.tmdb.org/t/p/w500${result.posterPath}`)
    }

    // Зберігаємо TMDB дані
    setValue('tmdb_id', result.tmdbId)
    setValue('tmdb_rating', result.tmdbRating)
    setValue('year', result.year ? parseInt(result.year) : null)
    setValue('genres', result.genres.length > 0 ? result.genres : null)

    setShowDropdown(false)
    setSearchResults([])
    setUserTyping(false)
  }

  const posterUrlValue = watch('poster_url')

  useEffect(() => {
    reset({
      title: movie?.title ?? '',
      type: movie?.type ?? 'movie',
      status: movie?.status ?? 'planned',
      rating: movie?.rating ?? '',
      total_episodes: movie?.total_episodes ?? '',
      watched_episodes: movie?.watched_episodes ?? '',
      poster_url: movie?.poster_url ?? '',
      review: movie?.review ?? '',
      tmdb_id: movie?.tmdb_id ?? null,
      tmdb_rating: movie?.tmdb_rating ?? null,
      is_favorite: movie?.is_favorite ?? false,
      watched_at: movie?.watched_at ?? '',
      year: movie?.year ?? null,
      genres: movie?.genres ?? null
    })
    setUserTyping(false)
    setShowDropdown(false)
    setSearchResults([])
  }, [movie, reset])

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)
    try {
      const movieData = {
        title: data.title,
        type: data.type,
        status: data.status,
        rating: data.rating ? Number(data.rating) : null,
        total_episodes: data.total_episodes ? Number(data.total_episodes) : null,
        watched_episodes: data.watched_episodes ? Number(data.watched_episodes) : null,
        poster_url: data.poster_url || null,
        review: data.review || null,
        tmdb_id: data.tmdb_id,
        tmdb_rating: data.tmdb_rating,
        is_favorite: data.is_favorite,
        watched_at: data.watched_at || null,
        year: data.year,
        genres: data.genres
      }

      if (isEditing) {
        await updateMovie(movie.id, movieData)
      } else {
        await addMovie(movieData)
        reset()
        setUserTyping(false)
      }

      onSuccess()
    } catch (error) {
      alert(`Помилка при ${isEditing ? 'оновленні' : 'додаванні'}: ` + error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      <div className={classes.header}>
        <h3>{isEditing ? 'Редагувати' : 'Додати нове'}</h3>
        {isEditing && onCancel && (
          <button type="button" onClick={onCancel} className={classes.cancelButton}>
            ✕
          </button>
        )}
      </div>

      <div className={classes.field}>
        <label className={classes.label}>Назва</label>
        <div className={classes.autocomplete} ref={dropdownRef}>
          <input
            {...register('title', { required: 'Назва обовʼязкова' })}
            placeholder="Введіть назву"
            className={classes.input}
            autoComplete="off"
            onInput={() => setUserTyping(true)}
          />
          {isSearching && <div className={classes.searchingIndicator}>...</div>}
          {showDropdown && searchResults.length > 0 && (
            <div className={classes.dropdown}>
              {searchResults.map((result, index) => (
                <div key={index} className={classes.dropdownItem}>
                  <div className={classes.dropdownPoster}>
                    {result.posterPath ? (
                      <img src={`https://image.tmdb.org/t/p/w92${result.posterPath}`} alt="" />
                    ) : (
                      <div className={classes.noPoster}>?</div>
                    )}
                  </div>
                  <div className={classes.dropdownInfo}>
                    <div className={classes.dropdownMeta}>
                      {result.mediaType === 'tv' ? 'Серіал' : 'Фільм'} {result.year && `• ${result.year}`}
                    </div>
                    <div className={classes.dropdownTitles}>
                      <button type="button" onClick={() => handleSelectResult(result, 'uk')} className={classes.titleBtn}>
                        🇺🇦 {result.ukTitle}
                      </button>
                      {result.ruTitle !== result.ukTitle && (
                        <button type="button" onClick={() => handleSelectResult(result, 'ru')} className={classes.titleBtn}>
                          🇷🇺 {result.ruTitle}
                        </button>
                      )}
                      {result.enTitle !== result.ukTitle && result.enTitle !== result.ruTitle && (
                        <button type="button" onClick={() => handleSelectResult(result, 'en')} className={classes.titleBtn}>
                          🇬🇧 {result.enTitle}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.title && <span className={classes.error}>{errors.title.message}</span>}
      </div>

      <div className={classes.row}>
        <div className={classes.field}>
          <label className={classes.label}>Тип</label>
          <CustomSelect
            options={TYPE_OPTIONS}
            value={typeValue || 'movie'}
            onChange={(val) => setValue('type', val as MovieInsert['type'])}
          />
        </div>

        <div className={classes.field}>
          <label className={classes.label}>Статус</label>
          <CustomSelect
            options={STATUS_OPTIONS}
            value={statusValue || 'planned'}
            onChange={(val) => setValue('status', val as MovieInsert['status'])}
          />
        </div>
      </div>

      <div className={classes.row}>
        <div className={classes.field}>
          <label className={classes.label}>Оцінка</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="0 - 10"
            {...register('rating', { min: 0, max: 10 })}
            className={classes.input}
          />
        </div>

        <div className={classes.field}>
          <label className={classes.label}>Дата перегляду</label>
          <input
            type="date"
            {...register('watched_at')}
            className={classes.input}
          />
        </div>
      </div>

      <label className={classes.checkbox}>
        <input
          type="checkbox"
          {...register('is_favorite')}
        />
        <span>Улюблене</span>
      </label>

      {typeValue === 'series' && (
        <div className={classes.row}>
          <div className={classes.field}>
            <label className={classes.label}>Всього серій</label>
            <input
              type="number"
              min="1"
              placeholder="12"
              {...register('total_episodes', { min: 1 })}
              className={classes.input}
            />
          </div>
          <div className={classes.field}>
            <label className={classes.label}>Переглянуто</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              {...register('watched_episodes', { min: 0 })}
              className={classes.input}
            />
          </div>
        </div>
      )}

      {posterUrlValue && (
        <div className={classes.posterPreview}>
          <img src={posterUrlValue} alt="Постер" />
          <button
            type="button"
            className={classes.removePoster}
            onClick={() => setValue('poster_url', '')}
          >
            ✕
          </button>
        </div>
      )}

      <div className={classes.field}>
        <label className={classes.label}>Нотатки</label>
        <textarea
          placeholder="Твої думки про фільм/серіал..."
          {...register('review')}
          className={classes.textarea}
          rows={3}
        />
      </div>

      <div className={classes.row}>
        {isEditing && onCancel && (
          <button type="button" onClick={onCancel} className={classes.buttonSecondary}>
            Скасувати
          </button>
        )}
        <button type="submit" disabled={isSubmitting} className={classes.button}>
          {isSubmitting ? 'Зберігаю...' : isEditing ? 'Зберегти' : 'Додати'}
        </button>
      </div>

      {isEditing && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(movie)}
          className={classes.deleteButton}
        >
          Видалити
        </button>
      )}
    </form>
  )
}
