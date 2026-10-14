import { expect, it } from 'vitest'
import { bbrefAbbr, espnSlug, TEAMS, TEAMS_BY_ABBR, TEAMS_BY_SLUG, teamSlug } from './teams'

it('gives every team a unique address', () => {
  expect(teamSlug(TEAMS_BY_ABBR.DEN)).toBe('denver-nuggets')
  expect(teamSlug(TEAMS_BY_ABBR.LAC)).toBe('la-clippers')
  expect(teamSlug(TEAMS_BY_ABBR.LAL)).toBe('los-angeles-lakers')
  expect(teamSlug(TEAMS_BY_ABBR.PHI)).toBe('philadelphia-76ers')
  expect(teamSlug(TEAMS_BY_ABBR.POR)).toBe('portland-trail-blazers')
  expect(Object.keys(TEAMS_BY_SLUG)).toHaveLength(TEAMS.length)
})

it('maps to ESPN and basketball-reference codes', () => {
  expect(espnSlug(TEAMS_BY_ABBR.GSW)).toBe('gs')
  expect(espnSlug(TEAMS_BY_ABBR.DEN)).toBe('den')
  expect(bbrefAbbr('BKN')).toBe('BRK')
  expect(bbrefAbbr('DEN')).toBe('DEN')
})
