import { useState } from 'react'
import { groupByMonth } from '../lib/format.ts'
import type { AppData } from '../lib/data.ts'
import { GameRow } from './GameRow.tsx'

type Filter = 'upcoming' | 'completed'

export function GamesList({ data, timeZone }: { data: AppData; timeZone: string }) {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const games =
    filter === 'upcoming'
      ? data.schedule.games.filter((g) => g.status !== 'final')
      : data.schedule.games.filter((g) => g.status === 'final').reverse()

  return (
    <>
      <div className="segmented small-toggle" role="group" aria-label="Which games">
        <button aria-pressed={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>
          Upcoming
        </button>
        <button aria-pressed={filter === 'completed'} onClick={() => setFilter('completed')}>
          Completed
        </button>
      </div>

      {games.length === 0 ? (
        <p className="placeholder">{filter === 'upcoming' ? 'No games left on the schedule.' : 'No games played yet.'}</p>
      ) : (
        groupByMonth(games, timeZone).map(([month, monthGames]) => (
          <section key={month} className="month">
            <h2>{month}</h2>
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
