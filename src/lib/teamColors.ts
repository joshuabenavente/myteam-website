// Team colors for the header's matchup circles and injury chips, and the rules that keep
// them readable on the navy header.


/** [primary, secondary] from ESPN's team list (`color` and `alternateColor`). */
export const TEAM_COLORS: { [abbr: string]: [string, string] } = {
  ATL: ['#c8102e', '#fdb927'],
  BKN: ['#000000', '#ffffff'],
  BOS: ['#008348', '#ffffff'],
  CHA: ['#008ca8', '#1d1060'],
  CHI: ['#ce1141', '#000000'],
  CLE: ['#860038', '#bc945c'],
  DAL: ['#0064b1', '#bbc4ca'],
  DEN: ['#0e2240', '#fec524'],
  DET: ['#1d428a', '#c8102e'],
  GSW: ['#fdb927', '#1d428a'],
  HOU: ['#ce0e2d', '#000000'],
  IND: ['#0c2340', '#ffd520'],
  LAC: ['#12173f', '#c8102e'],
  LAL: ['#552583', '#fdb927'],
  MEM: ['#5d76a9', '#12173f'],
  MIA: ['#98002e', '#000000'],
  MIL: ['#00471b', '#eee1c6'],
  MIN: ['#266092', '#79bc43'],
  NOP: ['#0a2240', '#b4975a'],
  NYK: ['#1d428a', '#f58426'],
  OKC: ['#007ac1', '#ef3b24'],
  ORL: ['#0150b5', '#9ca0a3'],
  PHI: ['#1d428a', '#e01234'],
  PHX: ['#29127a', '#e56020'],
  POR: ['#e03a3e', '#000000'],
  SAC: ['#5a2d81', '#6a7a82'],
  SAS: ['#000000', '#c4ced4'],
  TOR: ['#d91244', '#000000'],
  UTA: ['#4e008e', '#79a3dc'],
  WAS: ['#e31837', '#002b5c'],
}

const NAVY = '#0e2240'
const GOLD = '#fec524'

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two "#rrggbb" colors. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Straight-line distance between two colors in RGB; under SIMILAR they read as the same color. */
export function distance(a: string, b: string): number {
  const [x, y] = [rgb(a), rgb(b)]
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}
const SIMILAR = 80

const readableOn = (fill: string) =>
  ['#ffffff', NAVY, '#000000'].reduce((best, c) => (contrast(c, fill) > contrast(best, fill) ? c : best))

export interface HalfColors {
  fill: string
  text: string
}

/**
 * Background colors for the game page's two halves, `left` team first. Each team uses its primary
 * color; if the two are too alike (Denver's navy against Indiana's navy or Brooklyn's black), the right-hand team switches
 * to its secondary color, like a road team wearing its alternate jersey.
 */
export function matchupColors(left: string, right: string): [HalfColors, HalfColors] {
  const fallback: [string, string] = ['#5b6472', '#ffffff']
  const [l] = TEAM_COLORS[left] ?? fallback
  const [rPrimary, rSecondary] = TEAM_COLORS[right] ?? fallback
  const r = distance(l, rPrimary) < SIMILAR && distance(l, rSecondary) > distance(l, rPrimary) ? rSecondary : rPrimary
  return [
    { fill: l, text: readableOn(l) },
    { fill: r, text: readableOn(r) },
  ]
}

const mix = (a: string, b: string, t: number) =>
  '#' +
  rgb(a)
    .map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0'))
    .join('')

/** Black or close to it, with no real hue (navy doesn't count). */
const nearBlack = (c: string) => luminance(c) < 0.02 && Math.max(...rgb(c)) - Math.min(...rgb(c)) < 24

/** The site's colors for a followed team: header dark and mid tones, and an accent. */
export interface TeamTheme {
  /** The header's dark end; white text on it. */
  dark: string
  /** The header's lighter end and links on white; white text on it. */
  mid: string
  /** Eyebrows, the next game's time, selected pills; on `dark`. */
  accent: string
  /** Text on an accent fill. */
  accentText: string
  /** The myteam.fans logo's dot, visible on `dark`. */
  dot: string
  /** Links, headings and focus rings on the page itself: light mode, then dark mode. */
  link: string
  linkDark: string
}

/** The page backgrounds links sit on (src/index.css): the darker light one, the lighter dark one. */
const PAGE_LIGHT = '#f5f6f8'
const SURFACE_DARK = '#1c1c1f'

/**
 * Text-safe versions of the team's colors for the page: the header's mid color darkened, and the
 * accent lightened, only as far as 4.5:1 needs.
 */
function withLinks(theme: Omit<TeamTheme, 'link' | 'linkDark'>): TeamTheme {
  let link = theme.mid
  for (let i = 0; contrast(link, PAGE_LIGHT) < 4.5 && i < 20; i++) link = mix(link, '#000000', 0.05)
  let linkDark = theme.accent
  for (let i = 0; contrast(linkDark, SURFACE_DARK) < 4.5 && i < 20; i++) linkDark = mix(linkDark, '#ffffff', 0.05)
  return { ...theme, link, linkDark }
}

const DENVER = withLinks({ dark: NAVY, mid: '#1d428a', accent: GOLD, accentText: NAVY, dot: GOLD })
/**
 * For pages without a team (the team picker): graphite, like the site's dark mode, with the
 * logo dot's red-orange as the accent, so it reads as myteam.fans rather than any one team.
 */
export const NEUTRAL_THEME = withLinks({ dark: '#111214', mid: '#2e2f35', accent: '#F04B32', accentText: '#111214', dot: '#F04B32' })

/**
 * A team's site colors from its two team colors. The header uses the darker one (made dark
 * enough for white text), except that a red-and-black team leads with its red; the other color
 * is the accent, readable on the header's dark end (white when that other color is black).
 */
export function teamTheme(abbr: string): TeamTheme {
  if (abbr === 'DEN') return DENVER
  const colors = TEAM_COLORS[abbr]
  if (!colors) return NEUTRAL_THEME
  // Black or charcoal: very dark and without color (dark navy and purple don't count).
  const [darker, lighter] = luminance(colors[0]) <= luminance(colors[1]) ? colors : [colors[1], colors[0]]
  const [base, other] =
    nearBlack(darker) && contrast('#ffffff', lighter) >= 3 ? [lighter, darker] : [darker, lighter]
  let mid = base
  // Pure black reads as a hole rather than a team color; lift it to a charcoal.
  if (nearBlack(mid)) mid = mix(mid, '#ffffff', 0.18)
  for (let i = 0; contrast('#ffffff', mid) < 4.5 && i < 20; i++) mid = mix(mid, '#000000', 0.1)
  let accent = nearBlack(other) ? '#ffffff' : other
  // Darken the header's dark end a little before resorting to a lighter accent.
  let dark = mix(mid, '#000000', 0.45)
  for (const k of [0.55, 0.65]) {
    if (contrast(accent, dark) >= 4.5) break
    dark = mix(mid, '#000000', k)
  }
  for (let i = 0; contrast(accent, dark) < 4.5 && i < 20; i++) accent = mix(accent, '#ffffff', 0.08)
  return withLinks({ dark, mid, accent, accentText: readableOn(accent), dot: dotColor(abbr, dark) })
}

/** The logo dot's default (the team picker and anywhere without a team), from the brand files. */
export const BRAND_DOT = '#F04B32'

/** The same hue, brighter: each channel scaled up, so a deep red becomes a vivid red rather than pink. */
const brighten = (hex: string, k: number) => {
  const channels = rgb(hex)
  const scale = Math.min(k, 255 / Math.max(...channels))
  // Past full brightness, only white can lighten it further.
  return mix('#' + channels.map((c) => Math.round(c * scale).toString(16).padStart(2, '0')).join(''), '#ffffff', Math.max(0, (k - scale) / 4))
}

/** A real hue, not white, cream, silver or black, so the dot can't pass for the white lettering. */
const chromatic = (hex: string) => Math.max(...rgb(hex)) - Math.min(...rgb(hex)) >= 60

/**
 * The myteam.fans dot for a team on a given background: the team's primary color, or its
 * secondary when that stands out more (Denver's navy on the navy header becomes its gold). A
 * color too dark for the header is brightened (Miami's red on its dark red header, Milwaukee's
 * green). Teams with no color to show (Brooklyn, San Antonio) get the brand's own dot.
 */
export function dotColor(abbr: string, background: string): string {
  // A bit above the 3:1 for graphics: the dot is small and the header lightens away from it.
  const shows = (c: string) => contrast(c, background) >= 3.5
  const colors = abbr === 'DEN' ? ([NAVY, GOLD] as const) : TEAM_COLORS[abbr]
  if (!colors) return BRAND_DOT
  const candidates = colors.filter(chromatic)
  const ready = candidates.find(shows)
  if (ready) return ready
  for (const c of candidates) {
    for (let k = 1.1; k < 4; k += 0.1) {
      const lighter = brighten(c, k)
      if (shows(lighter)) return lighter
    }
  }
  return BRAND_DOT
}

/*
 * The glass app (?glass=1): a team-colored gradient behind the whole page, with frosted cards
 * over it. The numbers below are the ones in App.css (html.glass). The gradient's colors are
 * bounded, and the page's text colors chosen, so text stays readable straight on the gradient,
 * through the glass and on the team panels, at the gradient's brightest (or, in light mode,
 * darkest) spot, without counting on the blur.
 */

/** Dark mode glass: this near-black at GLASS_DARK_ALPHA over the gradient. */
export const GLASS_DARK = '#0c0d12'
export const GLASS_DARK_ALPHA = 0.5
/** Light mode glass: white at GLASS_LIGHT_ALPHA over the gradient. */
export const GLASS_LIGHT_ALPHA = 0.62
/** A wash over the whole gradient: its base in dark mode, white in light mode. */
export const GLASS_VEIL_DARK = 0.4
export const GLASS_VEIL_LIGHT = 0.2
/** Light mode's header, player hero and sticky bar: the team's dark at this strength. */
export const GLASS_PANEL_ALPHA = 0.9
/** The pills in the header: white at this strength over what's behind them. */
export const GLASS_PILL_ALPHA = 0.1
/** The accent glow is drawn at this opacity (.app-cloud-accent), so it may be brighter. */
export const ACCENT_OPACITY = 0.55

/** Text and muted text, as the glass app shows them in each mode. */
export const GLASS_TEXT_DARK = { text: '#ffffff', muted: '#d5d8de' }
export const GLASS_TEXT_LIGHT = { text: '#14181f', muted: '#444b57' }
/** White text on team panels, and the dimmest of it (rgb(244 246 250 / 85%) in the glass app). */
export const PANEL_TEXT = { text: '#ffffff', dim: '#f4f6fa', dimAlpha: 0.85 }
/** The page's win and loss colors (src/index.css), before they're fitted to a team's glass. */
const WIN_LOSS = { dark: ['#4ac26b', '#ff7b8a'], light: ['#1a7f37', '#8b2131'] }

/** The gradient's colors for a team, and the team colors that are readable over it. */
export interface GlassColors {
  base: string
  glow: string
  accent: string
  baseLight: string
  glowLight: string
  accentLight: string
  /** Links and headings: dark mode, then light mode. */
  linkDark: string
  linkLight: string
  /** The accent as text on the dark gradient and dark glass, and on light mode's panels. */
  accentTextDark: string
  accentTextLight: string
  /** Text on an accent fill, for each of those. */
  onAccentDark: string
  onAccentLight: string
  /** Win and loss colors on the cards (a green team's glass can swallow the green). */
  winDark: string
  lossDark: string
  winLight: string
  lossLight: string
}

// The brightest a glow may get in dark mode, and the darkest light mode's washes may get.
const MAX_GLOW = 0.16
const MAX_ACCENT = 0.36
const LIGHT_WASH = 0.5
const MIN_GLOW_LIGHT = 0.45

/** Darken a color, keeping its hue, until its luminance is at most `max`. */
function capLuminance(hex: string, max: number): string {
  let c = hex
  for (let i = 0; luminance(c) > max && i < 40; i++) c = mix(c, '#000000', 0.05)
  return c
}

/** Light mode's wash of a glow: lightened, then further until its luminance is at least MIN_GLOW_LIGHT. */
function wash(hex: string): string {
  let c = mix(hex, '#ffffff', LIGHT_WASH)
  for (let i = 0; luminance(c) < MIN_GLOW_LIGHT && i < 40; i++) c = mix(c, '#ffffff', 0.05)
  return c
}

/** A text color moved toward `toward` until it's 4.5:1 on every one of `backgrounds`. */
function readableOnAll(hex: string, backgrounds: string[], toward: string): string {
  let c = hex
  for (let i = 0; Math.min(...backgrounds.map((b) => contrast(c, b))) < 4.5 && i < 40; i++) c = mix(c, toward, 0.06)
  return c
}

type Gradient = Pick<GlassColors, 'base' | 'glow' | 'accent' | 'baseLight' | 'glowLight' | 'accentLight'>

/**
 * The gradient's extreme spots as drawn: its base, the glows' centers and where they overlap,
 * under the veil. The brightest in dark mode, the darkest in light mode.
 */
export function gradientSpots(g: Gradient, mode: 'dark' | 'light'): string[] {
  const [base, glow, accent] = mode === 'dark' ? [g.base, g.glow, g.accent] : [g.baseLight, g.glowLight, g.accentLight]
  const spots = [base, glow, mix(base, accent, ACCENT_OPACITY), mix(glow, accent, ACCENT_OPACITY)]
  return mode === 'dark'
    ? spots.map((s) => mix(s, g.base, GLASS_VEIL_DARK))
    : spots.map((s) => mix(s, '#ffffff', GLASS_VEIL_LIGHT))
}

/** What each kind of surface looks like over those spots; pills are the header's team and page switchers. */
export function glassBackgrounds(g: Gradient, theme: TeamTheme, mode: 'dark' | 'light') {
  const page = gradientSpots(g, mode)
  if (mode === 'dark') {
    const glass = page.map((s) => mix(s, GLASS_DARK, GLASS_DARK_ALPHA))
    // Dark mode's panels are the glass itself, and its header has none.
    const panel = [...page, ...glass]
    return { page, glass, panel, pill: panel.map((s) => mix(s, '#ffffff', GLASS_PILL_ALPHA)) }
  }
  const glass = page.map((s) => mix(s, '#ffffff', GLASS_LIGHT_ALPHA))
  const panel = page.map((s) => mix(s, theme.dark, GLASS_PANEL_ALPHA))
  return { page, glass, panel, pill: panel.map((s) => mix(s, '#ffffff', GLASS_PILL_ALPHA)) }
}

export function glassColors(theme: TeamTheme): GlassColors {
  const base = mix(theme.dark, '#000000', 0.35)
  // The header's mid color, more vivid: it's a light source here rather than a fill under text.
  const glow = capLuminance(brighten(theme.mid, 1.6), MAX_GLOW)
  // A white or gray accent (Brooklyn, San Antonio) would just look like fog; use the dot's hue.
  const accentSource = chromatic(theme.accent) ? theme.accent : chromatic(theme.dot) ? theme.dot : glow
  const accent = capLuminance(accentSource, MAX_ACCENT)
  const gradient = { base, glow, accent, baseLight: mix(theme.mid, '#ffffff', 0.88), glowLight: wash(glow), accentLight: wash(accent) }
  const dark = glassBackgrounds(gradient, theme, 'dark')
  const light = glassBackgrounds(gradient, theme, 'light')
  const accentTextDark = readableOnAll(theme.accent, [...dark.panel, ...dark.pill], '#ffffff')
  const accentTextLight = readableOnAll(theme.accent, [...light.panel, ...light.pill], '#ffffff')
  return {
    ...gradient,
    linkDark: readableOnAll(theme.linkDark, [...dark.page, ...dark.glass], '#ffffff'),
    linkLight: readableOnAll(theme.link, [...light.page, ...light.glass], '#000000'),
    accentTextDark,
    accentTextLight,
    onAccentDark: readableOn(accentTextDark),
    onAccentLight: readableOn(accentTextLight),
    winDark: readableOnAll(WIN_LOSS.dark[0], dark.glass, '#ffffff'),
    lossDark: readableOnAll(WIN_LOSS.dark[1], dark.glass, '#ffffff'),
    winLight: readableOnAll(WIN_LOSS.light[0], light.glass, '#000000'),
    lossLight: readableOnAll(WIN_LOSS.light[1], light.glass, '#000000'),
  }
}
