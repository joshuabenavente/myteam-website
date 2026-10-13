import { dayKey } from './format.ts'
import type { Absence, Game } from './types.ts'

/**
 * Absences that still apply on a game's date: players expected back before the game are
 * dropped. Return dates are US calendar dates, so compare against the game's Mountain Time date.
 */
export function absencesForGame(list: Absence[] | undefined, game: Pick<Game, 'startUtc'>): Absence[] {
  const gameDay = dayKey(game.startUtc, 'America/Denver')
  return (list ?? []).filter((a) => !a.returnDate || a.returnDate >= gameDay)
}

/** The next few games that haven't started; these get availability and previews. */
export function nextGames<T extends Pick<Game, 'status' | 'startUtc'>>(games: T[], count = 3): T[] {
  return games.filter((g) => g.status === 'scheduled').slice(0, count)
}
