import type {MovieType} from "../types/movie.ts";

export const TYPE_LABELS: Record<MovieType, string> = {
  movie: 'Фільм',
  series: 'Серіал',
  cartoon: 'Мультфільм'
}

export const STATUS_LABELS: Record<string, string> = {
  planned: 'Планую',
  watching: 'Дивлюсь',
  finished: 'Завершено',
  dropped: 'Кинув'
}