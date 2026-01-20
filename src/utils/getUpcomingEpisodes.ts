import { tmdbAPIKey } from '../environment'
import type { Movie } from '../types/movie'

export interface UpcomingEpisode {
  movie: Movie
  nextEpisode: {
    name: string
    episodeNumber: number
    seasonNumber: number
    airDate: string
    overview?: string
  }
  daysUntil: number
}

interface TMDBTVDetails {
  next_episode_to_air?: {
    name: string
    episode_number: number
    season_number: number
    air_date: string
    overview?: string
  }
}

async function getTVDetails(tmdbId: number): Promise<TMDBTVDetails | null> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${tmdbAPIKey}&language=uk-UA`
    )
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(dateStr)
  targetDate.setHours(0, 0, 0, 0)
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export async function getUpcomingEpisodes(movies: Movie[]): Promise<UpcomingEpisode[]> {
  // Фільтруємо тільки серіали зі статусом "watching" та з tmdb_id
  const watchingSeries = movies.filter(
    m => (m.type === 'series' || m.type === 'cartoon') &&
         m.status === 'watching' &&
         m.tmdb_id
  )

  const results: UpcomingEpisode[] = []

  // Робимо паралельні запити до TMDB
  const detailsPromises = watchingSeries.map(async (movie) => {
    const details = await getTVDetails(movie.tmdb_id!)
    if (details?.next_episode_to_air) {
      const daysUntil = getDaysUntil(details.next_episode_to_air.air_date)
      // Показуємо епізоди які виходять протягом наступних 30 днів або вийшли нещодавно (до 7 днів тому)
      if (daysUntil >= -7 && daysUntil <= 30) {
        return {
          movie,
          nextEpisode: {
            name: details.next_episode_to_air.name,
            episodeNumber: details.next_episode_to_air.episode_number,
            seasonNumber: details.next_episode_to_air.season_number,
            airDate: details.next_episode_to_air.air_date,
            overview: details.next_episode_to_air.overview,
          },
          daysUntil,
        }
      }
    }
    return null
  })

  const resolved = await Promise.all(detailsPromises)

  for (const item of resolved) {
    if (item) results.push(item)
  }

  // Сортуємо по даті виходу (спочатку найближчі)
  results.sort((a, b) => a.daysUntil - b.daysUntil)

  return results
}
