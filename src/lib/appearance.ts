// Font, size and icon settings for the temporary appearance picker. Settings live in this
// browser's localStorage; the picker only appears after visiting the site with ?picker.

import { createContext, useContext } from 'react'

export interface FontOption {
  id: string
  label: string
  family: string
  group: 'Monospace' | 'Easy to read' | 'Sporty' | 'Default'
  /** Weights available on Google Fonts. */
  weights: number[]
  fallback: string
}

const ALL = [200, 300, 400, 500, 600, 700]
const mono = (id: string, label: string, weights = ALL): FontOption => ({
  id,
  label,
  family: label,
  group: 'Monospace',
  weights,
  fallback: 'ui-monospace, monospace',
})
const sans = (id: string, label: string, group: FontOption['group'] = 'Easy to read'): FontOption => ({
  id,
  label,
  family: label,
  group,
  weights: ALL,
  fallback: 'system-ui, sans-serif',
})

export const FONTS: FontOption[] = [
  { id: 'system', label: 'System default', family: '', group: 'Default', weights: ALL, fallback: '' },
  mono('jetbrains', 'JetBrains Mono'),
  mono('atkinson-mono', 'Atkinson Hyperlegible Mono'),
  mono('geist-mono', 'Geist Mono'),
  mono('ibm-plex-mono', 'IBM Plex Mono'),
  mono('martian', 'Martian Mono'),
  mono('azeret', 'Azeret Mono'),
  mono('roboto-mono', 'Roboto Mono'),
  mono('red-hat-mono', 'Red Hat Mono', [300, 400, 500, 600, 700]),
  mono('dm-mono', 'DM Mono', [300, 400, 500]),
  mono('fira-code', 'Fira Code', [300, 400, 500, 600, 700]),
  sans('atkinson-next', 'Atkinson Hyperlegible Next'),
  sans('inter', 'Inter'),
  sans('lexend', 'Lexend'),
  sans('ibm-plex-sans', 'IBM Plex Sans'),
  sans('public-sans', 'Public Sans'),
  sans('barlow-condensed', 'Barlow Condensed', 'Sporty'),
  sans('oswald', 'Oswald', 'Sporty'),
]

export type IconStyle = 'none' | 'lucide' | 'material'

export interface Appearance {
  body: string
  /** A font id, or "same" to use the body font. */
  heading: string
  /** Base text weight; bold text is set relative to it. */
  weight: 300 | 400 | 500
  scale: 0.9 | 1 | 1.1 | 1.2
  icons: IconStyle
}

// The chosen look. Keep in sync with the font <link> in index.html and --font-body in index.css.
export const DEFAULT_APPEARANCE: Appearance = {
  body: 'atkinson-next',
  heading: 'same',
  weight: 400,
  scale: 1,
  icons: 'lucide',
}

const SETTINGS_KEY = 'appearance'
const PICKER_KEY = 'appearance-picker'

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export function loadAppearance(): Appearance {
  try {
    const saved = storage()?.getItem(SETTINGS_KEY)
    return saved ? { ...DEFAULT_APPEARANCE, ...JSON.parse(saved) } : DEFAULT_APPEARANCE
  } catch {
    return DEFAULT_APPEARANCE
  }
}

export function saveAppearance(a: Appearance) {
  try {
    storage()?.setItem(SETTINGS_KEY, JSON.stringify(a))
  } catch {
    // Private browsing or blocked storage: settings just won't persist.
  }
}

/** The picker shows once the site is opened with ?picker, and stays until turned off. */
export function pickerEnabled(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('picker')) storage()?.setItem(PICKER_KEY, '1')
    return storage()?.getItem(PICKER_KEY) === '1'
  } catch {
    return false
  }
}

export function disablePicker() {
  try {
    storage()?.removeItem(PICKER_KEY)
    storage()?.removeItem(SETTINGS_KEY)
  } catch {
    // Nothing to clean up.
  }
}

const fontById = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0]

function loadGoogleFont(font: FontOption) {
  if (!font.family || document.getElementById(`font-${font.id}`)) return
  const link = document.createElement('link')
  link.id = `font-${font.id}`
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.family.replaceAll(' ', '+')}:wght@${font.weights.join(';')}&display=swap`
  document.head.appendChild(link)
}

// Material Symbols is loaded with only the icons the app uses (names must be sorted).
export const MATERIAL_ICONS = [
  'auto_awesome',
  'calendar_month',
  'chevron_left',
  'chevron_right',
  'close',
  'expand_more',
  'flight',
  'groups',
  'home',
  'palette',
  'personal_injury',
  'restart_alt',
  'schedule',
  'smart_display',
  'sports_basketball',
  'tv',
  'view_list',
]

function loadMaterialSymbols() {
  if (document.getElementById('font-material-symbols')) return
  const link = document.createElement('link')
  link.id = 'font-material-symbols'
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${MATERIAL_ICONS.join(',')}&display=block`
  document.head.appendChild(link)
}

const stack = (f: FontOption) =>
  f.family ? `'${f.family}', ${f.fallback}` : `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

/** Apply settings to the page through CSS variables on :root. */
export function applyAppearance(a: Appearance) {
  const body = fontById(a.body)
  const heading = a.heading === 'same' ? body : fontById(a.heading)
  loadGoogleFont(body)
  loadGoogleFont(heading)
  if (a.icons === 'material') loadMaterialSymbols()
  const root = document.documentElement.style
  root.setProperty('--font-body', stack(body))
  root.setProperty('--font-heading', stack(heading))
  root.setProperty('--w-regular', String(a.weight))
  root.setProperty('--w-strong', String(a.weight + 200))
  root.setProperty('--w-bold', String(Math.min(a.weight + 300, 700)))
  root.setProperty('font-size', `${a.scale * 100}%`)
}

/** A one-line summary to send back once a combination is chosen. */
export function describeAppearance(a: Appearance): string {
  const heading = a.heading === 'same' ? 'same as body' : fontById(a.heading).label
  const weight = { 300: 'Light', 400: 'Regular', 500: 'Medium' }[a.weight]
  return `Body: ${fontById(a.body).label} · Headings: ${heading} · ${weight} · ${Math.round(a.scale * 100)}% size · Icons: ${a.icons}`
}

export const IconStyleContext = createContext<IconStyle>('none')
export const useIconStyle = () => useContext(IconStyleContext)
