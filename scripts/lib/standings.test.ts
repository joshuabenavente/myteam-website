import { describe, expect, it } from 'vitest'
import { computeStandings, headToHead, type FinalGame } from './standings'

let day = 0
const game = (home: string, away: string, homeScore: number, awayScore: number, type: FinalGame['type'] = 'regular'): FinalGame => ({
  type,
  startUtc: new Date(Date.UTC(2026, 9, 20 + day++)).toISOString(),
  home,
  away,
  homeScore,
  awayScore,
})

describe('computeStandings', () => {
  it('counts wins, losses, games behind and streaks from regular season games only', () => {
    const s = computeStandings([
      game('DEN', 'OKC', 110, 100),
      game('DEN', 'UTA', 120, 90),
      game('MIN', 'DEN', 105, 100),
      game('DEN', 'MIN', 99, 101, 'playoffs'),
    ])
    expect(s.DEN).toMatchObject({
      wins: 2,
      losses: 1,
      streak: 'L1',
      divisionRank: 2,
      divisionGamesBehind: 0,
      home: { wins: 2, losses: 0 },
      road: { wins: 0, losses: 1 },
      lastTen: { wins: 2, losses: 1 },
    })
    expect(s.MIN).toMatchObject({ wins: 1, losses: 0, divisionRank: 1, divisionGamesBehind: 0 })
    expect(s.OKC).toMatchObject({ wins: 0, losses: 1, streak: 'L1' })
    expect(s.BOS).toMatchObject({ wins: 0, losses: 0, divisionRank: expect.any(Number) })
    expect(s.BOS.streak).toBeUndefined()
  })

  it('breaks ties on head-to-head', () => {
    const s = computeStandings([game('OKC', 'DEN', 100, 90), game('DEN', 'LAL', 100, 90), game('POR', 'OKC', 100, 90)])
    // DEN and OKC are both 1-1; OKC won the head-to-head.
    expect(s.OKC.divisionRank).toBeLessThan(s.DEN.divisionRank)
  })

  it('ranks conferences 1-15', () => {
    const s = computeStandings([game('DEN', 'LAL', 100, 90)])
    const west = Object.values(s).filter((t) => t.conference === 'West')
    expect(west.map((t) => t.conferenceRank).sort((a, b) => a - b)).toEqual([...Array(15)].map((_, i) => i + 1))
    expect(s.DEN.conferenceRank).toBe(1)
    expect(s.LAL.conferenceRank).toBe(15)
  })
})

describe('headToHead', () => {
  it('splits regular season and playoffs per opponent', () => {
    const h = headToHead(
      [game('DEN', 'MIN', 110, 100), game('MIN', 'DEN', 110, 100), game('DEN', 'MIN', 90, 95, 'playoffs'), game('BOS', 'LAL', 1, 0)],
      'DEN',
    )
    expect(h).toEqual({ MIN: { regular: { wins: 1, losses: 1 }, playoffs: { wins: 0, losses: 1 } } })
  })
})
