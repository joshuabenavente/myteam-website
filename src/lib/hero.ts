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

/** Whole calendar days from `now` to the game, in the viewer's time zone (0 = today). */
export const daysUntil = (game: Pick<Game, 'startUtc'>, now: Date, timeZone: string) =>
  Math.round((Date.parse(dayKey(game.startUtc, timeZone)) - Date.parse(dayKey(now, timeZone))) / DAY_MS)

/** "Tonight", "Today", "Tomorrow" or "In 9 days", by calendar days in the viewer's time zone. */
export function countdownLabel(game: Pick<Game, 'startUtc' | 'timeTbd'>, now: Date, timeZone: string): string {
  const days = daysUntil(game, now, timeZone)
  if (days <= 0) {
    const hour = Number(new Date(game.startUtc).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone }))
    return !game.timeTbd && hour >= 17 ? 'Tonight' : 'Today'
  }
  return days === 1 ? 'Tomorrow' : `In ${days} days`
}

/**
 * The small heading above the countdown. "In" only fits a number of days: "tips off in 3 days",
 * but "tips off Tonight" and "Next game Tonight".
 */
export function countdownEyebrow({ season, opener, days }: { season: string; opener: boolean; days: number }): string {
  const lead = opener ? `${season} season tips off` : 'Next game'
  return days > 0 ? `${lead} in` : lead
}

/** The team's most recent finished game, for "Last game: W 114–108 vs PHX". */
export function lastResult<T extends Pick<Game, 'status' | 'score' | 'startUtc'>>(games: T[]): (T & { score: NonNullable<Game['score']> }) | undefined {
  const done = games.filter((g): g is T & { score: NonNullable<Game['score']> } => g.status === 'final' && !!g.score)
  return done.sort((a, b) => a.startUtc.localeCompare(b.startUtc)).at(-1)
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
