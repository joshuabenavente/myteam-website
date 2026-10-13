// Stat columns for the player tracker, computed from counting totals.

import type { StatTotals } from './types.ts'

export type StatMode = 'perGame' | 'totals'

export interface StatColumn {
  key: string
  label: string
  title: string
  value: (t: StatTotals, mode: StatMode) => number | undefined
  format: (v: number, mode: StatMode) => string
  /** For coloring changes: turnovers going up is bad. */
  higherIsBetter: boolean
  /** Percentages compare in percentage points. */
  isPercent?: boolean
  /** Games played/started differ by how far into the season it is, so a change means nothing. */
  noChange?: boolean
}

const oneDecimal = (v: number) => v.toFixed(1)
const counting = (v: number, mode: StatMode) => (mode === 'perGame' ? oneDecimal(v) : String(Math.round(v)))
const ratio = (made: number, attempted: number) => (attempted > 0 ? made / attempted : undefined)

const stat = (key: keyof StatTotals, label: string, title: string, higherIsBetter = true): StatColumn => ({
  key,
  label,
  title,
  value: (t, mode) => (mode === 'perGame' ? t[key] / t.games : t[key]),
  format: counting,
  higherIsBetter,
})

const pct = (key: string, label: string, title: string, made: keyof StatTotals, attempted: keyof StatTotals): StatColumn => ({
  key,
  label,
  title,
  value: (t) => ratio(t[made], t[attempted]),
  format: (v) => (v * 100).toFixed(1),
  higherIsBetter: true,
  isPercent: true,
})

export const COLUMNS: StatColumn[] = [
  { key: 'games', label: 'GP', title: 'Games played', value: (t) => t.games, format: String, higherIsBetter: true, noChange: true },
  { key: 'started', label: 'GS', title: 'Games started', value: (t) => t.started, format: String, higherIsBetter: true, noChange: true },
  stat('minutes', 'MIN', 'Minutes'),
  stat('points', 'PTS', 'Points'),
  stat('rebounds', 'REB', 'Rebounds'),
  stat('assists', 'AST', 'Assists'),
  stat('steals', 'STL', 'Steals'),
  stat('blocks', 'BLK', 'Blocks'),
  stat('turnovers', 'TOV', 'Turnovers', false),
  pct('fgPct', 'FG%', 'Field goal percentage', 'fgMade', 'fgAttempted'),
  pct('threePct', '3P%', 'Three-point percentage', 'threeMade', 'threeAttempted'),
  pct('ftPct', 'FT%', 'Free throw percentage', 'ftMade', 'ftAttempted'),
]

export interface Change {
  text: string
  direction: 'up' | 'down' | 'same'
  /** Whether the change is an improvement, taking higherIsBetter into account. */
  good: boolean | undefined
}

/** The change from a previous value to the current one, formatted for display. */
export function change(col: StatColumn, current: number, previous: number, mode: StatMode): Change {
  const diff = col.isPercent ? (current - previous) * 100 : current - previous
  const shown = col.isPercent || mode === 'perGame' ? Math.abs(diff).toFixed(1) : String(Math.round(Math.abs(diff)))
  if (Number(shown) === 0) return { text: '0', direction: 'same', good: undefined }
  const up = diff > 0
  return { text: shown, direction: up ? 'up' : 'down', good: up === col.higherIsBetter }
}
