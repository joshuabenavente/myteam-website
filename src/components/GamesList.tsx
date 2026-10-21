import { useState } from 'react'
import { formatGameDate, groupByMonth } from '../lib/format.ts'
import type { AppData } from '../lib/data.ts'
import { useTeam } from '../lib/team.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { PastGame } from '../lib/types.ts'
import { unscheduledGames } from '../lib/availability.ts'
import { GameRow } from './GameRow.tsx'
import { TeamLogo } from './TeamLogo.tsx'

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

/** One of last season's results: date, opponent and score, without a game page. */
function PastGameRow({ game, team, timeZone }: { game: PastGame; team: string; timeZone: string }) {
  const home = game.home === team
  const opponent = home ? game.away : game.home
  const opp = TEAMS_BY_ABBR[opponent]
  const [us, them] = home ? [game.homeScore, game.awayScore] : [game.awayScore, game.homeScore]
  const won = us > them
  const { weekday, monthDay } = formatGameDate(game.startUtc, timeZone)
  return (
    <li className="game past">
      <div className="game-summary">
        <span className="game-date">
          <span className="weekday">{weekday}</span>
          <span className="month-day">{monthDay}</span>
        </span>
        <span className="game-matchup">
          <span className="home-away">{home ? 'vs' : '@'}</span>
          <TeamLogo abbr={opponent} />
          <span className="opponent">
            <span className="opponent-name">{opp ? `${opp.city} ${opp.name}` : opponent}</span>
            {game.type === 'playoffs' && <span className="muted small">Playoffs</span>}
          </span>
        </span>
        <span className="game-status">
          <span className={`result ${won ? 'win' : 'loss'}`}>
            {won ? 'W' : 'L'} {us}-{them}
          </span>
        </span>
        <span className="game-broadcasts" />
        <span className="chevron" />
      </div>
    </li>
  )
}

type Filter = 'upcoming' | 'completed'

interface Props {
  data: AppData
  timeZone: string
  /** A game to open and scroll to (from the header's "+N more"). */
  focusId?: string
}

export function GamesList({ data, timeZone, focusId }: Props) {
  const team = useTeam()
  const [filter, setFilter] = useState<Filter>('upcoming')
  // Completed games can show last season's results too (NBA-03); results only, no game pages.
  const [season, setSeason] = useState<'current' | 'last'>('current')
  const unscheduled = unscheduledGames(data.schedule)
  const games =
    filter === 'upcoming'
      ? data.schedule.games.filter((g) => g.status !== 'final')
      : data.schedule.games.filter((g) => g.status === 'final').reverse()
  const lastSeason = data.lastSeason
  const showingLast = filter === 'completed' && season === 'last' && !!lastSeason
  const pastGames = showingLast
    ? lastSeason.games.filter((g) => g.home === team.abbr || g.away === team.abbr).sort((a, b) => b.startUtc.localeCompare(a.startUtc))
    : []

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
        {filter === 'completed' && lastSeason && (
          <div className="segmented small-toggle" role="group" aria-label="Season">
            <button aria-pressed={season === 'current'} onClick={() => setSeason('current')}>
              {data.schedule.season}
            </button>
            <button aria-pressed={season === 'last'} onClick={() => setSeason('last')}>
              {lastSeason.season}
            </button>
          </div>
        )}
      </div>

      {showingLast ? (
        pastGames.length === 0 ? (
          <p className="placeholder">No {lastSeason.season} results.</p>
        ) : (
          groupByMonth(pastGames, timeZone).map(([month, monthGames]) => (
            <section key={month} className="month">
              <h2>{month}</h2>
              <ul className="games">
                {monthGames.map((g) => (
                  <PastGameRow key={`${g.startUtc}-${g.home}`} game={g} team={team.abbr} timeZone={timeZone} />
                ))}
              </ul>
            </section>
          ))
        )
      ) : games.length === 0 ? (
        <p className="placeholder">
          {filter === 'upcoming' ? 'No games left on the schedule.' : `No ${data.schedule.season} games played yet.`}
        </p>
      ) : (
        groupByMonth(games, timeZone).map(([month, monthGames]) => (
          <section key={month} className="month">
            <h2>{month}</h2>
            {filter === 'upcoming' && month.startsWith('December') && unscheduled > 0 && (
              <TbdNote count={unscheduled} />
            )}
            <ul className="games">
              {monthGames.map((g) => (
                <GameRow key={g.id} game={g} data={data} timeZone={timeZone} focused={g.id === focusId} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  )
}
