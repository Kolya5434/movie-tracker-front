import { use } from 'react'
import type { UpcomingEpisode } from '../utils/getUpcomingEpisodes'
import classes from './UpcomingEpisodes.module.scss'

interface UpcomingEpisodesProps {
  episodesPromise: Promise<UpcomingEpisode[]>
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

function getDaysLabel(days: number): string {
  if (days === 0) return 'Сьогодні'
  if (days === 1) return 'Завтра'
  if (days === -1) return 'Вчора'
  if (days < 0) return `${Math.abs(days)} дн. тому`
  if (days <= 7) return `Через ${days} дн.`
  return formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
}

export function UpcomingEpisodes({ episodesPromise }: UpcomingEpisodesProps) {
  const episodes = use(episodesPromise)

  if (episodes.length === 0) {
    return null
  }

  return (
    <div className={classes.container}>
      <h2 className={classes.title}>🔔 Нові епізоди</h2>
      <div className={classes.list}>
        {episodes.map((item) => (
          <div key={`${item.movie.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`} className={classes.item}>
            <div className={classes.badge} data-soon={item.daysUntil <= 1 && item.daysUntil >= 0}>
              {getDaysLabel(item.daysUntil)}
            </div>
            <div className={classes.info}>
              <div className={classes.showName}>{item.movie.title}</div>
              <div className={classes.episodeInfo}>
                S{item.nextEpisode.seasonNumber}E{item.nextEpisode.episodeNumber}
                {item.nextEpisode.name && ` • ${item.nextEpisode.name}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
