// Team colors for the header's matchup circles and injury chips, and the rules that keep
// them readable on the navy header.

import { TEAM } from './config.ts'

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

/** Middle of the header's gradient, which most chips and circles sit on. */
export const HEADER_BG = '#123069'
const NAVY = '#0e2240'
const GOLD = '#fec524'
const FLATIRONS = '#8b2131'

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

export interface BadgeColors {
  fill: string
  ring: string
  text: string
  /** Neither fill nor ring stands out from the header, so add a light outline. */
  outline: boolean
}

/**
 * Colors for a team's circle and chips: the primary color as the fill, the secondary as the
 * ring. Denver uses gold with a Flatirons red ring; a team whose primary is also gold (Golden
 * State) swaps its colors so it can't be mistaken for Denver.
 */
export function badgeColors(abbr: string): BadgeColors {
  let [fill, ring] =
    abbr === TEAM.abbr ? [GOLD, FLATIRONS] : (TEAM_COLORS[abbr] ?? ['#5b6472', '#ffffff'])
  if (abbr !== TEAM.abbr && contrast(fill, GOLD) < 1.5) [fill, ring] = [ring, fill]
  // The most readable of white, navy and black text on the fill.
  const text = readableOn(fill)
  const outline = contrast(fill, HEADER_BG) < 1.5 && contrast(ring, HEADER_BG) < 3
  return { fill, ring, text, outline }
}
