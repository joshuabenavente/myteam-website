import { describe, expect, it } from 'vitest'
import type { PastGame, Player, PlayersFile } from '../../src/lib/types.ts'
import { buildLeagueFile } from './league.ts'

const stats = (games: number, ppg: number) => ({ games, started: games, minutes: 30 * games, points: ppg * games, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0 })
const player = (name: string, last?: ReturnType<typeof stats>, current?: ReturnType<typeof stats>): Player =>
  ({ id: name, name, position: 'G', twoWay: false, bio: {}, current: { regular: current }, lastFull: { regular: last }, lastToDate: {} }) as Player
const file = (teamGames: number, ...players: Player[]): PlayersFile => ({ season: '2026-27', lastSeason: '2025-26', teamGamesPlayed: { regular: teamGames, playoffs: 0 }, players })
const seasons = { current: '2026-27', last: '2025-26' }

describe('buildLeagueFile', () => {
  it("ranks last season's per-game scoring before this season has 10 games, with a 40-game minimum", () => {
    const f = buildLeagueFile(
      { DEN: file(0, player('A', stats(70, 27.7)), player('Few', stats(20, 40))), OKC: file(0, player('B', stats(75, 31.1))) },
      {},
      seasons,
    )
    expect(f.scoringSeason).toBe('2025-26')
    expect(f.scorers.map((s) => [s.name, s.team, s.ppg])).toEqual([['B', 'OKC', 31.1], ['A', 'DEN', 27.7]])
  })

  it("switches to this season once teams have played 10 games", () => {
    const f = buildLeagueFile(
      { DEN: file(12, player('A', stats(70, 27.7), stats(11, 20)), player('Out', stats(70, 30), stats(2, 40))) },
      {},
      seasons,
    )
    expect(f.scoringSeason).toBe('2026-27')
    expect(f.scorers.map((s) => s.name)).toEqual(['A'])
  })

  it("counts each team's regular-season wins last season, from either side", () => {
    const game = (home: string, away: string, homeScore: number, awayScore: number, type: PastGame['type'] = 'regular'): PastGame => ({ type, startUtc: '', home, away, homeScore, awayScore })
    const f = buildLeagueFile({}, { DEN: [game('DEN', 'LAL', 100, 90), game('LAL', 'DEN', 90, 100), game('DEN', 'LAL', 80, 90), game('DEN', 'LAL', 100, 90, 'playoffs')] }, seasons)
    expect(f.lastWins).toEqual({ DEN: 2 })
  })
})
