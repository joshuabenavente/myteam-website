import { describe, expect, it } from 'vitest'
import { lastName, matchupTags } from './tags'
import type { AvailabilityFile, Game, LastSeasonFile, LeagueFile, StandingsFile, TeamInfo } from './types'

const NOW = Date.parse('2026-12-01T12:00:00Z')
const day = (n: number) => new Date(NOW + n * 86_400_000).toISOString()

const game = (over: Partial<Game> = {}): Game => ({ id: 'g', type: 'regular', startUtc: day(2), home: true, opponent: 'OKC', status: 'scheduled', broadcasts: [], ...over })
const info = (over: Partial<TeamInfo> = {}): TeamInfo => ({
  abbr: 'DEN', conference: 'West', division: 'Northwest', wins: 12, losses: 6, divisionRank: 1, conferenceRank: 3, divisionGamesBehind: 0,
  home: { wins: 0, losses: 0 }, road: { wins: 0, losses: 0 }, lastTen: { wins: 6, losses: 4 }, streak: 'W1', ...over,
})
const standings = (us: Partial<TeamInfo> = {}, them: Partial<TeamInfo> = {}): StandingsFile => ({
  season: '2026-27',
  teams: { DEN: info(us), OKC: info({ abbr: 'OKC', wins: 13, losses: 5, divisionRank: 2, conferenceRank: 2, ...them }) },
})
const league: LeagueFile = {
  scoringSeason: '2025-26',
  scorers: [
    { name: 'Luka Dončić', team: 'LAL', ppg: 33.5, games: 70 },
    { name: 'Shai Gilgeous-Alexander', team: 'OKC', ppg: 31.1, games: 75 },
    { name: 'Nikola Jokić', team: 'DEN', ppg: 27.7, games: 65 },
  ],
  lastWins: { DEN: 45, OKC: 64, LAL: 40 },
}
const data = (over: Partial<Parameters<typeof matchupTags>[0]['data']> = {}) => ({
  schedule: { season: '2026-27', games: [game({ id: 'first', startUtc: day(-60), home: false }), game({ id: 'second', startUtc: day(-58) }), game({ id: 'g' }), game({ id: 'last', startUtc: day(120) })] },
  standings: standings(),
  availability: undefined as AvailabilityFile | undefined,
  lastSeason: undefined as LastSeasonFile | undefined,
  league: undefined as LeagueFile | undefined,
  ...over,
})
/** No games played yet, so only the rule under test can fire. */
const quiet = data({ standings: standings({ wins: 0, losses: 0 }, { wins: 0, losses: 0 }) })
const texts = (g: Game, d = data(), team = 'DEN') => matchupTags({ game: g, team, data: d, now: NOW }).map((t) => t.text)

describe('lastName', () => {
  it('drops suffixes and keeps hyphens', () => {
    expect(lastName('Shai Gilgeous-Alexander')).toBe('Gilgeous-Alexander')
    expect(lastName('Jaren Jackson Jr.')).toBe('Jackson')
    expect(lastName('Nikola Jokić')).toBe('Jokić')
  })
})

describe('matchupTags', () => {
  it('gives no tags once a game has started', () => {
    expect(texts(game({ status: 'live', label: 'Emirates NBA Cup · West Group A' }))).toEqual([])
  })

  it('tags playoff stakes and the play-in', () => {
    expect(texts(game({ type: 'playin' }), quiet)).toEqual(['Play-in game'])
    expect(texts(game({ type: 'playoffs', label: 'West First Round · Game 7 · Series tied 3-3' }), quiet)).toEqual(['Game 7'])
    expect(texts(game({ type: 'playoffs', label: 'West First Round · Game 5 · DEN leads 3-1' }), quiet)).toEqual(['Elimination game'])
    expect(texts(game({ type: 'playoffs', label: 'West First Round · Game 3 · DEN leads 2-0' }), quiet)).toEqual([])
  })

  it('tags standings stakes only for games this week, once teams have played 15', () => {
    expect(texts(game())).toEqual(['Both top-4 seeds', 'Division lead on the line'])
    expect(texts(game({ startUtc: day(20) }))).toEqual([])
    expect(texts(game(), data({ standings: standings({ wins: 8, losses: 6 }) }))).toEqual([])
  })

  it('finds the play-in race late in the season', () => {
    const d = data({ standings: standings({ wins: 30, losses: 28, conferenceRank: 8, divisionRank: 3 }, { wins: 29, losses: 29, conferenceRank: 9, divisionRank: 4 }) })
    expect(texts(game(), d)).toEqual(['Play-in race'])
  })

  it("names last season's playoff series and who won it", () => {
    const g = (home: string, away: string, hs: number, as: number) => ({ type: 'playoffs' as const, startUtc: '', home, away, homeScore: hs, awayScore: as })
    const lastSeason: LastSeasonFile = { season: '2025-26', games: [g('DEN', 'OKC', 100, 90), g('OKC', 'DEN', 90, 100), g('DEN', 'OKC', 80, 99), g('OKC', 'DEN', 100, 90), g('DEN', 'OKC', 90, 100), g('OKC', 'DEN', 100, 90), g('DEN', 'OKC', 99, 100)] }
    expect(texts(game({ startUtc: day(40) }), data({ lastSeason }))).toEqual(["Last season's playoff rematch · OKC won 5-2"])
    expect(matchupTags({ game: game({ startUtc: day(40) }), team: 'DEN', data: data({ lastSeason }), now: NOW })[0].short).toBe('Playoff rematch')
  })

  it('tags a top scorer who is out or day-to-day, either side, only for games this week', () => {
    const availability: AvailabilityFile = { updatedAt: '', teams: { OKC: [{ name: 'Shai Gilgeous-Alexander', status: 'Day-To-Day', gameTimeDecision: true, reason: 'Hamstring' }], DEN: [{ name: 'Role Player', status: 'Out' }] } }
    const t = matchupTags({ game: game(), team: 'DEN', data: data({ availability, league, standings: standings({ wins: 1, losses: 1 }) }), now: NOW })
    expect(t.map((x) => x.text)).toEqual(['Gilgeous-Alexander (OKC) is day-to-day', 'Top-10 scorers: Jokić, Gilgeous-Alexander'])
    expect(t[0].title).toContain('#2 in the league at 31.1 points per game in 2025-26')
    expect(texts(game({ startUtc: day(30) }), data({ availability, league, standings: standings({ wins: 1, losses: 1 }) }))).not.toContain('Gilgeous-Alexander (OKC) is day-to-day')
  })

  it("ignores an injury that ends before the game", () => {
    const availability: AvailabilityFile = { updatedAt: '', teams: { OKC: [{ name: 'Shai Gilgeous-Alexander', status: 'Out', returnDate: '2026-12-02' }] } }
    expect(texts(game(), data({ availability, league, standings: standings({ wins: 1, losses: 1 }) }))).not.toContain('Gilgeous-Alexander (OKC) is out')
  })

  it('marks openers, the finale and the schedule\'s own events', () => {
    const d = data({ standings: standings({ wins: 0, losses: 0 }) })
    expect(texts(game({ id: 'first', home: false }), d)).toEqual(['Season opener'])
    expect(texts(game({ id: 'second' }), d)).toEqual(['Home opener'])
    expect(texts(game({ id: 'last', startUtc: day(120) }), d)).toEqual(['Regular-season finale'])
    expect(texts(game({ label: 'Emirates NBA Cup · West Group A' }), d)).toEqual(['NBA Cup · West Group A'])
    expect(texts(game({ label: 'AWS NBA Rivals Week' }), d)).toEqual(['Rivals Week'])
    expect(texts(game({ neutralSite: 'Mexico City' }), d)).toEqual(['Neutral site · Mexico City'])
    expect(texts(game({ startUtc: '2026-12-25T22:00:00Z' }), d)).toEqual(['Christmas Day'])
  })

  it('needs a top-10 scorer on each side', () => {
    const d = data({ league, standings: standings({ wins: 1, losses: 1 }) })
    expect(texts(game(), d)).toEqual(['Top-10 scorers: Jokić, Gilgeous-Alexander'])
    expect(texts(game({ opponent: 'LAL' }), { ...d, standings: { season: '', teams: { ...d.standings.teams, LAL: info({ abbr: 'LAL' }) } } })).toContain('Top-10 scorers: Jokić, Dončić')
    expect(texts(game(), data({ league: { ...league, scorers: league.scorers.slice(0, 2) }, standings: standings({ wins: 1, losses: 1 }) }))).toEqual([])
  })

  it('tags hot and long streaks', () => {
    const hot = data({ standings: standings({ streak: 'W6', conferenceRank: 7, divisionRank: 3 }, { streak: 'W5', conferenceRank: 8, divisionRank: 4 }) })
    expect(texts(game(), hot)).toEqual(['Hot streaks: Nuggets W6, Thunder W5'])
    const long = data({ standings: standings({ streak: 'L2', conferenceRank: 7, divisionRank: 3 }, { streak: 'W9', conferenceRank: 8, divisionRank: 4 }) })
    expect(texts(game(), long)).toEqual(['Thunder have won 9 straight'])
  })

  it('names 50-win teams only early in the season', () => {
    const fifty = { ...league, scorers: [], lastWins: { DEN: 50, OKC: 64 } }
    const early = data({ league: fifty, standings: standings({ wins: 0, losses: 0 }, { wins: 0, losses: 0 }) })
    expect(texts(game(), early)).toEqual(['Both won 50+ games last season'])
    const thirtyGames = Array.from({ length: 30 }, (_, i) => game({ id: i === 24 ? 'g' : `x${i}`, startUtc: day(i - 28) }))
    expect(texts(game(), { ...early, schedule: { season: '', games: thirtyGames } })).toEqual([])
  })

  it('shows at most two, most important first', () => {
    const availability: AvailabilityFile = { updatedAt: '', teams: { OKC: [{ name: 'Shai Gilgeous-Alexander', status: 'Out' }] } }
    const t = texts(game({ label: 'Emirates NBA Cup · West Group A' }), data({ availability, league }))
    expect(t).toHaveLength(2)
    expect(t).toEqual(['Both top-4 seeds', 'Division lead on the line'])
  })
})
