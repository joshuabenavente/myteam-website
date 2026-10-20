import { describe, expect, it } from 'vitest'
import { change, COLUMNS, pastScores, scoring, seasonScores } from './stats'
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

describe('scoring', () => {
  it('averages points scored and allowed, and the margin', () => {
    expect(scoring([{ team: 110, opponent: 100 }, { team: 99, opponent: 104 }, undefined])).toEqual({
      games: 2,
      pointsFor: 104.5,
      pointsAgainst: 102,
      margin: 2.5,
    })
    expect(scoring([])).toBeUndefined()
  })

  it('takes this season from finished regular season games only', () => {
    const g = (type: 'regular' | 'playoffs', status: 'final' | 'scheduled', score?: { team: number; opponent: number }) =>
      ({ id: '', type, startUtc: '', home: true, opponent: 'OKC', status, broadcasts: [], score })
    expect(seasonScores([g('regular', 'final', { team: 1, opponent: 2 }), g('playoffs', 'final', { team: 3, opponent: 4 }), g('regular', 'scheduled')])).toEqual([
      { team: 1, opponent: 2 },
    ])
  })

  it('reads last season from the team\'s side, home or away', () => {
    const games = [
      { type: 'regular' as const, startUtc: '', home: 'DEN', away: 'OKC', homeScore: 120, awayScore: 110 },
      { type: 'regular' as const, startUtc: '', home: 'LAL', away: 'DEN', homeScore: 100, awayScore: 104 },
      { type: 'playoffs' as const, startUtc: '', home: 'DEN', away: 'GSW', homeScore: 90, awayScore: 99 },
      { type: 'regular' as const, startUtc: '', home: 'BOS', away: 'NYK', homeScore: 1, awayScore: 2 },
    ]
    expect(pastScores(games, 'DEN')).toEqual([
      { team: 120, opponent: 110 },
      { team: 104, opponent: 100 },
    ])
  })
})
