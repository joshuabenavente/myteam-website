// Parse ESPN team schedules (site.api.espn.com/.../teams/<team>/schedule) into final game results.

import { fromEspnAbbr } from '../../src/lib/teams.ts'
import type { TrackedGameType } from '../../src/lib/types.ts'
import type { FinalGame } from './standings.ts'

interface EspnCompetitor {
  homeAway: 'home' | 'away'
  team: { abbreviation: string }
  score?: { value: number }
}

export interface EspnScheduleJson {
  events: {
    date: string
    competitions: { competitors: EspnCompetitor[]; status: { type: { completed: boolean } } }[]
  }[]
}

/** Completed games from one ESPN team schedule (one season type per request). */
export function parseEspnResults(json: EspnScheduleJson, type: TrackedGameType): FinalGame[] {
  const out: FinalGame[] = []
  for (const e of json.events ?? []) {
    const c = e.competitions[0]
    if (!c?.status.type.completed) continue
    const home = c.competitors.find((x) => x.homeAway === 'home')
    const away = c.competitors.find((x) => x.homeAway === 'away')
    const homeAbbr = home && fromEspnAbbr(home.team.abbreviation)
    const awayAbbr = away && fromEspnAbbr(away.team.abbreviation)
    if (!homeAbbr || !awayAbbr || home.score == null || away.score == null) continue
    out.push({
      type,
      startUtc: new Date(e.date).toISOString(),
      home: homeAbbr,
      away: awayAbbr,
      homeScore: home.score.value,
      awayScore: away.score.value,
    })
  }
  return out
}

export interface EspnTeamScheduleJson {
  events: {
    id: string
    date: string
    competitions: { competitors: EspnCompetitor[] }[]
  }[]
}

/** ESPN's event ID for a game, matched by opponent and start time. */
export function findEspnEventId(json: EspnTeamScheduleJson, opponent: string, startUtc: string): string | undefined {
  const start = Date.parse(startUtc)
  return json.events?.find((e) => {
    const abbrs = e.competitions[0]?.competitors.map((c) => fromEspnAbbr(c.team.abbreviation))
    return abbrs?.includes(opponent) && Math.abs(Date.parse(e.date) - start) < 12 * 3600_000
  })?.id
}
