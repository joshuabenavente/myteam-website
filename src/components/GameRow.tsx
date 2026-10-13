import { useState } from 'react'
import { TEAM } from '../lib/config.ts'
import {
  finishedSeriesSummary,
  formatGameDate,
  formatGameTime,
  formatRecord,
  hasGames,
  ordinal,
  seriesSummary,
} from '../lib/format.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { Game, HeadToHeadFile, StandingsFile, TeamInfo } from '../lib/types.ts'
import { TeamLogo } from './TeamLogo.tsx'

interface Props {
  game: Game
  standings: StandingsFile['teams']
  h2h: HeadToHeadFile
  timeZone: string
}

export function GameRow({ game, standings, h2h, timeZone }: Props) {
  const [open, setOpen] = useState(false)
  const opp = TEAMS_BY_ABBR[game.opponent]
  const oppStanding = standings[game.opponent]
  const { weekday, monthDay } = formatGameDate(game.startUtc, timeZone)
  const detailsId = `game-${game.id}`

  return (
    <li className={`game ${open ? 'open' : ''}`}>
      <button className="game-summary" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)}>
        <span className="game-date">
          <span className="weekday">{weekday}</span>
          <span className="month-day">{monthDay}</span>
        </span>

        <span className="game-matchup">
          <span className="home-away">{game.home ? 'vs' : '@'}</span>
          <TeamLogo abbr={game.opponent} />
          <span className="opponent">
            <span className="opponent-name">
              {opp.city} {opp.name}
            </span>
            {oppStanding && <span className="muted small">{formatRecord(oppStanding)}</span>}
          </span>
        </span>

        <span className="game-status">
          <GameStatus game={game} timeZone={timeZone} />
        </span>

        <Broadcasts game={game} />

        <svg className="chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="game-details" id={detailsId}>
          <GameDetails game={game} standings={standings} h2h={h2h} />
        </div>
      )}
    </li>
  )
}

export function Broadcasts({ game }: { game: Game }) {
  return (
    <span className="game-broadcasts">
      {game.broadcasts.map((b) => (
        <span
          key={b.name}
          className={`chip ${b.scope}`}
          title={`${b.scope === 'local' ? 'Local' : 'National'} ${b.kind === 'stream' ? 'streaming' : 'TV'}`}
        >
          {b.name}
        </span>
      ))}
    </span>
  )
}

/** Label, both teams' standings and the season series. */
export function GameDetails({ game, standings, h2h }: Omit<Props, 'timeZone'>) {
  return (
    <>
      {game.label && <p className="game-label">{game.label}</p>}
      <StandingsTable abbrs={[TEAM.abbr, game.opponent]} standings={standings} />
      <SeasonSeries opponent={game.opponent} h2h={h2h} />
    </>
  )
}

export function GameStatus({ game, timeZone }: { game: Game; timeZone: string }) {
  if (game.status === 'scheduled') return <span className="time">{formatGameTime(game, timeZone)}</span>
  const { team, opponent } = game.score!
  if (game.status === 'live') {
    return (
      <span className="live">
        <span className="live-dot" /> {team}-{opponent}
      </span>
    )
  }
  const won = team > opponent
  return (
    <span className={`result ${won ? 'win' : 'loss'}`}>
      {won ? 'W' : 'L'} {team}-{opponent}
    </span>
  )
}

function StandingsTable({ abbrs, standings }: { abbrs: string[]; standings: StandingsFile['teams'] }) {
  const rows = abbrs.map((a) => standings[a]).filter((s): s is TeamInfo => !!s)
  // Ranks mean nothing until games have been played.
  const started = Object.values(standings).some((s) => s.wins + s.losses > 0)
  return (
    <table className="standings">
      <thead>
        <tr>
          <th scope="col">Team</th>
          {[
            ['Record', 'Rec'],
            ['Division', 'Div'],
            ['Conference', 'Conf'],
            ['Streak', 'Strk'],
          ].map(([full, short]) => (
            <th key={full} scope="col">
              <span className="label-full">{full}</span>
              <abbr className="label-short" title={full}>
                {short}
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.abbr} className={s.abbr === TEAM.abbr ? 'us' : ''}>
            <th scope="row">
              <span className="team-cell">
                <TeamLogo abbr={s.abbr} size={20} /> {s.abbr}
              </span>
            </th>
            <td>{formatRecord(s)}</td>
            <td>
              {started ? `${ordinal(s.divisionRank)} ${s.division}` : s.division}
              {started && s.divisionGamesBehind > 0 && <span className="muted small"> · {s.divisionGamesBehind} GB</span>}
            </td>
            <td>{started ? `${ordinal(s.conferenceRank)} ${s.conference}` : s.conference}</td>
            <td>{s.streak ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SeasonSeries({ opponent, h2h }: { opponent: string; h2h: HeadToHeadFile }) {
  const series = h2h.opponents[opponent]
  if (!series) return null
  return (
    <dl className="series">
      <div>
        <dt>Season series {h2h.season}</dt>
        <dd>
          {seriesSummary(series.current.regular)}
          {hasGames(series.current, 'playoffs') && <> · Playoffs: {seriesSummary(series.current.playoffs)}</>}
        </dd>
      </div>
      <div>
        <dt>Last season {h2h.lastSeason}</dt>
        <dd>
          {finishedSeriesSummary(series.last.regular)}
          {hasGames(series.last, 'playoffs') && <> · Playoffs: {finishedSeriesSummary(series.last.playoffs)}</>}
        </dd>
      </div>
    </dl>
  )
}
