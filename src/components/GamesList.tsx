import { useState } from 'react'
import { channelsFor } from '../lib/channels.ts'
import { groupByMonth } from '../lib/format.ts'
import type { AppData } from '../lib/data.ts'
import { unscheduledGames } from '../lib/availability.ts'
import { GameRow } from './GameRow.tsx'

export function TbdNote({ count }: { count: number }) {
  return (
    <p className="tbd-note">
      <strong>
        {count} more {count === 1 ? 'game' : 'games'} to be scheduled
      </strong>{' '}
      — the NBA sets them after NBA Cup group play in early December.
    </p>
  )
}

/** Explains the channel names and the local/national styling. */
function ChannelGuide({ data }: { data: AppData }) {
  const local = new Map<string, string>()
  for (const g of data.schedule.games) {
    for (const c of channelsFor(g.broadcasts)) if (c.scope === 'local' && c.explain) local.set(c.label, c.explain)
  }
  return (
    <details className="channel-guide">
      <summary>What do the channels mean?</summary>
      <p>
        <span className="chip local">Gold</span> channels are Denver's local broadcasts;{' '}
        <span className="chip national">outlined</span> ones are national and available everywhere.
      </p>
      <dl>
        {[...local].map(([label, explain]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{explain}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

type Filter = 'upcoming' | 'completed'

export function GamesList({ data, timeZone }: { data: AppData; timeZone: string }) {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const unscheduled = unscheduledGames(data.schedule)
  const games =
    filter === 'upcoming'
      ? data.schedule.games.filter((g) => g.status !== 'final')
      : data.schedule.games.filter((g) => g.status === 'final').reverse()

  return (
    <>
      <div className="list-controls">
        <div className="segmented small-toggle" role="group" aria-label="Which games">
          <button aria-pressed={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>
            Upcoming
          </button>
          <button aria-pressed={filter === 'completed'} onClick={() => setFilter('completed')}>
            Completed
          </button>
        </div>
        <ChannelGuide data={data} />
      </div>

      {games.length === 0 ? (
        <p className="placeholder">{filter === 'upcoming' ? 'No games left on the schedule.' : 'No games played yet.'}</p>
      ) : (
        groupByMonth(games, timeZone).map(([month, monthGames]) => (
          <section key={month} className="month">
            <h2>{month}</h2>
            {filter === 'upcoming' && month.startsWith('December') && unscheduled > 0 && (
              <TbdNote count={unscheduled} />
            )}
            <ul className="games">
              {monthGames.map((g) => (
                <GameRow key={g.id} game={g} data={data} timeZone={timeZone} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  )
}
