// The league-wide day view (/yesterday, /today, /tomorrow): which games fall on a day in the
// viewer's time zone, what each card shows, and their order.

import { isPastDue } from './availability.ts'
import { channelsFor, type Channel } from './channels.ts'
import { dayKey } from './format.ts'
import type { LiveScore } from './scoreboard.ts'
import type { DayGame } from './types.ts'

export const DAYS = ['yesterday', 'today', 'tomorrow'] as const
export type DayName = (typeof DAYS)[number]

const OFFSET: Record<DayName, number> = { yesterday: -1, today: 0, tomorrow: 1 }

/** "YYYY-MM-DD" moved by whole calendar days (no DST surprises: the arithmetic is on dates). */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** The calendar date a day name means for the viewer. */
export const dayKeyFor = (day: DayName, now: Date, timeZone: string) => addDays(dayKey(now, timeZone), OFFSET[day])

export const gamesOn = (games: DayGame[], key: string, timeZone: string) =>
  games.filter((g) => dayKey(g.startUtc, timeZone) === key)

/** The first date after `key` with games, for an empty day ("Next games: Thu, Oct 22"). */
export function nextGameDay(games: DayGame[], key: string, timeZone: string): string | undefined {
  return games.map((g) => dayKey(g.startUtc, timeZone)).find((k) => k > key)
}

/** ESPN's live score for a game, matched by its two teams. */
export const liveFor = (scores: LiveScore[], g: Pick<DayGame, 'home' | 'away'>) =>
  scores.find((s) => s.home.abbr === g.home && s.away.abbr === g.away)

export type CardState =
  | { kind: 'scheduled' }
  | { kind: 'live'; detail: string; away: number; home: number }
  | { kind: 'final'; detail: string; away: number; home: number }
  | { kind: 'pending' }
  | { kind: 'postponed' }

/** What a card shows: the live score once ESPN has one, otherwise the schedule's status. */
export function cardState(g: DayGame, live: LiveScore | undefined, now = Date.now()): CardState {
  if (live && live.state !== 'pre') {
    if (live.state === 'postponed') return { kind: 'postponed' }
    const score = { away: live.away.score, home: live.home.score }
    if (live.state === 'final') return { kind: 'final', detail: live.detail, ...score }
    return { kind: 'live', detail: live.detail, ...score }
  }
  if (g.status === 'final' && g.score) return { kind: 'final', detail: 'Final', away: g.score.away, home: g.score.home }
  if (g.status === 'live') return { kind: 'live', detail: 'Live', away: g.score?.away ?? 0, home: g.score?.home ?? 0 }
  // Started hours ago and still "scheduled": the data hasn't caught up (see isPastDue).
  if (isPastDue(g, now)) return { kind: 'pending' }
  return { kind: 'scheduled' }
}

const RANK: Record<CardState['kind'], number> = { live: 0, scheduled: 1, pending: 2, final: 3, postponed: 4 }

/** Your team's game first, then games on now, then by tip-off; finished games last. */
export function orderForDay<T extends { game: DayGame; state: CardState }>(cards: T[], followed?: string): T[] {
  const mine = (c: T) => (followed && (c.game.home === followed || c.game.away === followed) ? 0 : 1)
  return [...cards].sort(
    (a, b) =>
      mine(a) - mine(b) ||
      RANK[a.state.kind] - RANK[b.state.kind] ||
      a.game.startUtc.localeCompare(b.game.startUtc) ||
      a.game.home.localeCompare(b.game.home),
  )
}

/**
 * One short line of channels: national TV when there is one, otherwise each team's main local
 * channel (the first listed; the rest are often apps and alternates).
 */
export function dayChannels(g: DayGame): Channel[] {
  const national = channelsFor(g.broadcasts.national)
  if (national.length) return national
  const main = (list: DayGame['broadcasts']['home']) => channelsFor(list).find((c) => c.kind === 'tv')
  return [main(g.broadcasts.away), main(g.broadcasts.home)].filter((c): c is Channel => c !== undefined)
}
