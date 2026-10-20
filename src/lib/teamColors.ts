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
/** For pages without a team (the team picker). */
export const NEUTRAL_THEME = withLinks({ dark: '#0f172a', mid: '#334155', accent: '#facc15', accentText: '#0f172a', dot: '#F04B32' })

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
