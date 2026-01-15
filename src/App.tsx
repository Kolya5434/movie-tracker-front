import { Suspense, useState } from 'react'
import { fetchMovies } from './utils/getMovies.ts'
import { deleteMovie } from './utils/deleteMovie.ts'
import { MovieForm } from './components/MovieForm.tsx'
import { MovieList, type MovieFilters } from './components/MovieList.tsx'
import { ConfirmModal } from './components/ConfirmModal.tsx'
import { TYPE_LABELS, STATUS_LABELS } from './constants/constants.ts'
import type { Movie } from './types/movie.ts'
import classes from './App.module.scss'

type View = 'home' | 'add' | 'all'

function App() {
  const [moviePromise, setMoviePromise] = useState(() => fetchMovies())
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [currentView, setCurrentView] = useState<View>('home')
  const [filters, setFilters] = useState<MovieFilters>({})
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const refreshMovies = () => {
    setMoviePromise(fetchMovies())
  }

  const handleMovieClick = (movie: Movie) => {
    setEditingMovie(movie)
    setCurrentView('add')
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
    setFilters({})
    setCurrentView('all')
  }

  const handleBackHome = () => {
    setFilters({})
    setCurrentView('home')
  }

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
        <header className={classes.header}>
          <button className={classes.backButton} onClick={handleCancel}>
            ← Назад
          </button>
          <h1 className={classes.title}>
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
      </div>
    )
  }

  // Весь список
  if (currentView === 'all') {
    return (
      <div className={classes.app}>
        <header className={classes.header}>
          <button className={classes.backButton} onClick={handleBackHome}>
            ← Назад
          </button>
          <h1 className={classes.title}>Усі записи</h1>
        </header>

        <div className={classes.filters}>
          <select
            className={classes.select}
            value={filters.type || ''}
            onChange={(e) => setFilters(f => ({ ...f, type: e.target.value || undefined }))}
          >
            <option value="">Усі типи</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            className={classes.select}
            value={filters.status || ''}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
          >
            <option value="">Усі статуси</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <Suspense fallback={<p className={classes.loading}>Завантаження...</p>}>
          <MovieList
            moviePromise={moviePromise}
            onMovieClick={handleMovieClick}
            onDelete={handleDeleteRequest}
            filters={filters}
          />
        </Suspense>

        <ConfirmModal
          isOpen={!!movieToDelete}
          title="Видалити запис?"
          message={`Ви впевнені, що хочете видалити "${movieToDelete?.title}"? Цю дію не можна скасувати.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
      </div>
    )
  }

  // Головний екран
  return (
    <div className={classes.app}>
      <section className={classes.hero}>
        <h1 className={classes.heroTitle}>Мій Watchlist</h1>
        <p className={classes.heroSubtitle}>Відстежуй фільми, серіали та аніме</p>
        <div className={classes.heroActions}>
          <button className={classes.primaryButton} onClick={handleAddClick}>
            + Додати
          </button>
          <button className={classes.secondaryButton} onClick={handleViewAll}>
            Переглянути всі
          </button>
        </div>
      </section>

      <section className={classes.recentSection}>
        <div className={classes.sectionHeader}>
          <h2 className={classes.sectionTitle}>Останні додані</h2>
          <button className={classes.linkButton} onClick={handleViewAll}>
            Всі →
          </button>
        </div>
        <Suspense fallback={<p className={classes.loading}>Завантаження...</p>}>
          <MovieList
            moviePromise={moviePromise}
            onMovieClick={handleMovieClick}
            onDelete={handleDeleteRequest}
            limit={4}
          />
        </Suspense>
      </section>

      <ConfirmModal
        isOpen={!!movieToDelete}
        title="Видалити запис?"
        message={`Ви впевнені, що хочете видалити "${movieToDelete?.title}"? Цю дію не можна скасувати.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default App
