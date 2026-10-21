import { useEffect, useState, type RefObject } from 'react'

const ranges = [
  { key: 'strength', label: 'Color strength', min: 0.5, max: 1.8, step: 0.05, initial: 1 },
  { key: 'spread', label: 'Color spread', min: 0.7, max: 1.5, step: 0.05, initial: 1 },
  { key: 'drift', label: 'Movement amount', min: 0, max: 2.5, step: 0.1, initial: 1.3 },
  { key: 'tempo', label: 'Cycle duration', min: 0.4, max: 2, step: 0.1, initial: 1 },
  { key: 'grain', label: 'Grain', min: 0, max: 0.3, step: 0.01, initial: 0.2 },
] as const
type RangeKey = (typeof ranges)[number]['key']
const patterns = [
  { value: 'clouds', label: 'Clouds', description: 'Soft, overlapping color clouds.' },
  { value: 'ribbons', label: 'Ribbons', description: 'Long, flowing bands of color.' },
  { value: 'pools', label: 'Pools', description: 'Rounded islands of color with darker space between.' },
  { value: 'diagonal', label: 'Diagonal flow', description: 'Broad washes sweeping diagonally across the header.' },
] as const
type Pattern = (typeof patterns)[number]['value']
type Settings = Record<RangeKey, number> & { color: string; accent: string; paused: boolean; pattern: Pattern }
const palettes: Record<string, string> = { DEN: '#245fe5', BOS: '#009b65', LAL: '#823dd6' }

/** An opt-in preview tool: /<team>?tune=1. Settings stay on this browser, per team. */
export function GradientControls({ headerRef, team, color, accent }: {
  headerRef: RefObject<HTMLElement | null>; team: string; color: string; accent: string
}) {
  const defaults = {
    ...Object.fromEntries(ranges.map((r) => [r.key, r.initial])),
    color: palettes[team] ?? color, accent: team === 'LAL' ? '#fdb927' : accent, paused: false, pattern: 'ribbons',
  } as Settings
  const storageKey = `myteam:gradient:${team}`
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (!saved) return defaults
      const restored = { ...defaults }
      for (const r of ranges) if (typeof saved[r.key] === 'number' && Number.isFinite(saved[r.key]))
        restored[r.key] = Math.max(r.min, Math.min(r.max, saved[r.key]))
      for (const key of ['color', 'accent'] as const) if (/^#[0-9a-f]{6}$/i.test(saved[key])) restored[key] = saved[key]
      restored.paused = saved.paused === true
      if (patterns.some((p) => p.value === saved.pattern)) restored.pattern = saved.pattern
      return restored
    } catch { return defaults }
  })
  const [open, setOpen] = useState(false)
  const [exported, setExported] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const previousPattern = header.dataset.gradientPattern
    header.dataset.gradientPattern = settings.pattern
    setCopied(false)
    setExported('')
    const values: Record<string, string> = Object.fromEntries(ranges.map((r) => [`--atmosphere-${r.key}`, String(settings[r.key])]))
    values['--atmosphere-color'] = settings.color
    values['--atmosphere-accent'] = settings.accent
    values['--atmosphere-play'] = settings.paused ? 'paused' : 'running'
    for (const [key, value] of Object.entries(values)) header.style.setProperty(key, value)
    try { localStorage.setItem(storageKey, JSON.stringify(settings)) } catch { /* Storage is optional. */ }
    return () => {
      for (const key of Object.keys(values)) header.style.removeProperty(key)
      if (previousPattern === undefined) delete header.dataset.gradientPattern
      else header.dataset.gradientPattern = previousPattern
    }
  }, [settings, headerRef, storageKey])

  const copy = async () => {
    const text = JSON.stringify({ team, ...settings }, null, 2)
    setExported(text)
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { setCopied(false) }
  }

  return (
    <aside className="gradient-tuner" aria-label="Gradient tuning">
      <button className="gradient-tuner-toggle" aria-expanded={open} aria-controls="gradient-tuner-panel" onClick={() => setOpen(!open)}>
        {open ? 'Hide gradient controls' : 'Tune gradient'}
      </button>
      {open && <div id="gradient-tuner-panel" className="gradient-tuner-panel">
        <strong>Gradient · {team}</strong>
        <p>Saved on this browser for this team. Longer cycles move more slowly.</p>
        <label>
          <span>Pattern</span>
          <select value={settings.pattern} onChange={(e) => setSettings({ ...settings, pattern: e.target.value as Pattern })}>
            {patterns.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <p>{patterns.find((p) => p.value === settings.pattern)?.description}</p>
        {ranges.map((r) => <label key={r.key}>
          <span>{r.label} <output>{settings[r.key].toFixed(2)}{r.key === 'grain' ? '' : '×'}</output></span>
          <input type="range" min={r.min} max={r.max} step={r.step} value={settings[r.key]} onChange={(e) => { setSettings({ ...settings, [r.key]: Number(e.target.value) }); setCopied(false) }} />
        </label>)}
        {(['color', 'accent'] as const).map((key) => <label className="gradient-color" key={key}>
          <span>{key === 'color' ? 'Main color' : 'Accent color'}</span>
          <input type="color" value={settings[key]} onChange={(e) => { setSettings({ ...settings, [key]: e.target.value }); setCopied(false) }} />
        </label>)}
        <label className="gradient-pause"><input type="checkbox" checked={settings.paused} onChange={(e) => setSettings({ ...settings, paused: e.target.checked })} /> Pause motion</label>
        <div className="gradient-tuner-actions">
          <button onClick={() => { setSettings(defaults); setCopied(false); setExported('') }}>Reset team</button>
          <button onClick={() => void copy()}>{copied ? 'Copied' : 'Copy settings'}</button>
        </div>
        {exported && <label><span>Settings to share</span><textarea readOnly value={exported} rows={4} onFocus={(e) => e.target.select()} /></label>}
        <p role="status">{copied ? 'Settings copied.' : 'Reduce Motion settings are always respected.'}</p>
      </div>}
    </aside>
  )
}
