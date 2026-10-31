import { expect, it } from 'vitest'
import { contrast, GLASS_TEXT_DARK, GLASS_TEXT_LIGHT, glassBackgrounds, glassColors, PANEL_TEXT, teamTheme } from './teamColors'
import { TEAMS } from './teams'

const teams = TEAMS.map((t) => {
  const theme = teamTheme(t.abbr)
  const g = glassColors(theme)
  return { abbr: t.abbr, theme, g, dark: glassBackgrounds(g, theme, 'dark'), light: glassBackgrounds(g, theme, 'light') }
})

/** `dim` at `alpha` over `bg`, as the browser draws it. */
const over = (bg: string, dim: string, alpha: number) =>
  '#' + [1, 3, 5].map((i) => {
    const [b, d] = [parseInt(bg.slice(i, i + 2), 16), parseInt(dim.slice(i, i + 2), 16)]
    return Math.round(b + (d - b) * alpha).toString(16).padStart(2, '0')
  }).join('')

function expectReadable(colors: Record<string, string>, backgrounds: string[], label: string) {
  for (const [name, color] of Object.entries(colors))
    for (const bg of backgrounds)
      expect(contrast(color, bg), `${label}: ${name} ${color} on ${bg}`).toBeGreaterThanOrEqual(4.5)
}

it('keeps dark mode text readable on the gradient and through the glass', () => {
  for (const { abbr, g, dark } of teams)
    expectReadable({ ...GLASS_TEXT_DARK, link: g.linkDark, accent: g.accentTextDark }, [...dark.page, ...dark.glass], abbr)
})

it('keeps wins and losses readable on the cards', () => {
  for (const { abbr, g, dark, light } of teams) {
    expectReadable({ win: g.winDark, loss: g.lossDark }, dark.glass, abbr)
    expectReadable({ win: g.winLight, loss: g.lossLight }, light.glass, abbr)
  }
})

it('keeps light mode text readable on the gradient and through the glass', () => {
  for (const { abbr, theme, g, light } of teams)
    expectReadable({ ...GLASS_TEXT_LIGHT, link: g.linkLight, heading: theme.dark }, [...light.page, ...light.glass], abbr)
})

it('keeps text on the team panels readable in both modes', () => {
  for (const { abbr, g, dark, light } of teams) {
    for (const [{ panel: panels, pill }, accent] of [[dark, g.accentTextDark], [light, g.accentTextLight]] as const) {
      expectReadable({ text: PANEL_TEXT.text, accent }, [...panels, ...pill], abbr)
      for (const bg of panels)
        expect(contrast(over(bg, PANEL_TEXT.dim, PANEL_TEXT.dimAlpha), bg), `${abbr} dim on ${bg}`).toBeGreaterThanOrEqual(4.5)
    }
  }
})

it('keeps text on accent fills readable', () => {
  for (const { abbr, g } of teams) {
    expect(contrast(g.onAccentDark, g.accentTextDark), abbr).toBeGreaterThanOrEqual(4.5)
    expect(contrast(g.onAccentLight, g.accentTextLight), abbr).toBeGreaterThanOrEqual(4.5)
  }
})

it('gives every team a glow that stands out from its base', () => {
  for (const { abbr, g } of teams) expect(contrast(g.glow, g.base), abbr).toBeGreaterThan(1.4)
})
