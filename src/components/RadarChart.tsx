import { useState } from 'react'
import { RADAR_AXES, scale, type Axis } from '../lib/radar.ts'
import type { StatTotals } from '../lib/types.ts'

const SIZE = 300
const C = SIZE / 2
const R = 92

function point(i: number, r: number): [number, number] {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / RADAR_AXES.length
  return [C + Math.cos(a) * r, C + Math.sin(a) * r]
}

const path = (t: StatTotals) =>
  RADAR_AXES.map((ax, i) => point(i, scale(ax, ax.value(t)) * R).join(',')).join(' ')

interface Props {
  primary: { label: string; stats: StatTotals }
  comparison?: { label: string; stats: StatTotals }
}

/** This season's shape (accent, filled) over a comparison season (gray, dashed). */
export function RadarChart({ primary, comparison }: Props) {
  const [active, setActive] = useState<number>()
  const activeAxis = active === undefined ? undefined : RADAR_AXES[active]

  return (
    <figure className="radar">
      <div className="radar-legend">
        <span>
          <svg width="14" height="14" aria-hidden="true">
            <rect x="1" y="1" width="12" height="12" rx="3" className="radar-swatch-primary" />
          </svg>
          {primary.label}
        </span>
        {comparison && (
          <span>
            <svg width="18" height="14" aria-hidden="true">
              <line x1="1" y1="7" x2="17" y2="7" className="radar-swatch-comparison" />
            </svg>
            {comparison.label}
          </span>
        )}
      </div>

      <div className="radar-plot">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Stat overview: ${RADAR_AXES.map((a) => `${a.label} ${a.value(primary.stats) !== undefined ? a.format(a.value(primary.stats)!) : 'none'}`).join(', ')}`}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon
              key={f}
              className="radar-ring"
              points={RADAR_AXES.map((_, i) => point(i, f * R).join(',')).join(' ')}
            />
          ))}
          {RADAR_AXES.map((_, i) => {
            const [x, y] = point(i, R)
            return <line key={i} className="radar-spoke" x1={C} y1={C} x2={x} y2={y} />
          })}

          {comparison && <polygon className="radar-comparison" points={path(comparison.stats)} />}
          <polygon className="radar-primary" points={path(primary.stats)} />

          {RADAR_AXES.map((ax, i) => {
            const v = ax.value(primary.stats)
            const [px, py] = point(i, scale(ax, v) * R)
            const [lx, ly] = point(i, R + 30)
            const anchor = Math.abs(lx - C) < 4 ? 'middle' : lx > C ? 'start' : 'end'
            return (
              <g
                key={ax.key}
                className={`radar-axis ${active === i ? 'active' : ''}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(undefined)}
                onClick={() => setActive(active === i ? undefined : i)}
              >
                <circle className="radar-hit" cx={px} cy={py} r={16} />
                {v !== undefined && <circle className="radar-dot" cx={px} cy={py} r={4} />}
                <text x={lx} y={ly - 7} textAnchor={anchor} className="radar-label">
                  {ax.label}
                </text>
                <text x={lx} y={ly + 9} textAnchor={anchor} className="radar-value">
                  {v === undefined ? '—' : ax.format(v)}
                </text>
              </g>
            )
          })}
        </svg>

        {activeAxis && (
          <div className="radar-tooltip" role="status">
            <strong>{activeAxis.label}</strong>
            <span>
              {primary.label}: {fmt(activeAxis, primary.stats)}
            </span>
            {comparison && (
              <span>
                {comparison.label}: {fmt(activeAxis, comparison.stats)}
              </span>
            )}
          </div>
        )}
      </div>
      <figcaption className="radar-note">Scaled to typical NBA ranges · per game</figcaption>
    </figure>
  )
}

function fmt(axis: Axis, stats: StatTotals) {
  const v = axis.value(stats)
  return v === undefined ? '—' : axis.format(v)
}
