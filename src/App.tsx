import { Suspense, useState } from 'react'
import { fetchMovies } from './utils/getMovies.ts'
import { MovieForm } from './components/MovieForm.tsx'
import { MovieList } from './components/MovieList.tsx'
import type { Movie } from './types/movie.ts'
import classes from './App.module.scss'

function App() {
  const [moviePromise, setMoviePromise] = useState(() => fetchMovies())
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)

  const refreshMovies = () => {
    setMoviePromise(fetchMovies())
  }

  const handleMovieClick = (movie: Movie) => {
    setEditingMovie(movie)
  }

  const handleFormSuccess = () => {
    setEditingMovie(null)
    refreshMovies()
  }

  const handleCancel = () => {
    setEditingMovie(null)
  }

  return (
    <div className={classes.app}>
      <h1 className={classes.title}>Watchlist</h1>

      <MovieForm
        movie={editingMovie}
        onSuccess={handleFormSuccess}
        onCancel={editingMovie ? handleCancel : undefined}
      />

      <Suspense fallback={<p className={classes.loading}>Завантаження списку...</p>}>
        <MovieList moviePromise={moviePromise} onMovieClick={handleMovieClick} />
      </Suspense>
    </div>
  )
}

export default App
