import { expect, it } from 'vitest'
import { BRAND_DOT, contrast, dotColor, matchupColors, TEAM_COLORS, teamTheme } from './teamColors'
import { TEAMS } from './teams'

it('has colors for every team', () => {
  for (const t of TEAMS) expect(TEAM_COLORS[t.abbr], t.abbr).toBeDefined()
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

it('keeps the logo dot visible on the header and the app icon tile', () => {
  for (const t of TEAMS) {
    const { dot, dark } = teamTheme(t.abbr)
    expect(contrast(dot, dark), `${t.abbr} dot on header`).toBeGreaterThanOrEqual(3.5)
    expect(contrast(dot, '#101820'), `${t.abbr} dot on icon`).toBeGreaterThanOrEqual(3)
  }
  // Team colors where they show; never white, cream or silver, which would look like the lettering.
  expect(teamTheme('DEN').dot).toBe('#fec524')
  expect(teamTheme('LAL').dot).toBe('#fdb927')
  for (const abbr of ['BKN', 'SAS']) expect(teamTheme(abbr).dot, abbr).toBe(BRAND_DOT)
  for (const t of TEAMS) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(teamTheme(t.abbr).dot.slice(i, i + 2), 16))
    expect(Math.max(r, g, b) - Math.min(r, g, b), `${t.abbr} dot has a hue`).toBeGreaterThanOrEqual(60)
  }
  expect(dotColor('XXX', '#000000')).toBe(BRAND_DOT)
})
