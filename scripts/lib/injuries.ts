// Parse ESPN's league injuries feed (site.api.espn.com/.../nba/injuries).

import { fromEspnAbbr } from '../../src/lib/teams.ts'
import type { Absence } from '../../src/lib/types.ts'

interface EspnInjury {
  status: string
  athlete: { displayName: string; team?: { abbreviation: string } }
  details?: {
    type?: string
    detail?: string
    side?: string
    returnDate?: string
    fantasyStatus?: { abbreviation?: string }
  }
}

export interface EspnInjuriesJson {
  injuries: { displayName: string; injuries: EspnInjury[] }[]
}

function reason(d: EspnInjury['details']): string | undefined {
  if (!d?.type) return undefined
  const detail =
    d.detail && !['not specified', d.type.toLowerCase()].includes(d.detail.toLowerCase()) ? d.detail.toLowerCase() : undefined
  return detail ? `${d.type} (${detail})` : d.type
}

const STATUS_ORDER = ['Out', 'Doubtful', 'Questionable', 'Day-To-Day', 'Probable']

/** Absences per NBA team abbreviation, most serious first. */
export function parseInjuries(json: EspnInjuriesJson): { [abbr: string]: Absence[] } {
  const out: { [abbr: string]: Absence[] } = {}
  for (const team of json.injuries ?? []) {
    for (const i of team.injuries ?? []) {
      const abbr = i.athlete.team && fromEspnAbbr(i.athlete.team.abbreviation)
      if (!abbr) continue
      const d = i.details
      ;(out[abbr] ??= []).push({
        name: i.athlete.displayName,
        status: i.status,
        gameTimeDecision: d?.fantasyStatus?.abbreviation === 'GTD',
        ...(reason(d) && { reason: reason(d) }),
        ...(d?.returnDate && { returnDate: d.returnDate.slice(0, 10) }),
      })
    }
  }
  const rank = (s: string) => (STATUS_ORDER.indexOf(s) + 1 || STATUS_ORDER.length + 1)
  for (const list of Object.values(out)) {
    list.sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name))
  }
  return out
}
