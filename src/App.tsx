import { Suspense, useState, useMemo, useCallback } from 'react'
import { fetchMovies } from './utils/getMovies.ts'
import { deleteMovie } from './utils/deleteMovie.ts'
import { getUpcomingEpisodes } from './utils/getUpcomingEpisodes.ts'
import { MovieForm, type PrefillData } from './components/MovieForm.tsx'
import { MovieList, type MovieFilters, type SortField, type SortOrder } from './components/MovieList.tsx'
import { type FilterValues } from './components/FilterDrawer.tsx'
import { FilterDrawerWrapper } from './components/FilterDrawerWrapper.tsx'
import { CustomSelect, type SelectOption } from './components/CustomSelect.tsx'
import { Header } from './components/Header.tsx'
import { MobileNav } from './components/MobileNav.tsx'
import { Stats } from './components/Stats.tsx'
import { MovieDetails } from './components/MovieDetails.tsx'
import { UpcomingEpisodes } from './components/UpcomingEpisodes.tsx'
import { UndoToast } from './components/UndoToast.tsx'
import { RandomPicker } from './components/RandomPicker.tsx'
import { WatchCalendar } from './components/WatchCalendar.tsx'
import { useTheme } from './hooks/useTheme.ts'
import { TYPE_LABELS, STATUS_LABELS } from './constants/constants.ts'
import type { Movie } from './types/movie.ts'
import classes from './App.module.scss'

const DEFAULT_YEAR_BOUNDS: [number, number] = [1900, new Date().getFullYear()]

const DEFAULT_FILTER_VALUES: FilterValues = {
  ratingRange: [0, 10],
  yearRange: DEFAULT_YEAR_BOUNDS,
  genres: []
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Усі типи' },
  ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'created_at:desc', label: 'Спочатку нові' },
  { value: 'created_at:asc', label: 'Спочатку старі' },
  { value: 'rating:desc', label: 'Високий рейтинг' },
  { value: 'rating:asc', label: 'Низький рейтинг' },
  { value: 'title:asc', label: 'А → Я' },
  { value: 'title:desc', label: 'Я → А' }
]

type View = 'home' | 'add' | 'all' | 'calendar'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [moviePromise, setMoviePromise] = useState(() => fetchMovies())
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [currentView, setCurrentView] = useState<View>('home')
  const [previousView, setPreviousView] = useState<View>('home')
  const [filters, setFilters] = useState<MovieFilters>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Movie | null>(null)
  const [filterValues, setFilterValues] = useState<FilterValues>(DEFAULT_FILTER_VALUES)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortValue, setSortValue] = useState('created_at:desc')
  const [viewingMovie, setViewingMovie] = useState<Movie | null>(null)
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)

  // Promise для нагадувань про нові епізоди
  const episodesPromise = useMemo(
    () => moviePromise.then(movies => getUpcomingEpisodes(movies)),
    [moviePromise]
  )

  // Обчислюємо доступні жанри та межі років з фільмів
  const filterMetaPromise = useMemo(
    () => moviePromise.then(movies => {
      const genreSet = new Set<string>()
      let minYear = Infinity
      let maxYear = -Infinity

      movies.forEach(m => {
        if (m.genres) {
          m.genres.forEach(g => genreSet.add(g))
        }
        if (m.year) {
          if (m.year < minYear) minYear = m.year
          if (m.year > maxYear) maxYear = m.year
        }
      })

      const genres = Array.from(genreSet).sort((a, b) => a.localeCompare(b, 'uk'))
      const yearBounds: [number, number] = minYear <= maxYear
        ? [minYear, maxYear]
        : DEFAULT_YEAR_BOUNDS

      return { genres, yearBounds }
    }),
    [moviePromise]
  )

  const refreshMovies = () => {
    setMoviePromise(fetchMovies())
  }

  const handleMovieClick = (movie: Movie) => {
    setViewingMovie(movie)
  }

  const handleEditFromDetails = () => {
    if (viewingMovie) {
      setPreviousView(currentView)
      setEditingMovie(viewingMovie)
      setViewingMovie(null)
      setCurrentView('add')
    }
  }

  const handleCloseDetails = () => {
    setViewingMovie(null)
  }

  const handleFormSuccess = () => {
    setEditingMovie(null)
    setPrefillData(null)
    setCurrentView(previousView)
    refreshMovies()
  }

  const handleCancel = () => {
    setEditingMovie(null)
    setPrefillData(null)
    setCurrentView('home')
  }

  const handleAddClick = () => {
    setPreviousView(currentView)
    setEditingMovie(null)
    setPrefillData(null)
    setCurrentView('add')
  }

  const handleQuickAdd = (prefill: PrefillData) => {
    setPreviousView(currentView)
    setEditingMovie(null)
    setPrefillData(prefill)
    setViewingMovie(null)
    setCurrentView('add')
  }

  const handleViewAll = () => {
    setFilters({ sortBy: 'created_at', sortOrder: 'desc' })
    setFilterValues(DEFAULT_FILTER_VALUES)
    setSearchQuery('')
    setSortValue('created_at:desc')
    setCurrentView('all')
  }

  const handleBackHome = () => {
    setFilters({})
    setFilterValues(DEFAULT_FILTER_VALUES)
    setSearchQuery('')
    setSortValue('created_at:desc')
    setCurrentView('home')
  }

  const handleSortChange = (value: string) => {
    setSortValue(value)
    const [sortBy, sortOrder] = value.split(':') as [SortField, SortOrder]
    setFilters(f => ({ ...f, sortBy, sortOrder }))
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setFilters(f => ({ ...f, search: value || undefined }))
  }

  const handleNavigate = (view: View) => {
    if (view === 'add') {
      handleAddClick()
    } else if (view === 'all') {
      handleViewAll()
    } else if (view === 'calendar') {
      setCurrentView('calendar')
    } else {
      handleBackHome()
    }
  }

  const handleFilterValuesChange = (values: FilterValues) => {
    setFilterValues(values)
    setFilters(f => ({
      ...f,
      ratingRange: values.ratingRange[0] === 0 && values.ratingRange[1] === 10
        ? undefined
        : values.ratingRange,
      yearRange: values.yearRange[0] === DEFAULT_YEAR_BOUNDS[0] && values.yearRange[1] === DEFAULT_YEAR_BOUNDS[1]
        ? undefined
        : values.yearRange,
      genres: values.genres.length > 0 ? values.genres : undefined
    }))
  }

  const handleFilterReset = () => {
    setFilterValues(DEFAULT_FILTER_VALUES)
    setFilters(f => ({ ...f, ratingRange: undefined, yearRange: undefined, genres: undefined }))
  }

  const hasActiveAdvancedFilters =
    filterValues.ratingRange[0] > 0 ||
    filterValues.ratingRange[1] < 10 ||
    filterValues.genres.length > 0 ||
    (filterValues.yearRange[0] !== DEFAULT_YEAR_BOUNDS[0] || filterValues.yearRange[1] !== DEFAULT_YEAR_BOUNDS[1])

  // Delete with undo toast
  const handleDelete = useCallback((movie: Movie) => {
    setPendingDelete(movie)
    // Close editing form if we're deleting the movie being edited
    if (editingMovie?.id === movie.id) {
      setEditingMovie(null)
      setCurrentView(previousView)
    }
  }, [editingMovie, previousView])

  const handleUndoDelete = useCallback(() => {
    setPendingDelete(null)
    refreshMovies()
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return
    try {
      await deleteMovie(pendingDelete.id)
    } catch (error) {
      console.error('Delete failed:', error)
    }
    setPendingDelete(null)
  }, [pendingDelete])

  // Форма додавання/редагування
  if (currentView === 'add') {
    return (
      <div className={classes.app}>
        <Header currentView={currentView} onNavigate={handleNavigate} theme={theme} onThemeToggle={toggleTheme} />
        <header className={classes.pageHeader}>
          <button className={classes.backButton} onClick={handleCancel}>
            ← Назад
          </button>
          <h1 className={classes.pageTitle}>
            {editingMovie ? 'Редагування' : 'Новий запис'}
          </h1>
        </header>
        <MovieForm
          movie={editingMovie}
          prefill={prefillData}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
        <UndoToast
          message={`"${pendingDelete?.title}" видалено`}
          isVisible={!!pendingDelete}
          onUndo={handleUndoDelete}
          onComplete={handleConfirmDelete}
        />
        <MobileNav currentView={currentView} onNavigate={handleNavigate} />
      </div>
    )
  }

  // Весь список
  if (currentView === 'all') {
    return (
      <div className={classes.app}>
        <Header currentView={currentView} onNavigate={handleNavigate} theme={theme} onThemeToggle={toggleTheme} />
        <header className={classes.pageHeader}>
          <h1 className={classes.pageTitle}>Усі записи</h1>
        </header>

        <Suspense fallback={null}>
          <Stats moviePromise={moviePromise} />
        </Suspense>

        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${!filters.status && !filters.favoritesOnly ? classes.activeTab : ''}`}
            onClick={() => setFilters(f => ({ ...f, status: undefined, favoritesOnly: undefined }))}
          >
            Усі
          </button>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={`${classes.tab} ${filters.status === value && !filters.favoritesOnly ? classes.activeTab : ''}`}
              onClick={() => setFilters(f => ({ ...f, status: value, favoritesOnly: undefined }))}
            >
              {label}
            </button>
          ))}
          <button
            className={`${classes.tab} ${filters.favoritesOnly ? classes.activeTab : ''}`}
            onClick={() => setFilters(f => ({ ...f, status: undefined, favoritesOnly: true }))}
          >
            ❤️ Улюблені
          </button>
        </div>

        <div className={classes.searchRow}>
          <input
            type="text"
            placeholder="Пошук по назві..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={classes.searchInput}
          />
        </div>

        <div className={classes.filters}>
          <CustomSelect
            options={TYPE_OPTIONS}
            value={filters.type || ''}
            onChange={(value) => setFilters(f => ({ ...f, type: value || undefined }))}
            className={classes.filterSelect}
          />

          <CustomSelect
            options={SORT_OPTIONS}
            value={sortValue}
            onChange={handleSortChange}
            className={classes.filterSelect}
          />

          <button
            className={`${classes.filterButton} ${hasActiveAdvancedFilters ? classes.active : ''}`}
            onClick={() => setIsFilterOpen(true)}
          >
            <span>Фільтри</span>
            {hasActiveAdvancedFilters && <span className={classes.filterBadge} />}
          </button>
        </div>

        <Suspense fallback={<p className={classes.loading}>Завантаження...</p>}>
          <MovieList
            moviePromise={moviePromise}
            onMovieClick={handleMovieClick}
            onEdit={handleMovieClick}
            onDelete={handleDelete}
            onInstantDelete={handleDelete}
            pendingDeleteId={pendingDelete?.id}
            filters={filters}
          />
        </Suspense>

        <Suspense fallback={null}>
          <FilterDrawerWrapper
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            values={filterValues}
            onChange={handleFilterValuesChange}
            onReset={handleFilterReset}
            filterMetaPromise={filterMetaPromise}
          />
        </Suspense>

        {viewingMovie && (
          <MovieDetails
            movie={viewingMovie}
            onEdit={handleEditFromDetails}
            onClose={handleCloseDetails}
            onQuickAdd={handleQuickAdd}
          />
        )}

        <UndoToast
          message={`"${pendingDelete?.title}" видалено`}
          isVisible={!!pendingDelete}
          onUndo={handleUndoDelete}
          onComplete={handleConfirmDelete}
        />
        <MobileNav currentView={currentView} onNavigate={handleNavigate} />
      </div>
    )
  }

  // Календар переглядів
  if (currentView === 'calendar') {
    return (
      <div className={classes.app}>
        <Header currentView={currentView} onNavigate={handleNavigate} theme={theme} onThemeToggle={toggleTheme} />
        <header className={classes.pageHeader}>
          <h1 className={classes.pageTitle}>Календар переглядів</h1>
        </header>

        <Suspense fallback={<p className={classes.loading}>Завантаження...</p>}>
          <WatchCalendar moviePromise={moviePromise} onMovieClick={handleMovieClick} />
        </Suspense>

        {viewingMovie && (
          <MovieDetails
            movie={viewingMovie}
            onEdit={handleEditFromDetails}
            onClose={handleCloseDetails}
            onQuickAdd={handleQuickAdd}
          />
        )}

        <UndoToast
          message={`"${pendingDelete?.title}" видалено`}
          isVisible={!!pendingDelete}
          onUndo={handleUndoDelete}
          onComplete={handleConfirmDelete}
        />
        <MobileNav currentView={currentView} onNavigate={handleNavigate} />
      </div>
    )
  }

  // Головний екран
  return (
    <div className={classes.app}>
      <Header currentView={currentView} onNavigate={handleNavigate} theme={theme} onThemeToggle={toggleTheme} />

      <Suspense fallback={null}>
        <UpcomingEpisodes episodesPromise={episodesPromise} />
      </Suspense>

      <Suspense fallback={null}>
        <RandomPicker moviePromise={moviePromise} onMovieClick={handleMovieClick} />
      </Suspense>

      <header className={classes.pageHeader}>
        <h1 className={classes.pageTitle}>Останні додані</h1>
        <button className={classes.linkButton} onClick={handleViewAll}>
          Всі →
        </button>
      </header>

      <Suspense fallback={<p className={classes.loading}>Завантаження...</p>}>
        <MovieList
          moviePromise={moviePromise}
          onMovieClick={handleMovieClick}
          onEdit={handleMovieClick}
          onDelete={handleDelete}
          onInstantDelete={handleDelete}
          pendingDeleteId={pendingDelete?.id}
          limit={6}
        />
      </Suspense>

      {viewingMovie && (
        <MovieDetails
          movie={viewingMovie}
          onEdit={handleEditFromDetails}
          onClose={handleCloseDetails}
          onQuickAdd={handleQuickAdd}
        />
      )}

      <UndoToast
        message={`"${pendingDelete?.title}" видалено`}
        isVisible={!!pendingDelete}
        onUndo={handleUndoDelete}
        onComplete={handleConfirmDelete}
      />
      <MobileNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  )
}

export default App
