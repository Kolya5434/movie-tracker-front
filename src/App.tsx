import { Suspense, useState } from 'react'
import { fetchMovies } from './utils/getMovies.ts'
import { MovieForm } from './components/MovieForm.tsx'
import { MovieList } from './components/MovieList.tsx'
import type { Movie } from './types/movie.ts'
import classes from './App.module.scss'

type View = 'home' | 'add' | 'all'

function App() {
  const [moviePromise, setMoviePromise] = useState(() => fetchMovies())
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [currentView, setCurrentView] = useState<View>('home')

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
    setCurrentView('all')
  }

  const handleBackHome = () => {
    setCurrentView('home')
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
        <Suspense fallback={<p className={classes.loading}>Завантаження...</p>}>
          <MovieList moviePromise={moviePromise} onMovieClick={handleMovieClick} />
        </Suspense>
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
            limit={4}
          />
        </Suspense>
      </section>
    </div>
  )
}

export default App
