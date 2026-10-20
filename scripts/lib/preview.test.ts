import { expect, it } from 'vitest'
import type { Game, TeamInfo } from '../../src/lib/types'
import { buildFacts, hashFacts } from './preview'
import type { FinalGame } from './standings'

const team = (abbr: string, wins: number, losses: number): TeamInfo => ({
  abbr,
  conference: 'West',
  division: 'Northwest',
  wins,
  losses,
  divisionRank: 1,
  conferenceRank: 2,
  divisionGamesBehind: 0,
  home: { wins, losses: 0 },
  road: { wins: 0, losses },
  lastTen: { wins, losses },
  streak: 'W1',
})

const game: Game = {
  id: '1',
  type: 'regular',
  startUtc: '2026-11-03T02:00:00Z',
  home: true,
  opponent: 'OKC',
  status: 'scheduled',
  broadcasts: [],
}

const results: FinalGame[] = [
  { type: 'regular', startUtc: '2026-04-11T01:00:00Z', home: 'DEN', away: 'OKC', homeScore: 127, awayScore: 107 },
  { type: 'regular', startUtc: '2026-10-23T01:30:00Z', home: 'OKC', away: 'DEN', homeScore: 110, awayScore: 101 },
]

const facts = buildFacts({
  team: 'DEN',
  season: '2026-27',
  lastSeason: '2025-26',
  game,
  earlierUnplayed: [{ ...game, id: '0', home: false, opponent: 'UTA' }],
  opponentEarlierUnplayed: ['at San Antonio Spurs'],
  gameNumber: 5,
  standings: { DEN: team('DEN', 3, 1), OKC: team('OKC', 4, 0) },
  h2h: { current: { regular: { wins: 0, losses: 1 }, playoffs: { wins: 0, losses: 0 } }, last: { regular: { wins: 1, losses: 3 }, playoffs: { wins: 0, losses: 0 } } },
  results,
  absences: {
    DEN: [{ name: 'Nikola Jokić', status: 'Out', gameTimeDecision: false, reason: 'Knee' }],
    OKC: [{ name: 'Back Already', status: 'Day-To-Day', gameTimeDecision: true, returnDate: '2026-10-30' }],
  },
  players: [
    {
      id: 'jokicni01', name: 'Nikola Jokić', position: 'C', twoWay: false, current: {}, lastToDate: {},
      lastFull: { regular: { games: 10, started: 10, minutes: 350, points: 277, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0 } },
    },
  ],
})

it('describes the matchup, form and history', () => {
  expect(facts.game).toEqual({
    matchup: 'Denver Nuggets vs Oklahoma City Thunder',
    followedTeam: 'Denver Nuggets',
    followedTeamIs: 'home',
    type: 'regular season',
    followedTeamGameNumber: '5th game of the season for the Nuggets',
    followedTeamGamesStillToPlayBeforeThisOne: 1,
  })
  expect(facts.followedTeam).toMatchObject({ record: '3-1', homeRecord: '3-0', lastTen: '3-1', division: '1st in the Northwest' })
  expect(facts.season).toBe('2026-27')
  expect(facts.seasonSeries).toEqual({ '2026-27 so far': 'Nuggets trail 0-1', '2025-26': 'Nuggets lost 1-3' })
  expect(facts.opponent).toMatchObject({ gamesStillToPlayBeforeThisOne: 1 })
  // 01:30 UTC on Oct 23 is the evening of Oct 22 in Denver.
  expect(facts.lastMeeting).toEqual({ date: '2026-10-22', where: 'in Oklahoma City', type: 'regular season', result: 'Nuggets lost 110-101' })
  // No forecasts: previews use only facts the site shows.
  expect(JSON.stringify(facts)).not.toMatch(/predictor|win ?chance|probability/i)
})

it('lists absences that still apply, with Denver players averages', () => {
  expect(facts.notAvailable).toEqual({
    followedTeam: [{ name: 'Nikola Jokić', status: 'Out', reason: 'Knee', lastSeason: '27.7 pts, 35.0 min per game' }],
    opponent: [],
  })
})

it('hashes facts stably', () => {
  expect(hashFacts(facts)).toBe(hashFacts(JSON.parse(JSON.stringify(facts))))
  expect(hashFacts(facts)).not.toBe(hashFacts({ ...facts, followedTeam: undefined }))
})
