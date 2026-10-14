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

/**
 * One status wording everywhere: "Out", "Day-to-day" (ESPN writes "Day-To-Day"). Whether it's a
 * game-time decision is shown separately, as a note.
 */
export function availabilityLabel(a: Pick<Absence, 'status'>): string {
  return a.status.charAt(0).toUpperCase() + a.status.slice(1).toLowerCase()
}

/** ESPN flags game-time decisions; an Out player isn't one. */
export const isGameTimeDecision = (a: Pick<Absence, 'status' | 'gameTimeDecision'>) =>
  !!a.gameTimeDecision && a.status !== 'Out'

/** The next few games that haven't started; these get availability and previews. */
export function nextGames<T extends Pick<Game, 'status' | 'startUtc'>>(games: T[], count = 3): T[] {
  return games.filter((g) => g.status === 'scheduled').slice(0, count)
}

/** Regular season games not on the schedule yet (the NBA adds 2 after NBA Cup group play). */
export function unscheduledGames(schedule: ScheduleFile): number {
  return Math.max(0, 82 - schedule.games.filter((g) => g.type === 'regular').length)
}
