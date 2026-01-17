import type {Tables} from "./database.ts";

export type MovieType = 'movie' | 'series' | 'anime';
export type MovieStatus = 'planned' | 'watching' | 'finished' | 'dropped';

export type Movie = Omit<Tables<'movies'>, 'type' | 'status' | 'created_at'> & {
  type: MovieType;
  status: MovieStatus;
  created_at: string;
  total_episodes: number | null;
  watched_episodes: number | null;
  poster_url: string | null;
  review: string | null;
};