import { dayKey } from './format.ts'
import type { Absence, Game, ScheduleFile } from './types.ts'

/**
 * Absences that still apply on a game's date: players expected back before the game are
 * dropped. Return dates are US calendar dates, so compare against the game's Mountain Time date.
 */
export function absencesForGame(list: Absence[] | undefined, game: Pick<Game, 'startUtc'>): Absence[] {
  const gameDay = dayKey(game.startUtc, 'America/Denver')
  return (list ?? []).filter((a) => !a.returnDate || a.returnDate >= gameDay)
}

/** One status for display and previews: "Out", "Day-To-Day", or "Game-time decision". */
export function availabilityLabel(a: Pick<Absence, 'status' | 'gameTimeDecision'>): string {
  return a.gameTimeDecision && a.status !== 'Out' ? 'Game-time decision' : a.status
}

/** The next few games that haven't started; these get availability and previews. */
export function nextGames<T extends Pick<Game, 'status' | 'startUtc'>>(games: T[], count = 3): T[] {
  return games.filter((g) => g.status === 'scheduled').slice(0, count)
}

/** Regular season games not on the schedule yet (the NBA adds 2 after NBA Cup group play). */
export function unscheduledGames(schedule: ScheduleFile): number {
  return Math.max(0, 82 - schedule.games.filter((g) => g.type === 'regular').length)
}
