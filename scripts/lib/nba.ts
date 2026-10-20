// Parse the NBA CDN league schedule (https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json).

import { gameTypeFromNbaId } from '../../src/lib/season.ts'
import { TEAMS_BY_ABBR } from '../../src/lib/teams.ts'
import type { Broadcast, Game, ScheduleGameType } from '../../src/lib/types.ts'
import type { FinalGame } from './standings.ts'

interface NbaBroadcaster {
  broadcasterDisplay: string
  /** "tv", "ott" (streaming) or "radio". */
  broadcasterMedia: string
  broadcasterTeamId: number
}

interface NbaTeamSide {
  teamId: number
  teamTricode: string
  score: number | null
}

interface NbaGame {
  gameId: string
  gameStatus: number
  gameStatusText: string
  gameDateTimeUTC: string
  gameLabel: string
  gameSubLabel: string
  seriesText: string
  /** Played away from both teams' arenas (e.g. Mexico City, Paris). */
  isNeutral?: boolean
  arenaCity?: string
  homeTeam: NbaTeamSide
  awayTeam: NbaTeamSide
  broadcasters?: { [list: string]: NbaBroadcaster[] }
}

export interface NbaScheduleJson {
  leagueSchedule: { seasonYear: string; gameDates: { games: NbaGame[] }[] }
}

/** A league game between two NBA teams, normalized for standings and head-to-head. */
export interface LeagueGame {
  id: string
  type: ScheduleGameType
  startUtc: string
  home: string
  away: string
  status: Game['status']
  homeScore: number
  awayScore: number
  raw: NbaGame
}

const STATUS: { [code: number]: Game['status'] } = { 1: 'scheduled', 2: 'live', 3: 'final' }

/** All regular season, play-in and playoff games between NBA teams. */
export function parseLeagueSchedule(json: NbaScheduleJson): { season: string; games: LeagueGame[] } {
  const games: LeagueGame[] = []
  for (const date of json.leagueSchedule.gameDates) {
    for (const g of date.games) {
      const type = gameTypeFromNbaId(g.gameId)
      const home = g.homeTeam.teamTricode
      const away = g.awayTeam.teamTricode
      // Skips preseason/All-Star/etc. and playoff slots whose teams aren't decided yet.
      if (type === 'excluded' || !TEAMS_BY_ABBR[home] || !TEAMS_BY_ABBR[away]) continue
      games.push({
        id: g.gameId,
        type,
        startUtc: g.gameDateTimeUTC,
        home,
        away,
        status: STATUS[g.gameStatus] ?? 'scheduled',
        homeScore: g.homeTeam.score ?? 0,
        awayScore: g.awayTeam.score ?? 0,
        raw: g,
      })
    }
  }
  games.sort((a, b) => a.startUtc.localeCompare(b.startUtc))
  return { season: json.leagueSchedule.seasonYear, games }
}

/**
 * National TV/streaming plus the team's own local broadcasts. The opponent's local
 * channels and radio are left out.
 */
export function teamBroadcasts(raw: NbaGame, teamId: number): Broadcast[] {
  const lists = raw.broadcasters ?? {}
  const side = raw.homeTeam.teamId === teamId ? 'home' : 'away'
  const out: Broadcast[] = []
  const add = (key: string, scope: Broadcast['scope']) => {
    for (const b of lists[key] ?? []) {
      if (b.broadcasterMedia === 'radio' || out.some((x) => x.name === b.broadcasterDisplay)) continue
      out.push({ name: b.broadcasterDisplay, scope, kind: b.broadcasterMedia === 'ott' ? 'stream' : 'tv' })
    }
  }
  add('nationalBroadcasters', 'national')
  add('nationalOttBroadcasters', 'national')
  add(`${side}TvBroadcasters`, 'local')
  add(`${side}OttBroadcasters`, 'local')
  return out
}

/** Finished games that count toward records, standings and head-to-head: not play-in. */
export const countedFinals = (games: LeagueGame[]): (LeagueGame & FinalGame)[] =>
  games.filter((g): g is LeagueGame & FinalGame => g.status === 'final' && g.type !== 'playin')

/** The team's games in the app's Game shape. */
export function teamGames(games: LeagueGame[], abbr: string): Game[] {
  const teamId = TEAMS_BY_ABBR[abbr].nbaId
  return games
    .filter((g) => g.home === abbr || g.away === abbr)
    .map((g) => {
      const home = g.home === abbr
      const label =
        // e.g. "West First Round · Game 3 · DEN leads 2-0", or "Emirates NBA Cup · West Group A".
        [g.raw.gameLabel, g.raw.gameSubLabel, g.raw.seriesText].filter(Boolean).join(' · ') ||
        (g.type === 'playin' ? 'Play-In Tournament' : '')
      return {
        id: g.id,
        type: g.type,
        startUtc: g.startUtc,
        home,
        opponent: home ? g.away : g.home,
        status: g.status,
        ...(g.status !== 'scheduled' && {
          score: home
            ? { team: g.homeScore, opponent: g.awayScore }
            : { team: g.awayScore, opponent: g.homeScore },
        }),
        broadcasts: teamBroadcasts(g.raw, teamId),
        ...(label && { label }),
        ...(/tbd/i.test(g.raw.gameStatusText) && { timeTbd: true }),
        ...(g.raw.isNeutral && g.raw.arenaCity && { neutralSite: g.raw.arenaCity }),
      }
    })
}
