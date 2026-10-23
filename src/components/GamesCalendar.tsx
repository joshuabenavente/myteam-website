import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppData } from '../lib/data.ts'
import {
  addMonths,
  compareMonths,
  dayKey,
  formatGameDate,
  formatGameTime,
  monthGrid,
  monthLabel,
  monthOf,
  type Month,
} from '../lib/format.ts'
import { liveFor, useLive } from '../lib/live.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { Game } from '../lib/types.ts'
import { unscheduledGames } from '../lib/availability.ts'
import { Broadcasts, GameDetails, GameStatus } from './GameRow.tsx'
import { TbdNote } from './GamesList.tsx'
import { Icon } from './Icon.tsx'
import { TeamLogo } from './TeamLogo.tsx'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function GamesCalendar({ data, timeZone }: { data: AppData; timeZone: string }) {
  const games = data.schedule.games
  const [today] = useState(() => dayKey(new Date(), timeZone))

  const byDay = useMemo(() => {
    const map = new Map<string, Game[]>()
    for (const g of games) {
      const key = dayKey(g.startUtc, timeZone)
      map.set(key, [...(map.get(key) ?? []), g])
    }
    return map
  }, [games, timeZone])

  const first = games.length ? monthOf(dayKey(games[0].startUtc, timeZone)) : monthOf(today)
  const last = games.length ? monthOf(dayKey(games[games.length - 1].startUtc, timeZone)) : first

  // Open on the month of the next game (or the last month once the season is over).
  const nextGame = games.find((g) => g.status !== 'final')
  const [month, setMonth] = useState<Month>(() =>
    nextGame ? monthOf(dayKey(nextGame.startUtc, timeZone)) : last,
  )
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const selected = games.find((g) => g.id === selectedId)

  const go = (m: Month) => {
    setMonth(m)
    setSelectedId(undefined)
  }

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button
          className="icon-button"
          onClick={() => go(addMonths(month, -1))}
          disabled={compareMonths(month, first) <= 0}
          aria-label="Previous month"
        >
          <Icon name="prev" />
        </button>
        <h2>{monthLabel(month)}</h2>
        <button
          className="icon-button"
          onClick={() => go(addMonths(month, 1))}
          disabled={compareMonths(month, last) >= 0}
          aria-label="Next month"
        >
          <Icon name="next" />
        </button>
      </div>

      <table className="calendar-grid">
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col">
                <abbr title={d}>{d.slice(0, 1)}</abbr>
                <span className="weekday-full">{d}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week, i) => (
            <tr key={i}>
              {week.map((day, j) => (
                <td key={day ?? `empty-${j}`} className={day === today ? 'today' : day ? '' : 'empty'}>
                  {day && (
                    <>
                      <span className="day-number">{Number(day.slice(8))}</span>
                      {byDay.get(day)?.map((g) => (
                        <CalendarGame
                          key={g.id}
                          game={g}
                          timeZone={timeZone}
                          selected={g.id === selectedId}
                          onSelect={() => setSelectedId(g.id === selectedId ? undefined : g.id)}
                        />
                      ))}
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="calendar-legend muted small">
        <span className="legend-swatch home" /> Home <span className="legend-swatch away" /> Away
      </p>
      {month.month === 11 && unscheduledGames(data.schedule) > 0 && <TbdNote count={unscheduledGames(data.schedule)} />}

      {selected ? (
        <SelectedGame game={selected} data={data} timeZone={timeZone} />
      ) : (
        <p className="muted small calendar-hint">Select a game for details.</p>
      )}
    </div>
  )
}

function CalendarGame(props: { game: Game; timeZone: string; selected: boolean; onSelect: () => void }) {
  const { game, timeZone, selected, onSelect } = props
  const watch = liveFor(useLive(), game.id)
  const liveNow = game.status === 'live' || watch?.state === 'in' || watch?.state === 'delayed'
  const result = game.status === 'final' && game.score
  const won = result && result.team > result.opponent
  const opp = TEAMS_BY_ABBR[game.opponent]
  const date = new Date(game.startUtc).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone,
  })
  const status = result
    ? `${won ? 'Win' : 'Loss'} ${result.team} to ${result.opponent}`
    : liveNow ? 'Live' : formatGameTime(game, timeZone)
  return (
    <button
      className={`cal-game ${game.home ? 'home' : 'away'} ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
      aria-label={`${date}, ${game.home ? 'vs' : 'at'} ${game.opponent} ${opp.city} ${opp.name}, ${status}`}
      onClick={onSelect}
    >
      <span className="cal-matchup">
        <span className="cal-ha">{game.home ? 'vs' : '@'}</span>
        <span className="cal-logo">
          <TeamLogo abbr={game.opponent} size={18} />
        </span>
        <span className="cal-opp">{game.opponent}</span>
      </span>
      <span className={`cal-status ${result ? (won ? 'win' : 'loss') : ''}`}>
        {result ? (
          <>
            {won ? 'W' : 'L'}
            <span className="cal-score">
              {' '}
              {result.team}-{result.opponent}
            </span>
          </>
        ) : liveNow ? (
          <span className="cal-live">
            <span className="live-dot" aria-hidden="true" /> LIVE
          </span>
        ) : (
          formatGameTime(game, timeZone).replace(/:00| /g, '').toLowerCase()
        )}
      </span>
    </button>
  )
}

function SelectedGame({ game, data, timeZone }: { game: Game; data: AppData; timeZone: string }) {
  const opp = TEAMS_BY_ABBR[game.opponent]
  const { weekday, monthDay } = formatGameDate(game.startUtc, timeZone)
  const ref = useRef<HTMLElement>(null)
  // On small screens the details sit below the fold; bring them into view.
  useEffect(() => ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), [game.id])
  return (
    <section className="selected-game" aria-live="polite" ref={ref}>
      <div className="selected-header">
        <TeamLogo abbr={game.opponent} size={36} />
        <div>
          <h3>
            {game.home ? 'vs' : '@'} {opp.city} {opp.name}
          </h3>
          <p className="muted">
            {weekday}, {monthDay} · <GameStatus game={game} timeZone={timeZone} />
          </p>
        </div>
      </div>
      <Broadcasts game={game} />
      <GameDetails game={game} data={data} />
    </section>
  )
}
