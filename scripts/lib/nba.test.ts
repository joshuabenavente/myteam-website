import { describe, expect, it } from 'vitest'
import { parseLeagueSchedule, teamGames, type NbaScheduleJson } from './nba'

const b = (name: string, media: string, teamId = -1) => ({ broadcasterDisplay: name, broadcasterMedia: media, broadcasterTeamId: teamId })
const DEN = 1610612743
const OKC = 1610612760

const raw = (gameId: string, home: [string, number], away: [string, number], extra: object = {}) => ({
  gameId,
  gameStatus: 1,
  gameStatusText: '7:00 pm ET',
  gameDateTimeUTC: '2026-10-23T01:30:00Z',
  gameLabel: '',
  gameSubLabel: '',
  seriesText: '',
  homeTeam: { teamId: home[1], teamTricode: home[0], score: 0 },
  awayTeam: { teamId: away[1], teamTricode: away[0], score: 0 },
  broadcasters: {},
  ...extra,
})

const json: NbaScheduleJson = {
  leagueSchedule: {
    seasonYear: '2026-27',
    gameDates: [
      {
        games: [
          raw('0012600001', ['DEN', DEN], ['LON', 50015]),
          raw('0022600007', ['OKC', OKC], ['DEN', DEN], {
            broadcasters: {
              nationalBroadcasters: [b('ESPN', 'tv')],
              nationalRadioBroadcasters: [b('SiriusXM', 'radio')],
              homeTvBroadcasters: [b('FanDuel SN OK', 'tv', OKC)],
              awayTvBroadcasters: [b('ALT/ALT+/KTVD', 'tv', DEN)],
              awayOttBroadcasters: [b('Altitude+', 'ott', DEN)],
              awayRadioBroadcasters: [b('KKSE', 'radio', DEN)],
            },
          }),
          raw('0022600100', ['DEN', DEN], ['OKC', OKC], {
            gameStatus: 3,
            gameDateTimeUTC: '2026-11-01T01:00:00Z',
            gameLabel: 'Emirates NBA Cup',
            gameSubLabel: 'West Group A',
            homeTeam: { teamId: DEN, teamTricode: 'DEN', score: 112 },
            awayTeam: { teamId: OKC, teamTricode: 'OKC', score: 108 },
          }),
          raw('0062600001', ['DEN', DEN], ['NYK', 1610612752]),
        ],
      },
    ],
  },
}

describe('parseLeagueSchedule', () => {
  it('keeps only regular season and playoff games between NBA teams', () => {
    const { season, games } = parseLeagueSchedule(json)
    expect(season).toBe('2026-27')
    expect(games.map((g) => g.id)).toEqual(['0022600007', '0022600100'])
  })
})

describe('teamGames', () => {
  const games = teamGames(parseLeagueSchedule(json).games, 'DEN')

  it('lists national and Denver broadcasts, without radio or the opponent', () => {
    expect(games[0]).toMatchObject({ home: false, opponent: 'OKC', status: 'scheduled' })
    expect(games[0].score).toBeUndefined()
    expect(games[0].broadcasts).toEqual([
      { name: 'ESPN', scope: 'national', kind: 'tv' },
      { name: 'ALT/ALT+/KTVD', scope: 'local', kind: 'tv' },
      { name: 'Altitude+', scope: 'local', kind: 'stream' },
    ])
  })

  it('includes scores from the team perspective and labels', () => {
    expect(games[1]).toMatchObject({
      home: true,
      status: 'final',
      score: { team: 112, opponent: 108 },
      label: 'Emirates NBA Cup - West Group A',
    })
  })
})
