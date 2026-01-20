import { Suspense, useState } from 'react'
import { fetchMovies } from './utils/getMovies.ts'
import { deleteMovie } from './utils/deleteMovie.ts'
import { MovieForm } from './components/MovieForm.tsx'
import { MovieList, type MovieFilters, type SortField, type SortOrder } from './components/MovieList.tsx'
import { ConfirmModal } from './components/ConfirmModal.tsx'
import { FilterDrawer, type FilterValues } from './components/FilterDrawer.tsx'
import { CustomSelect, type SelectOption } from './components/CustomSelect.tsx'
import { Header } from './components/Header.tsx'
import { MobileNav } from './components/MobileNav.tsx'
import { Stats } from './components/Stats.tsx'
import { MovieDetails } from './components/MovieDetails.tsx'
import { useTheme } from './hooks/useTheme.ts'
import { TYPE_LABELS, STATUS_LABELS } from './constants/constants.ts'
import type { Movie } from './types/movie.ts'
import classes from './App.module.scss'

const DEFAULT_FILTER_VALUES: FilterValues = {
  ratingRange: [0, 10]
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Усі типи' },
  ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Усі статуси' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'created_at:desc', label: 'Спочатку нові' },
  { value: 'created_at:asc', label: 'Спочатку старі' },
  { value: 'rating:desc', label: 'Високий рейтинг' },
  { value: 'rating:asc', label: 'Низький рейтинг' },
  { value: 'title:asc', label: 'А → Я' },
  { value: 'title:desc', label: 'Я → А' }
]

type View = 'home' | 'add' | 'all'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [moviePromise, setMoviePromise] = useState(() => fetchMovies())
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [currentView, setCurrentView] = useState<View>('home')
  const [filters, setFilters] = useState<MovieFilters>({})
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<FilterValues>(DEFAULT_FILTER_VALUES)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortValue, setSortValue] = useState('created_at:desc')
  const [viewingMovie, setViewingMovie] = useState<Movie | null>(null)

  const refreshMovies = () => {
    setMoviePromise(fetchMovies())
  }

  const handleMovieClick = (movie: Movie) => {
    setViewingMovie(movie)
  }

  const handleEditFromDetails = () => {
    if (viewingMovie) {
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
    setCurrentView('home')
    refreshMovies()
  }

  const handleCancel = () => {
    setEditingMovie(null)
    setCurrentView('home')
  }

  const handleAddClick = () => {
    setEditingMovie(null)
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
        : values.ratingRange
    }))
  }

  const handleFilterReset = () => {
    setFilterValues(DEFAULT_FILTER_VALUES)
    setFilters(f => ({ ...f, ratingRange: undefined }))
  }

  const hasActiveAdvancedFilters = filterValues.ratingRange[0] > 0 || filterValues.ratingRange[1] < 10

  const handleDeleteRequest = (movie: Movie) => {
    setMovieToDelete(movie)
  }

  const handleDeleteConfirm = async () => {
    if (!movieToDelete) return
    setIsDeleting(true)
    try {
      await deleteMovie(movieToDelete.id)
      setMovieToDelete(null)
      setEditingMovie(null)
      setCurrentView('home')
      refreshMovies()
    } catch (error) {
      alert('Помилка при видаленні: ' + error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setMovieToDelete(null)
  }

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
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
          onDelete={handleDeleteRequest}
        />

        <ConfirmModal
          isOpen={!!movieToDelete}
          title="Видалити запис?"
          message={`Ви впевнені, що хочете видалити "${movieToDelete?.title}"? Цю дію не можна скасувати.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
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
            className={`${classes.tab} ${!filters.status ? classes.activeTab : ''}`}
            onClick={() => setFilters(f => ({ ...f, status: undefined }))}
          >
            Усі
          </button>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={`${classes.tab} ${filters.status === value ? classes.activeTab : ''}`}
              onClick={() => setFilters(f => ({ ...f, status: value }))}
            >
              {label}
            </button>
          ))}
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
            onDelete={handleDeleteRequest}
            filters={filters}
          />
        </Suspense>

        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          values={filterValues}
          onChange={handleFilterValuesChange}
          onReset={handleFilterReset}
        />

        {viewingMovie && (
          <MovieDetails
            movie={viewingMovie}
            onEdit={handleEditFromDetails}
            onClose={handleCloseDetails}
          />
        )}

        <ConfirmModal
          isOpen={!!movieToDelete}
          title="Видалити запис?"
          message={`Ви впевнені, що хочете видалити "${movieToDelete?.title}"? Цю дію не можна скасувати.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
        <MobileNav currentView={currentView} onNavigate={handleNavigate} />
      </div>
    )
  }

  // Головний екран
  return (
    <div className={classes.app}>
      <Header currentView={currentView} onNavigate={handleNavigate} theme={theme} onThemeToggle={toggleTheme} />
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
          onDelete={handleDeleteRequest}
          limit={6}
        />
      </Suspense>

      {viewingMovie && (
        <MovieDetails
          movie={viewingMovie}
          onEdit={handleEditFromDetails}
          onClose={handleCloseDetails}
        />
      )}

      <ConfirmModal
        isOpen={!!movieToDelete}
        title="Видалити запис?"
        message={`Ви впевнені, що хочете видалити "${movieToDelete?.title}"? Цю дію не можна скасувати.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
      <MobileNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  )
}

export default App
