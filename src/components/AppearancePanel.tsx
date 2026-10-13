import { useEffect, useState } from 'react'
import {
  DEFAULT_APPEARANCE,
  describeAppearance,
  FONTS,
  type Appearance,
  type FontOption,
} from '../lib/appearance.ts'
import { Icon } from './Icon.tsx'

interface Props {
  value: Appearance
  onChange: (a: Appearance) => void
  onTurnOff: () => void
}

const GROUPS: FontOption['group'][] = ['Default', 'Monospace', 'Easy to read', 'Sporty']

function FontSelect(props: { label: string; value: string; onChange: (id: string) => void; allowSame?: boolean }) {
  return (
    <label className="picker-field">
      <span className="control-label">{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.allowSame && <option value="same">Same as body</option>}
        {GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {FONTS.filter((f) => f.group === g).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}

function Choice<T extends string | number>(props: {
  label: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="picker-field">
      <span className="control-label">{props.label}</span>
      <div className="segmented" role="group" aria-label={props.label}>
        {props.options.map(([v, text]) => (
          <button key={String(v)} aria-pressed={props.value === v} onClick={() => props.onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Temporary panel for trying fonts, sizes and icon sets on the real app. */
export function AppearancePanel({ value, onChange, onTurnOff }: Props) {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    document.body.classList.toggle('picker-open', open)
    return () => document.body.classList.remove('picker-open')
  }, [open])
  const set = (patch: Partial<Appearance>) => onChange({ ...value, ...patch })
  const bodyIndex = FONTS.findIndex((f) => f.id === value.body)
  // Step through fonts quickly without opening the dropdown.
  const step = (n: number) => set({ body: FONTS[(bodyIndex + n + FONTS.length) % FONTS.length].id })

  if (!open) {
    return (
      <button className="picker-fab" onClick={() => setOpen(true)} aria-label="Open appearance picker">
        <Icon name="palette" size={22} always />
      </button>
    )
  }

  return (
    <aside className="picker" aria-label="Appearance picker">
      <div className="picker-head">
        <strong>Try fonts & icons</strong>
        <button className="icon-button small" onClick={() => setOpen(false)} aria-label="Minimize picker">
          <Icon name="close" size={18} always />
        </button>
      </div>

      <div className="picker-row">
        <FontSelect label="Body font" value={value.body} onChange={(body) => set({ body })} />
        <div className="picker-step">
          <button className="icon-button small" onClick={() => step(-1)} aria-label="Previous font">
            <Icon name="prev" size={18} always />
          </button>
          <button className="icon-button small" onClick={() => step(1)} aria-label="Next font">
            <Icon name="next" size={18} always />
          </button>
        </div>
      </div>
      <FontSelect label="Heading font" value={value.heading} onChange={(heading) => set({ heading })} allowSame />

      <Choice
        label="Weight"
        value={value.weight}
        onChange={(weight) => set({ weight })}
        options={[
          [300, 'Light'],
          [400, 'Regular'],
          [500, 'Medium'],
        ]}
      />
      <Choice
        label="Text size"
        value={value.scale}
        onChange={(scale) => set({ scale })}
        options={[
          [0.9, '90%'],
          [1, '100%'],
          [1.1, '110%'],
          [1.2, '120%'],
        ]}
      />
      <Choice
        label="Icons"
        value={value.icons}
        onChange={(icons) => set({ icons })}
        options={[
          ['none', 'None'],
          ['lucide', 'Lucide'],
          ['material', 'Material'],
        ]}
      />

      <p className="picker-summary">{describeAppearance(value)}</p>
      <div className="picker-actions">
        <button className="text-button" onClick={() => onChange(DEFAULT_APPEARANCE)}>
          <Icon name="reset" size={16} always /> Reset
        </button>
        <button className="text-button" onClick={onTurnOff}>
          Turn off picker
        </button>
      </div>
    </aside>
  )
}
