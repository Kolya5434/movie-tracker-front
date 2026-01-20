import { useState, useRef, useEffect, type TouchEvent } from 'react'
import type { Movie } from '../types/movie'
import { STATUS_LABELS, TYPE_LABELS } from '../constants/constants'
import type { ViewMode } from './MovieList'
import classes from './MovieList.module.scss'
import {tmdbAPIKey} from "../environment.ts";

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

// Кеш для постерів - зберігається між ре-рендерами
const posterCache = new Map<string, string>()

// Нормалізація кириличних літер (рос/укр до спільного вигляду)
function normalizeCyrillic(text: string): string {
  return text
    .replace(/[эє]/g, 'е')
    .replace(/[ыіїi]/g, 'и')
    .replace(/ё/g, 'е')
    .replace(/ъ/g, '')
    .replace(/ь/g, '')
    .replace(/ґ/g, 'г')
}

// Нормалізація назви для порівняння
function normalizeTitle(title: string): string {
  return normalizeCyrillic(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '') // видаляємо все крім букв, цифр, пробілів
      .replace(/\s+/g, ' ')
      .trim()
  )
}

// Перевірка схожості назв
function isSimilarTitle(searchQuery: string, resultTitle: string): boolean {
  const query = normalizeTitle(searchQuery)
  const result = normalizeTitle(resultTitle)

  // Якщо одна назва містить іншу - це збіг
  if (result.includes(query) || query.includes(result)) {
    return true
  }

  // Перевіряємо перші слова
  const queryWords = query.split(' ').filter(w => w.length > 2)
  const resultWords = result.split(' ').filter(w => w.length > 2)

  if (queryWords.length === 0 || resultWords.length === 0) {
    return false
  }

  // Перше значуще слово має збігатися
  if (queryWords[0] === resultWords[0]) {
    return true
  }

  // Підрахунок спільних слів
  const commonWords = queryWords.filter(w => resultWords.includes(w))
  const similarity = commonWords.length / Math.min(queryWords.length, resultWords.length)

  return similarity >= 0.5
}

async function getPosterImage(movieName?: string, type?: string): Promise<string> {
  if (!movieName) return '';

  const cleanName = movieName.trim();
  const cacheKey = `${cleanName}_${type || 'all'}`;

  // Перевіряємо кеш
  if (posterCache.has(cacheKey)) {
    return posterCache.get(cacheKey)!;
  }

  try {
    let posterPath = '';

    // Визначаємо порядок пошуку залежно від типу
    const isSeriesType = type === 'series' || type === 'cartoon';
    const searchOrder = isSeriesType
      ? ['tv', 'movie']  // Для серіалів спочатку шукаємо в TV
      : ['movie', 'tv']; // Для фільмів спочатку в movies

    for (const searchType of searchOrder) {
      if (posterPath) break;

      // Спочатку з українською локалізацією
      const url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${tmdbAPIKey}&query=${encodeURIComponent(cleanName)}&language=uk-UA`;
      let response = await fetch(url);
      let data = await response.json();

      console.log(`[TMDB] Search "${cleanName}" in ${searchType} (uk-UA):`, data.results?.length || 0, 'results');

      // Якщо не знайдено - без мовного обмеження
      if (!data.results || data.results.length === 0) {
        const urlNoLang = `https://api.themoviedb.org/3/search/${searchType}?api_key=${tmdbAPIKey}&query=${encodeURIComponent(cleanName)}`;
        response = await fetch(urlNoLang);
        data = await response.json();
        console.log(`[TMDB] Search "${cleanName}" in ${searchType} (no lang):`, data.results?.length || 0, 'results');
      }

      if (data.results && data.results.length > 0) {
        // Шукаємо перший результат зі схожою назвою
        const match = data.results.find((r: { name?: string; title?: string; poster_path?: string }) => {
          const resultTitle = r.name || r.title || '';
          return isSimilarTitle(cleanName, resultTitle);
        });

        if (match) {
          console.log(`[TMDB] Found:`, match.name || match.title, '| poster:', match.poster_path);
          posterPath = match.poster_path;
        } else {
          console.log(`[TMDB] No similar match for "${cleanName}" in ${searchType}. First result was:`, data.results[0].name || data.results[0].title);
        }
      }
    }

    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '';

    // Зберігаємо в кеш
    posterCache.set(cacheKey, posterUrl);
    return posterUrl;
  } catch (error) {
    console.error("Помилка завантаження постера:", error);
    posterCache.set(cacheKey, '');
    return '';
  }
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
  const [posterUrl, setPosterUrl] = useState<string>('')
  const [isLoadingPoster, setIsLoadingPoster] = useState(true)
  const [posterError, setPosterError] = useState(false)

  const startX = useRef(0)
  const currentOffset = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)

  // Завантаження постера
  useEffect(() => {
    const cacheKey = `${movie.title}_${movie.type}`;
    if (movie.title) {
      // Якщо є в кеші - не показуємо loading
      if (posterCache.has(cacheKey)) {
        setIsLoadingPoster(false)
      } else {
        setIsLoadingPoster(true)
      }
      setPosterError(false)
      getPosterImage(movie.title, movie.type).then((url) => {
        setPosterUrl(url)
        setIsLoadingPoster(false)
      })
    } else {
      setIsLoadingPoster(false)
    }
  }, [movie.title, movie.type])

  const handlePosterError = () => {
    setPosterError(true)
    setPosterUrl('')
  }

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

  // Рендер постера (card view)
  const renderCardPoster = () => {
    if (isLoadingPoster) {
      return <div className={`${classes.posterPlaceholder} ${classes.skeleton}`} />
    }
    if (posterUrl && !posterError) {
      return <img src={posterUrl} alt={movie.title} className={classes.poster} onError={handlePosterError} />
    }
    return (
      <div className={classes.posterPlaceholder}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.5 5.5V18.5C19.5 19.0523 19.0523 19.5 18.5 19.5H5.5C4.94772 19.5 4.5 19.0523 4.5 18.5V5.5C4.5 4.94772 4.94772 4.5 5.5 4.5H18.5C19.0523 4.5 19.5 4.94772 19.5 5.5Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4.5 8H7.5M4.5 12H7.5M4.5 16H7.5M16.5 8H19.5M16.5 12H19.5M16.5 16H19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 14.5L13.5 12L10 9.5V14.5Z" fill="currentColor"/>
        </svg>
      </div>
    )
  }

  // Рендер постера (list view)
  const renderListPoster = () => {
    if (isLoadingPoster) {
      return <div className={`${classes.listPosterPlaceholder} ${classes.skeleton}`} />
    }
    if (posterUrl && !posterError) {
      return <img src={posterUrl} alt="" className={classes.listPoster} onError={handlePosterError} />
    }
    return (
      <div className={classes.listPosterPlaceholder}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.5 5.5V18.5C19.5 19.0523 19.0523 19.5 18.5 19.5H5.5C4.94772 19.5 4.5 19.0523 4.5 18.5V5.5C4.5 4.94772 4.94772 4.5 5.5 4.5H18.5C19.0523 4.5 19.5 4.94772 19.5 5.5Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4.5 8H7.5M4.5 12H7.5M4.5 16H7.5M16.5 8H19.5M16.5 12H19.5M16.5 16H19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 14.5L13.5 12L10 9.5V14.5Z" fill="currentColor"/>
        </svg>
      </div>
    )
  }

  // Card view
  if (viewMode === 'card') {
    return (
      <li className={classes.cardItem} onClick={() => onClick?.(movie)}>
        {renderCardPoster()}
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
        {renderListPoster()}
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