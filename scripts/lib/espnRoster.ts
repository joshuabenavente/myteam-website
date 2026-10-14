// ESPN team roster (site.api.espn.com/.../teams/<team>/roster): jersey numbers, photos and bio.

import { nameKey } from '../../src/lib/names.ts'
import type { PlayerBio } from '../../src/lib/types.ts'

export { nameKey }

interface EspnAthlete {
  fullName: string
  jersey?: string
  displayHeight?: string
  weight?: number
  dateOfBirth?: string
  headshot?: { href?: string }
  college?: { name?: string }
  experience?: { years?: number }
  birthPlace?: { city?: string; state?: string; country?: string }
}

export interface EspnRosterJson {
  athletes: EspnAthlete[]
}

export interface EspnPlayerInfo {
  number?: string
  headshot?: string
  bio: PlayerBio
}

/** ESPN roster details keyed by nameKey. */
export function parseEspnRoster(json: EspnRosterJson): Map<string, EspnPlayerInfo> {
  const out = new Map<string, EspnPlayerInfo>()
  for (const a of json.athletes ?? []) {
    const place = a.birthPlace && [a.birthPlace.city, a.birthPlace.state ?? a.birthPlace.country].filter(Boolean).join(', ')
    out.set(nameKey(a.fullName), {
      ...(a.jersey && { number: a.jersey }),
      ...(a.headshot?.href && { headshot: a.headshot.href }),
      bio: {
        ...(a.displayHeight && { height: a.displayHeight }),
        ...(a.weight && { weight: Math.round(a.weight) }),
        ...(a.dateOfBirth && { birthDate: a.dateOfBirth.slice(0, 10) }),
        ...(a.experience?.years !== undefined && { experience: a.experience.years }),
        ...(a.college?.name && { college: a.college.name }),
        ...(place && { birthPlace: place }),
      },
    })
  }
  return out
}
