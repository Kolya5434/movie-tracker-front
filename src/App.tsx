import {Suspense, use, useState} from 'react'
import './App.css'
import type {Movie} from "./types/movie.ts";
import {fetchMovies} from "./utils/getMovies.ts";

interface MovieListProps {
  moviePromise: Promise<Movie[]>
}

function MovieList({ moviePromise }: MovieListProps) {
  const movies = use(moviePromise)
  
  if (!movies || movies.length === 0) {
    return <div style={{textAlign: 'center', marginTop: 20}}>Список порожній 😔</div>
  }
  
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {movies.map((movie) => (
        <li key={movie.id} style={{
          marginBottom: '1rem',
          border: '1px solid #333',
          padding: '15px',
          borderRadius: '8px',
          background: '#1a1a1a',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{movie.title}</h3>
            <span style={{
              background: movie.rating && movie.rating >= 8 ? '#2e7d32' : '#555',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              {movie.rating ? movie.rating : '-'}
            </span>
          </div>
          <div style={{ marginTop: '8px', color: '#aaa', fontSize: '0.9em' }}>
            {(movie.type || 'movie').toUpperCase()} • {movie.status}
          </div>
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [moviePromise] = useState(() => fetchMovies())
  
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Watchlist 🍿</h1>
      <Suspense fallback={<h3>Завантаження...</h3>}>
        <MovieList moviePromise={moviePromise} />
      </Suspense>
    </div>
  )
}

export default App
