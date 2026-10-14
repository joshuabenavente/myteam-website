// Live scores from ESPN's public scoreboard, fetched by the browser during Denver's games. The
// hourly data refresh is far too slow for a score, and ESPN's scoreboard allows cross-site reads
// (the NBA's live feed doesn't).

import { createContext, useContext } from 'react'
import { dayKey } from './format.ts'
import { fromEspnAbbr, TEAMS_BY_ABBR } from './teams.ts'

const SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'

/** Start checking this long before tip-off... */
export const WINDOW_BEFORE_MS = 15 * 60 * 1000
/** ...and give up this long after it, in case the final never shows up. */
export const WINDOW_AFTER_MS = 4.5 * 60 * 60 * 1000
export const POLL_MS = 30 * 1000
/** Older than this, the score is shown as stale. */
export const STALE_MS = 2 * 60 * 1000

export interface LiveScore {
  /** ESPN's event ID, for the game page. */
  eventId?: string
  state: 'pre' | 'in' | 'delayed' | 'postponed' | 'final'
  /** NBA tricodes and scores, away team first. */
  away: { abbr: string; score: number }
  home: { abbr: string; score: number }
  /** "Q3 2:36", "Halftime", "End of Q3", "OT 1:12", "Final/OT"... */
  detail: string
  /** Changes only at the start, each break and the end; used for screen reader announcements. */
  milestone: string
}

/** Minimal shape of the parts of ESPN's scoreboard this reads. */
interface EspnScoreboard {
  events?: {
    id?: string
    competitions?: {
      status?: EspnStatus
      competitors?: { homeAway?: string; score?: string; team?: { abbreviation?: string } }[]
    }[]
  }[]
}

const periodName = (p: number) => (p <= 4 ? `Q${p}` : p === 5 ? 'OT' : `${p - 4}OT`)

export interface EspnStatus {
  displayClock?: string
  period?: number
  type?: { name?: string; state?: string }
}

/** Game state, a short description ("Q3 2:36", "Halftime", "Final/OT") and the milestone. */
export function parseStatus(status: EspnStatus = {}): Pick<LiveScore, 'state' | 'detail' | 'milestone'> {
  const name = status.type?.name ?? ''
  const period = status.period ?? 0
  const p = periodName(period)
  if (name === 'STATUS_POSTPONED' || name === 'STATUS_CANCELED') return { state: 'postponed', detail: 'Postponed', milestone: 'Postponed' }
  if (name === 'STATUS_DELAYED' || name === 'STATUS_RAIN_DELAY') return { state: 'delayed', detail: 'Delayed', milestone: 'Delayed' }
  if (status.type?.state === 'post') {
    const final = period > 4 ? `Final/${p}` : 'Final'
    return { state: 'final', detail: final, milestone: final }
  }
  if (status.type?.state === 'in') {
    if (name === 'STATUS_HALFTIME') return { state: 'in', detail: 'Halftime', milestone: 'Halftime' }
    if (name === 'STATUS_END_PERIOD') return { state: 'in', detail: `End of ${p}`, milestone: `End of ${p}` }
    return { state: 'in', detail: `${p} ${status.displayClock ?? ''}`.trim(), milestone: `${p} under way` }
  }
  return { state: 'pre', detail: 'Starting soon', milestone: 'Starting soon' }
}

/** The game in a scoreboard that the given team (NBA tricode) is playing, if any. */
export function parseScoreboard(json: unknown, team: string): LiveScore | undefined {
  for (const event of (json as EspnScoreboard)?.events ?? []) {
    const comp = event.competitions?.[0]
    const sides = comp?.competitors ?? []
    const abbrs = sides.map((c) => fromEspnAbbr(c.team?.abbreviation ?? ''))
    if (!abbrs.includes(team)) continue
    const side = (where: string) => {
      const c = sides.find((x) => x.homeAway === where)
      return { abbr: fromEspnAbbr(c?.team?.abbreviation ?? '') ?? '?', score: Number(c?.score) || 0 }
    }
    return { ...parseStatus(comp?.status), eventId: event.id, away: side('away'), home: side('home') }
  }
  return undefined
}

/** ESPN's scoreboard days are US Eastern dates, "YYYYMMDD". */
export const espnDate = (startUtc: string) => dayKey(startUtc, 'America/New_York').replaceAll('-', '')

export const scoreboardUrl = (startUtc?: string) => (startUtc ? `${SCOREBOARD}?dates=${espnDate(startUtc)}` : SCOREBOARD)

/** "DEN 84–82 OKC", with `first` (the team being followed) first; away first otherwise. */
export function scoreLine(s: Pick<LiveScore, 'away' | 'home'>, first?: string): string {
  const [a, b] = s.home.abbr === first ? [s.home, s.away] : [s.away, s.home]
  return `${a.abbr} ${a.score}–${b.score} ${b.abbr}`
}

/** "W 112–104" from a team's side, for the final chip. */
export function resultFor(s: LiveScore, team: string): string | undefined {
  const [us, them] = s.home.abbr === team ? [s.home, s.away] : s.away.abbr === team ? [s.away, s.home] : []
  if (!us || !them) return undefined
  return `${us.score > them.score ? 'W' : 'L'} ${us.score}–${them.score}`
}

/** A spoken version of the score: "Indiana Pacers 84, Oklahoma City Thunder 82". */
export function spokenScore(s: Pick<LiveScore, 'away' | 'home'>): string {
  const name = (abbr: string) => (TEAMS_BY_ABBR[abbr] ? `${TEAMS_BY_ABBR[abbr].city} ${TEAMS_BY_ABBR[abbr].name}` : abbr)
  return `${name(s.away.abbr)} ${s.away.score}, ${name(s.home.abbr)} ${s.home.score}`
}

export interface LiveStatus {
  /** The schedule game being watched; undefined in test mode. */
  gameId?: string
  /** The team being watched (Denver, or the ?live= team). */
  team: string
  score?: LiveScore
  /** When the score was last fetched successfully, and last tried (ms). */
  updatedAt?: number
  checkedAt?: number
  /** The last fetch failed. */
  failed: boolean
}

/** Minutes since the last good update, when it's old enough to call stale. */
export function staleMinutes(live: Pick<LiveStatus, 'updatedAt' | 'checkedAt'>): number | undefined {
  if (live.updatedAt === undefined || live.checkedAt === undefined) return undefined
  const age = live.checkedAt - live.updatedAt
  return age > STALE_MS ? Math.round(age / 60_000) : undefined
}

/** What a schedule game should show from the live score, if it's the one being watched. */
export function liveFor(live: LiveStatus | undefined, gameId: string): LiveScore | undefined {
  return live?.gameId === gameId ? live.score : undefined
}

export const LiveContext = createContext<LiveStatus | undefined>(undefined)
export const useLive = () => useContext(LiveContext)
