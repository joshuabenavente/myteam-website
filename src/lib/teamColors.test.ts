import { expect, it } from 'vitest'
import { badgeColors, contrast, HEADER_BG, TEAM_COLORS } from './teamColors'
import { TEAMS } from './teams'

it('has colors for every team', () => {
  for (const t of TEAMS) expect(TEAM_COLORS[t.abbr], t.abbr).toBeDefined()
})

it('keeps every team badge readable on the header', () => {
  for (const t of TEAMS) {
    const c = badgeColors(t.abbr)
    expect(contrast(c.text, c.fill), `${t.abbr} text`).toBeGreaterThanOrEqual(4.5)
    // Something about the badge has to stand out from the navy: the fill, the ring, or the outline.
    expect(contrast(c.fill, HEADER_BG) >= 1.5 || contrast(c.ring, HEADER_BG) >= 3 || c.outline, t.abbr).toBe(true)
  }
})

it('gives Denver gold and keeps other teams from looking like it', () => {
  expect(badgeColors('DEN')).toMatchObject({ fill: '#fec524', ring: '#8b2131' })
  // Golden State's primary is gold, so it uses its blue instead.
  expect(badgeColors('GSW')).toMatchObject({ fill: '#1d428a', ring: '#fdb927' })
  for (const t of TEAMS.filter((x) => x.abbr !== 'DEN')) {
    expect(contrast(badgeColors(t.abbr).fill, '#fec524'), t.abbr).toBeGreaterThanOrEqual(1.5)
  }
})
