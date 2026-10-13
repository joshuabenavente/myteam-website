import { describe, expect, it } from 'vitest'
import { change, COLUMNS } from './stats'
import type { StatTotals } from './types'

const totals: StatTotals = {
  games: 10, started: 8, minutes: 300, points: 255, rebounds: 100, assists: 50, steals: 10, blocks: 5,
  turnovers: 20, fgMade: 100, fgAttempted: 200, threeMade: 30, threeAttempted: 0, ftMade: 25, ftAttempted: 30,
}
const col = (key: string) => COLUMNS.find((c) => c.key === key)!

describe('columns', () => {
  it('computes per-game and total values', () => {
    expect(col('points').value(totals, 'perGame')).toBe(25.5)
    expect(col('points').value(totals, 'totals')).toBe(255)
    expect(col('points').format(25.5, 'perGame')).toBe('25.5')
    expect(col('games').value(totals, 'perGame')).toBe(10)
  })

  it('computes percentages and skips them with no attempts', () => {
    expect(col('fgPct').format(col('fgPct').value(totals, 'perGame')!, 'perGame')).toBe('50.0')
    expect(col('threePct').value(totals, 'perGame')).toBeUndefined()
  })
})

describe('change', () => {
  it('marks improvements, treating more turnovers as worse', () => {
    expect(change(col('points'), 27.7, 25.4, 'perGame')).toEqual({ text: '2.3', direction: 'up', good: true })
    expect(change(col('turnovers'), 3.5, 3.1, 'perGame')).toEqual({ text: '0.4', direction: 'up', good: false })
    expect(change(col('turnovers'), 2, 3, 'perGame')).toMatchObject({ direction: 'down', good: true })
  })

  it('uses percentage points and whole numbers for totals', () => {
    expect(change(col('fgPct'), 0.55, 0.5, 'perGame').text).toBe('5.0')
    expect(change(col('points'), 300, 255, 'totals').text).toBe('45')
  })

  it('reports no change', () => {
    expect(change(col('points'), 25.01, 25.0, 'perGame')).toEqual({ text: '0', direction: 'same', good: undefined })
  })
})
