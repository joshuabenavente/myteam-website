// What the header's next-game block shows: which game, how far away, where to watch and who's out.

import { absencesForGame, availabilityLabel, isPastDue } from './availability.ts'
import { channelsFor, type Channel } from './channels.ts'
import { dayKey } from './format.ts'
import type { Absence, Game } from './types.ts'

/** A game in progress, otherwise the next one that hasn't started (skipping any past due). */
export function headlineGame<T extends Pick<Game, 'status' | 'startUtc'>>(games: T[], now = Date.now()): T | undefined {
  return games.find((g) => g.status === 'live') ?? games.find((g) => g.status === 'scheduled' && !isPastDue(g, now))
}

const DAY_MS = 24 * 60 * 60 * 1000

/** "Tonight", "Today", "Tomorrow" or "In 9 days", by calendar days in the viewer's time zone. */
export function countdownLabel(game: Pick<Game, 'startUtc' | 'timeTbd'>, now: Date, timeZone: string): string {
  const days = Math.round((Date.parse(dayKey(game.startUtc, timeZone)) - Date.parse(dayKey(now, timeZone))) / DAY_MS)
  if (days <= 0) {
    const hour = Number(new Date(game.startUtc).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone }))
    return !game.timeTbd && hour >= 17 ? 'Tonight' : 'Today'
  }
  return days === 1 ? 'Tomorrow' : `In ${days} days`
}

/** "S. Jones", "J. Butler III"; initials-style first names stay whole ("CJ McCollum"). */
export function shortName(name: string): string {
  const [first, ...rest] = name.split(' ')
  if (rest.length === 0) return name
  const initials = /^[A-Z]{2,3}$/.test(first.replaceAll('.', ''))
  return `${initials ? first : `${first[0]}.`} ${rest.join(' ')}`
}

/** "out" or "day-to-day" for a chip; the full report in the game details has the rest. */
export const chipStatus = (a: Pick<Absence, 'status'>) => availabilityLabel(a).toLowerCase()

/** Players listed for the game, Out first, keeping the feed's order otherwise. */
export function listedFor(list: Absence[] | undefined, game: Pick<Game, 'startUtc'>): Absence[] {
  const rank = (a: Absence) => (a.status === 'Out' ? 0 : 1)
  return absencesForGame(list, game)
    .map((a, i) => [a, i] as const)
    .sort(([a, i], [b, j]) => rank(a) - rank(b) || i - j)
    .map(([a]) => a)
}

/** The one channel to show: a national broadcast if there is one, otherwise the first local one. */
export function headlineChannel(game: Pick<Game, 'broadcasts'>): Channel | undefined {
  const channels = channelsFor(game.broadcasts)
  return channels.find((c) => c.scope === 'national') ?? channels[0]
}
