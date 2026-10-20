import { dayKey } from './format.ts'
import type { Game, GameLogEntry } from './types.ts'

const DAY_MS = 86_400_000

/**
 * The schedule game a player's game-log row is from, so the row can link to its game page (NBA-09).
 * Only an exact match counts: same opponent and venue, a final within a day of the log's date (the
 * log uses US dates, the schedule UTC) and the same score. Rows from a former team's games, or any
 * row that matches more than one game, get no link.
 */
export function gameForLogEntry(entry: GameLogEntry, games: readonly Game[]): Game | undefined {
  const [, team, opponent] = entry.score.match(/^(\d+)-(\d+)/) ?? []
  if (!team) return undefined
  const logDay = Date.parse(`${entry.date}T00:00:00Z`)
  const matches = games.filter(
    (g) =>
      g.status === 'final' &&
      g.opponent === entry.opponent &&
      g.home === entry.home &&
      g.score?.team === Number(team) &&
      g.score.opponent === Number(opponent) &&
      Math.abs(Date.parse(`${dayKey(g.startUtc, 'America/New_York')}T00:00:00Z`) - logDay) <= DAY_MS,
  )
  return matches.length === 1 ? matches[0] : undefined
}
