import { use, useState, useMemo } from 'react'
import type { Movie } from '../types/movie'
import { TYPE_LABELS } from '../constants/constants'
import classes from './WatchCalendar.module.scss'

interface WatchCalendarProps {
  moviePromise: Promise<Movie[]>
  onMovieClick: (movie: Movie) => void
}

const MONTHS_UA = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
]

const DAYS_UA = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export function WatchCalendar({ moviePromise, onMovieClick }: WatchCalendarProps) {
  const movies = use(moviePromise)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Групуємо фільми по датах перегляду
  const moviesByDate = useMemo(() => {
    const map = new Map<string, Movie[]>()
    movies.forEach(movie => {
      if (movie.watched_at) {
        const dateKey = movie.watched_at.split('T')[0]
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        map.get(dateKey)!.push(movie)
      }
    })
    return map
  }, [movies])

  // Генеруємо дні для поточного місяця
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()

    // День тижня першого дня (0 = неділя, потрібно 0 = понеділок)
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6

    const days: (number | null)[] = []

    // Порожні клітинки на початку
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Дні місяця
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [currentMonth, currentYear])

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setSelectedDate(null)
  }

  const formatDateKey = (day: number) => {
    const month = String(currentMonth + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${currentYear}-${month}-${dayStr}`
  }

  const isToday = (day: number) => {
    return day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
  }

  const selectedMovies = selectedDate ? moviesByDate.get(selectedDate) || [] : []

  // Статистика за місяць
  const monthStats = useMemo(() => {
    let count = 0
    calendarDays.forEach(day => {
      if (day) {
        const dateKey = formatDateKey(day)
        const dayMovies = moviesByDate.get(dateKey)
        if (dayMovies) count += dayMovies.length
      }
    })
    return count
  }, [calendarDays, moviesByDate, currentMonth, currentYear])

  return (
    <div className={classes.calendar}>
      <div className={classes.header}>
        <button className={classes.navBtn} onClick={goToPrevMonth}>&lt;</button>
        <div className={classes.monthYear}>
          <span className={classes.month}>{MONTHS_UA[currentMonth]}</span>
          <span className={classes.year}>{currentYear}</span>
          {monthStats > 0 && (
            <span className={classes.monthStats}>{monthStats} переглядів</span>
          )}
        </div>
        <button className={classes.navBtn} onClick={goToNextMonth}>&gt;</button>
      </div>

      <button className={classes.todayBtn} onClick={goToToday}>
        Сьогодні
      </button>

      <div className={classes.weekdays}>
        {DAYS_UA.map(day => (
          <div key={day} className={classes.weekday}>{day}</div>
        ))}
      </div>

      <div className={classes.days}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className={classes.emptyDay} />
          }

          const dateKey = formatDateKey(day)
          const dayMovies = moviesByDate.get(dateKey)
          const hasMovies = dayMovies && dayMovies.length > 0
          const isSelected = selectedDate === dateKey

          return (
            <button
              key={day}
              className={`${classes.day} ${hasMovies ? classes.hasMovies : ''} ${isToday(day) ? classes.today : ''} ${isSelected ? classes.selected : ''}`}
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
            >
              <span className={classes.dayNumber}>{day}</span>
              {hasMovies && (
                <span className={classes.movieCount}>{dayMovies.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className={classes.selectedMovies}>
          <h4 className={classes.selectedDate}>
            {new Date(selectedDate).toLocaleDateString('uk-UA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h4>
          {selectedMovies.length === 0 ? (
            <p className={classes.noMovies}>Немає переглядів</p>
          ) : (
            <ul className={classes.movieList}>
              {selectedMovies.map(movie => (
                <li key={movie.id} className={classes.movieItem} onClick={() => onMovieClick(movie)}>
                  {movie.poster_url && (
                    <img src={movie.poster_url} alt="" className={classes.moviePoster} />
                  )}
                  <div className={classes.movieInfo}>
                    <span className={classes.movieTitle}>{movie.title}</span>
                    <span className={classes.movieType}>{TYPE_LABELS[movie.type]}</span>
                    {movie.rating && (
                      <span className={classes.movieRating}>★ {movie.rating}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
