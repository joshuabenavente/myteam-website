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
