import { useState } from 'react'
import type { AppData } from '../lib/data.ts'
import { routeHref } from '../lib/route.ts'
import { possessive, useTeam } from '../lib/team.ts'
import { change, COLUMNS, type StatColumn, type StatMode } from '../lib/stats.ts'
import type { Player, StatTotals, TrackedGameType } from '../lib/types.ts'

type Compare = 'none' | 'lastFull' | 'lastToDate'

interface Sort {
  key: string
  desc: boolean
}

export function PlayerTracker({ data }: { data: AppData }) {
  const team = useTeam()
  const { players, season, lastSeason, teamGamesPlayed } = data.players
  const hasPlayoffs = players.some((p) => p.current.playoffs || p.lastFull.playoffs)
  const seasonStarted = teamGamesPlayed.regular + teamGamesPlayed.playoffs > 0

  const [type, setType] = useState<TrackedGameType>('regular')
  // Until opening night there's nothing to show for this season, so start with last season beside it.
  const [chosenCompare, setCompare] = useState<Compare>(seasonStarted ? 'none' : 'lastFull')
  const [mode, setMode] = useState<StatMode>('perGame')
  const [sort, setSort] = useState<Sort>({ key: 'minutes', desc: true })

  const cutoff = teamGamesPlayed[type]
  // Before anyone has played this season, show the comparison alone instead of a row of dashes.
  const hasCurrent = players.some((p) => p.current[type])
  // With nothing this season to show (before opening night, or playoffs before the playoffs), show
  // all of last season and hide the comparison choice.
  const compare: Compare = hasCurrent ? chosenCompare : 'lastFull'
  const comparisonOf = (p: Player) =>
    compare === 'lastFull' ? p.lastFull[type] : compare === 'lastToDate' ? p.lastToDate[type] : undefined

  const sortColumn = COLUMNS.find((c) => c.key === sort.key)
  const sortValue = (p: Player) => {
    if (sort.key === 'name') return undefined
    const pick = (t?: StatTotals) => (t && sortColumn ? sortColumn.value(t, mode) : undefined)
    // Fall back to last season so the order is still useful before this season's stats exist.
    return pick(p.current[type]) ?? pick(comparisonOf(p))
  }
  const sorted = [...players].sort((a, b) => {
    if (sort.key === 'name') return a.name.localeCompare(b.name) * (sort.desc ? -1 : 1)
    const va = sortValue(a)
    const vb = sortValue(b)
    if (va === undefined || vb === undefined) return va === vb ? a.name.localeCompare(b.name) : va === undefined ? 1 : -1
    return (sort.desc ? vb - va : va - vb) || a.name.localeCompare(b.name)
  })

  const toggleSort = (key: string) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' }))

  // Teams take turns having their stats fetched, so a team can briefly have none yet.
  if (players.length === 0) {
    return (
      <p className="placeholder">
        The {possessive(team.name)} player stats are on their way. Teams update in turns, so check back in a few
        hours.
      </p>
    )
  }

  return (
    <div className="players">
      <div className="player-controls">
        {hasPlayoffs && (
          <Toggle
            label="Games"
            value={type}
            onChange={setType}
            options={[
              ['regular', 'Regular season'],
              ['playoffs', 'Playoffs'],
            ]}
          />
        )}
        {/* Nothing to compare until this season has games; the note below says what's shown. */}
        {hasCurrent && (
          <Toggle
            label="Compare with"
            value={compare}
            onChange={setCompare}
            options={[
              ['none', 'None'],
              ['lastFull', `All of ${lastSeason}`],
              ['lastToDate', `${lastSeason} at this point`],
            ]}
          />
        )}
        <Toggle
          label="Stats"
          value={mode}
          onChange={setMode}
          options={[
            ['perGame', 'Per game'],
            ['totals', 'Totals'],
          ]}
        />
      </div>

      <p className="muted small compare-note">
        {compare === 'lastToDate'
          ? cutoff > 0
            ? `Compared with ${lastSeason} through the ${possessive(team.name)} first ${cutoff} ${type === 'playoffs' ? 'playoff ' : ''}game${cutoff === 1 ? '' : 's'}, the same point as this season.`
            : `The ${team.name} haven't played a ${type === 'playoffs' ? 'playoff' : 'regular season'} game in ${season} yet, so there's nothing to compare at this point.`
          : compare === 'lastFull'
            ? hasCurrent
              ? `Each cell shows ${season} on top and all of ${lastSeason} below, with the change. Last season includes games for other teams.`
              : `No ${season}${type === 'playoffs' ? ' playoff' : ''} games yet, so this shows all of ${lastSeason} (including games for other teams).`
            : !hasCurrent
              ? `No ${season}${type === 'playoffs' ? ' playoff' : ''} games yet; pick a comparison to see last season.`
              : ''}
      </p>

      <div className="table-scroll">
        <table className="player-table">
          <thead>
            <tr>
              <SortHeader label="Player" title="Player" sortKey="name" sort={sort} onSort={toggleSort} />
              {COLUMNS.map((c) => (
                <SortHeader key={c.key} label={c.label} title={c.title} sortKey={c.key} sort={sort} onSort={toggleSort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <th scope="row" className="player-name">
                  <a className="player-link" href={routeHref({ page: 'player', id: p.id })}>
                    <span className="avatar" aria-hidden="true">
                      {p.headshot && <img src={p.headshot} alt="" loading="lazy" />}
                    </span>
                    <span>{p.name}</span>
                  </a>
                  <span className="muted small">
                    {p.number && `#${p.number} · `}
                    {p.position}
                    {p.twoWay && (
                      <>
                        {' '}
                        <span className="badge" title="Two-way contract">
                          <span aria-hidden="true">TW</span>
                          <span className="sr-only">Two-way contract</span>
                        </span>
                      </>
                    )}
                  </span>
                </th>
                {COLUMNS.map((c) => (
                  <StatCell
                    key={c.key}
                    col={c}
                    mode={mode}
                    current={p.current[type]}
                    previous={comparisonOf(p)}
                    comparing={compare !== 'none'}
                    hasCurrent={hasCurrent}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCell(props: {
  col: StatColumn
  mode: StatMode
  current?: StatTotals
  previous?: StatTotals
  comparing: boolean
  hasCurrent: boolean
}) {
  const { col, mode, current, previous, comparing, hasCurrent } = props
  const now = current && col.value(current, mode)
  const before = previous && col.value(previous, mode)
  if (comparing && !hasCurrent) {
    return (
      <td className={`col-${col.key}`}>
        <span className="stat-now">{before === undefined ? '—' : col.format(before, mode)}</span>
      </td>
    )
  }
  const delta = now !== undefined && before !== undefined && !col.noChange ? change(col, now, before, mode) : undefined
  return (
    <td className={`col-${col.key}`}>
      <span className="stat-now">{now === undefined ? '—' : col.format(now, mode)}</span>
      {comparing && (
        <span className="stat-before">
          {before === undefined ? '—' : col.format(before, mode)}
          {delta && delta.direction !== 'same' && (
            <span className={`delta ${delta.good ? 'good' : 'bad'}`}>
              {delta.direction === 'up' ? '▲' : '▼'}
              {delta.text}
            </span>
          )}
        </span>
      )}
    </td>
  )
}

function SortHeader(props: { label: string; title: string; sortKey: string; sort: Sort; onSort: (key: string) => void }) {
  const { label, title, sortKey, sort, onSort } = props
  const active = sort.key === sortKey
  return (
    <th scope="col" className={`col-${sortKey}`} aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
      <button className={`sort ${active ? 'active' : ''}`} title={title} onClick={() => onSort(sortKey)}>
        {label}
        <span aria-hidden="true">{active ? (sort.desc ? ' ↓' : ' ↑') : ''}</span>
      </button>
    </th>
  )
}

function Toggle<T extends string>(props: {
  label: string
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  const { label, value, onChange, options } = props
  return (
    <div className="control">
      <span className="control-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
