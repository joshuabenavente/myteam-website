import { expect, it } from 'vitest'
import { badgeColors, contrast, HEADER_BG, matchupColors, TEAM_COLORS, teamTheme } from './teamColors'
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

it('keeps the two halves of the game page apart', () => {
  // Denver navy against OKC blue: both primaries.
  expect(matchupColors('DEN', 'OKC').map((h) => h.fill)).toEqual(['#0e2240', '#007ac1'])
  // Indiana's navy is Denver's navy; Indiana switches to gold.
  expect(matchupColors('DEN', 'IND').map((h) => h.fill)).toEqual(['#0e2240', '#ffd520'])
  expect(matchupColors('DEN', 'IND')[1].text).not.toBe('#ffffff')
  for (const t of TEAMS.filter((x) => x.abbr !== 'DEN')) {
    const [l, r] = matchupColors('DEN', t.abbr)
    expect(contrast(l.text, l.fill)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(r.text, r.fill), t.abbr).toBeGreaterThanOrEqual(4.5)
  }
})

it('swaps only when the colors really look alike', () => {
  const right = (abbr: string) => matchupColors('DEN', abbr)[1].fill
  // Navy and black blend with Denver's navy...
  expect(right('NOP')).toBe('#b4975a')
  expect(right('BKN')).toBe('#ffffff')
  expect(right('SAS')).toBe('#c4ced4')
  // ...purple, wine and royal blue don't.
  expect(right('LAL')).toBe('#552583')
  expect(right('CLE')).toBe('#860038')
  expect(right('NYK')).toBe('#1d428a')
})

it('gives every team readable site colors', () => {
  for (const t of TEAMS) {
    const th = teamTheme(t.abbr)
    expect(contrast('#ffffff', th.mid), `${t.abbr} white on mid`).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#ffffff', th.dark), `${t.abbr} white on dark`).toBeGreaterThanOrEqual(7)
    expect(contrast(th.accent, th.dark), `${t.abbr} accent on dark`).toBeGreaterThanOrEqual(4.5)
    expect(contrast(th.accentText, th.accent), `${t.abbr} text on accent`).toBeGreaterThanOrEqual(4.5)
  }
  // Denver keeps its own navy and gold.
  expect(teamTheme('DEN')).toMatchObject({ dark: '#0e2240', accent: '#fec524' })
})

it('keeps an opponent from looking like the followed team', () => {
  expect(badgeColors('GSW', 'DEN').fill).toBe('#1d428a')
  // Following Golden State, its own badge keeps its gold.
  expect(badgeColors('GSW', 'GSW').fill).toBe('#fdb927')
})
