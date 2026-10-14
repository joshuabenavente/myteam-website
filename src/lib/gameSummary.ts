// ESPN's game summary (box score, play-by-play, injuries) for the game page. Like the live
// score, it's fetched by the browser: ESPN allows cross-site reads of it.

import { parseStatus, type EspnStatus, type LiveScore } from './live.ts'
import { dayKey } from './format.ts'
import { fromEspnAbbr } from './teams.ts'

const SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event='
export const summaryUrl = (eventId: string) => SUMMARY + eventId

/** Box score columns, in order, by ESPN's stat names. */
export const BOX_COLUMNS = ['MIN', 'PTS', 'REB', 'AST', 'FG', '3PT', 'FT', 'STL', 'BLK', 'TO', 'PF', '+/-'] as const
export type BoxColumn = (typeof BOX_COLUMNS)[number]

export interface BoxPlayer {
  id: string
  name: string
  shortName: string
  jersey?: string
  position?: string
  starter: boolean
  stats: Partial<Record<BoxColumn, string>>
  ejected?: boolean
  /** For players who didn't play: ESPN's reason, e.g. "COACH'S DECISION". */
  reason?: string
}

export interface InjuryListing {
  name: string
  status: string
  /** "Knee Surgery", "Rest"... */
  detail?: string
}

export interface TeamSide {
  /** NBA tricode. */
  abbr: string
  espnId: string
  name: string
  score: number
  record?: string
  /** Points by period, "25", "34"... */
  periods: string[]
  /** [primary, secondary] from ESPN, "#rrggbb". */
  colors: [string, string]
  players: BoxPlayer[]
  didNotPlay: BoxPlayer[]
  totals: Partial<Record<BoxColumn, string>>
  injuries: InjuryListing[]
}

export interface Play {
  id: string
  period: number
  clock: string
  text: string
  /** NBA tricode of the team the play belongs to, if any. */
  team?: string
  scoring: boolean
  awayScore: number
  homeScore: number
}

export interface GameSummary extends Pick<LiveScore, 'state' | 'detail' | 'milestone'> {
  eventId: string
  startUtc?: string
  home: TeamSide
  away: TeamSide
  /** In game order (oldest first). */
  plays: Play[]
}

// Minimal shape of the parts of ESPN's summary this reads.
interface EspnTeam {
  id?: string
  abbreviation?: string
  displayName?: string
  color?: string
  alternateColor?: string
}
interface EspnSummary {
  header?: {
    id?: string
    competitions?: {
      date?: string
      status?: EspnStatus
      competitors?: {
        homeAway?: string
        score?: string
        record?: { type?: string; summary?: string }[]
        linescores?: { displayValue?: string }[]
        team?: EspnTeam
      }[]
    }[]
  }
  boxscore?: {
    players?: {
      team?: EspnTeam
      statistics?: {
        names?: string[]
        totals?: string[]
        athletes?: {
          athlete?: { id?: string; displayName?: string; shortName?: string; jersey?: string; position?: { abbreviation?: string } }
          starter?: boolean
          didNotPlay?: boolean
          reason?: string
          ejected?: boolean
          stats?: string[]
        }[]
      }[]
    }[]
  }
  injuries?: {
    team?: EspnTeam
    injuries?: { status?: string; athlete?: { displayName?: string }; details?: { type?: string; detail?: string; returnDate?: string } }[]
  }[]
  plays?: {
    id?: string
    text?: string
    awayScore?: number
    homeScore?: number
    period?: { number?: number }
    clock?: { displayValue?: string }
    scoringPlay?: boolean
    team?: { id?: string }
  }[]
}

const hex = (c?: string, fallback = '#5b6472') => (c && /^[0-9a-f]{6}$/i.test(c) ? `#${c.toLowerCase()}` : fallback)

const byName = (names: string[] = [], values: string[] = []) =>
  Object.fromEntries(BOX_COLUMNS.flatMap((col) => (names.includes(col) ? [[col, values[names.indexOf(col)] ?? '']] : [])))

export function parseSummary(json: unknown): GameSummary | undefined {
  const j = json as EspnSummary
  const comp = j?.header?.competitions?.[0]
  const eventId = j?.header?.id
  if (!comp || !eventId) return undefined
  const gameDay = comp.date ? dayKey(comp.date, 'America/Denver') : undefined

  const side = (where: 'home' | 'away'): TeamSide | undefined => {
    const c = comp.competitors?.find((x) => x.homeAway === where)
    const espnId = c?.team?.id
    const abbr = fromEspnAbbr(c?.team?.abbreviation ?? '')
    if (!c || !espnId || !abbr) return undefined
    const box = j.boxscore?.players?.find((p) => p.team?.id === espnId)?.statistics?.[0]
    const athletes = (box?.athletes ?? []).map(
      (a): BoxPlayer & { played: boolean } => ({
        id: a.athlete?.id ?? '',
        name: a.athlete?.displayName ?? '',
        shortName: a.athlete?.shortName ?? a.athlete?.displayName ?? '',
        jersey: a.athlete?.jersey,
        position: a.athlete?.position?.abbreviation,
        starter: !!a.starter,
        stats: byName(box?.names, a.stats),
        ...(a.ejected && { ejected: true }),
        ...(a.reason && { reason: a.reason }),
        played: !a.didNotPlay && (a.stats?.length ?? 0) > 0,
      }),
    )
    const strip = ({ played: _played, ...p }: BoxPlayer & { played: boolean }): BoxPlayer => p
    const injuries = (j.injuries?.find((t) => t.team?.id === espnId)?.injuries ?? [])
      // Drop players expected back before this game, as the schedule's injury report does.
      .filter((i) => !gameDay || !i.details?.returnDate || i.details.returnDate >= gameDay)
      .map((i) => ({
        name: i.athlete?.displayName ?? '',
        status: i.status ?? '',
        ...((i.details?.type || i.details?.detail) && {
          detail: [i.details?.type, i.details?.detail].filter(Boolean).join(' '),
        }),
      }))
    return {
      abbr,
      espnId,
      name: c.team?.displayName ?? abbr,
      score: Number(c.score) || 0,
      record: c.record?.find((r) => r.type === 'total')?.summary,
      periods: (c.linescores ?? []).map((l) => l.displayValue ?? ''),
      colors: [hex(c.team?.color), hex(c.team?.alternateColor, '#ffffff')],
      players: athletes.filter((a) => a.played).map(strip),
      didNotPlay: athletes
        .filter((a) => !a.played)
        .map(strip)
        .map(({ stats: _stats, ...p }) => ({ ...p, stats: {} })),
      totals: byName(box?.names, box?.totals),
      injuries,
    }
  }

  const home = side('home')
  const away = side('away')
  if (!home || !away) return undefined
  const teamById = (id?: string) => (id === home.espnId ? home.abbr : id === away.espnId ? away.abbr : undefined)
  const plays = (j.plays ?? []).map((p) => ({
    id: p.id ?? '',
    period: p.period?.number ?? 0,
    clock: p.clock?.displayValue ?? '',
    text: p.text ?? '',
    team: teamById(p.team?.id),
    scoring: !!p.scoringPlay,
    awayScore: p.awayScore ?? 0,
    homeScore: p.homeScore ?? 0,
  }))
  return { ...parseStatus(comp.status), eventId, startUtc: comp.date, home, away, plays }
}

/** Plays newest first, grouped by period: [[4, [...]], [3, [...]], ...]. */
export function playsByPeriod(plays: Play[]): [number, Play[]][] {
  const groups = new Map<number, Play[]>()
  for (const p of [...plays].reverse()) {
    if (!groups.has(p.period)) groups.set(p.period, [])
    groups.get(p.period)!.push(p)
  }
  return [...groups]
}

export const periodLabel = (p: number) => (p <= 4 ? `${['1st', '2nd', '3rd', '4th'][p - 1]} quarter` : p === 5 ? 'Overtime' : `${p - 4}OT`)
