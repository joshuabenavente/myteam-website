// Radar overview axes: key per-game stats, each placed within a typical NBA range.

import type { StatTotals } from './types.ts'

export interface Axis {
  key: string
  label: string
  value: (t: StatTotals) => number | undefined
  format: (v: number) => string
  /** Typical NBA range; values are placed linearly within it and clamped. */
  min: number
  max: number
}

const perGame = (k: keyof StatTotals) => (t: StatTotals) => (t.games ? t[k] / t.games : undefined)
const pct = (made: keyof StatTotals, att: keyof StatTotals) => (t: StatTotals) =>
  t[att] > 0 ? t[made] / t[att] : undefined
const one = (v: number) => v.toFixed(1)
const percent = (v: number) => (v * 100).toFixed(1)

export const RADAR_AXES: Axis[] = [
  { key: 'pts', label: 'PTS', value: perGame('points'), format: one, min: 0, max: 35 },
  { key: 'reb', label: 'REB', value: perGame('rebounds'), format: one, min: 0, max: 15 },
  { key: 'ast', label: 'AST', value: perGame('assists'), format: one, min: 0, max: 12 },
  { key: 'fg', label: 'FG%', value: pct('fgMade', 'fgAttempted'), format: percent, min: 0.3, max: 0.7 },
  { key: '3p', label: '3P%', value: pct('threeMade', 'threeAttempted'), format: percent, min: 0.2, max: 0.5 },
  { key: 'ft', label: 'FT%', value: pct('ftMade', 'ftAttempted'), format: percent, min: 0.5, max: 1 },
]

/** 0..1 position of a value along an axis. */
export function scale(axis: Axis, v: number | undefined): number {
  if (v === undefined) return 0
  return Math.min(1, Math.max(0, (v - axis.min) / (axis.max - axis.min)))
}
