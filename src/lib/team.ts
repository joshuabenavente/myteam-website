// The team whose site you're on, from the address (/denver-nuggets/...). Components read it with
// useTeam(); its colors are applied as CSS variables.

import { createContext, useContext } from 'react'
import { NEUTRAL_THEME, teamTheme, type TeamTheme } from './teamColors.ts'
import { TEAMS_BY_ABBR, TEAMS_BY_SLUG, teamSlug, type Team } from './teams.ts'

export interface CurrentTeam extends Team {
  slug: string
  /** "Denver Nuggets" */
  fullName: string
  theme: TeamTheme
}

export function currentTeam(abbr: string): CurrentTeam {
  const t = TEAMS_BY_ABBR[abbr]
  return { ...t, slug: teamSlug(t), fullName: `${t.city} ${t.name}`, theme: teamTheme(abbr) }
}

export const teamFromSlug = (slug: string): CurrentTeam | undefined =>
  TEAMS_BY_SLUG[slug] ? currentTeam(TEAMS_BY_SLUG[slug].abbr) : undefined

export const TeamContext = createContext<CurrentTeam>(currentTeam('DEN'))
export const useTeam = () => useContext(TeamContext)

/** "Nuggets'", "Jazz's", "Magic's": for "the Nuggets' first 5 games". */
export const possessive = (name: string) => (name.endsWith('s') ? `${name}'` : `${name}'s`)

/** Put a team's colors (or the neutral ones) into the page's CSS variables. */
export function applyTheme(theme: TeamTheme = NEUTRAL_THEME) {
  const root = document.documentElement.style
  root.setProperty('--midnight', theme.dark)
  root.setProperty('--skyline', theme.mid)
  root.setProperty('--sunshine', theme.accent)
  root.setProperty('--accent-text', theme.accentText)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.dark)
}

const SAVED = 'myteam:team'

/** The team last visited on this device, as its address slug. */
export function savedTeam(): string | undefined {
  try {
    const slug = window.localStorage.getItem(SAVED) ?? undefined
    return slug && TEAMS_BY_SLUG[slug] ? slug : undefined
  } catch {
    return undefined
  }
}

export function saveTeam(slug: string) {
  try {
    window.localStorage.setItem(SAVED, slug)
  } catch {
    // Private browsing or blocked storage: the picker just shows again next time.
  }
}
