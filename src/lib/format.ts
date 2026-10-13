// Display helpers shared by the views.

import type { Game, HeadToHead, TeamInfo, WinLoss } from './types.ts'

export function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`
}

export const formatRecord = (r: WinLoss | Pick<TeamInfo, 'wins' | 'losses'>) => `${r.wins}-${r.losses}`

/** "Leads 2-1", "Trails 0-1", "Tied 1-1" or "No games yet", from the team's perspective. */
export function seriesSummary(r: WinLoss): string {
  if (r.wins + r.losses === 0) return 'No games yet'
  if (r.wins === r.losses) return `Tied ${formatRecord(r)}`
  return `${r.wins > r.losses ? 'Leads' : 'Trails'} ${formatRecord(r)}`
}

/** Last season's series as a finished result: "Won 3-1", "Lost 1-2", "Split 2-2". */
export function finishedSeriesSummary(r: WinLoss): string {
  if (r.wins + r.losses === 0) return 'Did not play'
  if (r.wins === r.losses) return `Split ${formatRecord(r)}`
  return `${r.wins > r.losses ? 'Won' : 'Lost'} ${formatRecord(r)}`
}

export const hasGames = (h: HeadToHead | undefined, type: keyof HeadToHead) =>
  !!h && h[type].wins + h[type].losses > 0

export function formatGameDate(startUtc: string, timeZone: string) {
  const d = new Date(startUtc)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone }),
    monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone }),
  }
}

export function formatGameTime(game: Pick<Game, 'startUtc' | 'timeTbd'>, timeZone: string): string {
  if (game.timeTbd) return 'TBD'
  return new Date(game.startUtc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
}

/** Abbreviated time zone name for the viewer, e.g. "MDT". */
export function timeZoneAbbr(timeZone: string, at = new Date()): string {
  return (
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value ?? timeZone
  )
}

/** Group games under "October 2026"-style headings in the viewer's time zone, keeping order. */
export function groupByMonth<T extends Pick<Game, 'startUtc'>>(games: T[], timeZone: string): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const g of games) {
    const key = new Date(g.startUtc).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone })
    groups.set(key, [...(groups.get(key) ?? []), g])
  }
  return [...groups]
}
