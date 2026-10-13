import { useState } from 'react'
import { absencesForGame, availabilityLabel, nextGames } from '../lib/availability.ts'
import { channelsFor } from '../lib/channels.ts'
import { TEAM } from '../lib/config.ts'
import type { AppData } from '../lib/data.ts'
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
import type { AvailabilityFile, Game, HeadToHeadFile, StandingsFile, TeamInfo } from '../lib/types.ts'
import { Icon } from './Icon.tsx'
import { TeamLogo } from './TeamLogo.tsx'

interface Props {
  game: Game
  data: AppData
  timeZone: string
}

export function GameRow({ game, data, timeZone }: Props) {
  const standings = data.standings.teams
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
            {oppStanding && oppStanding.wins + oppStanding.losses > 0 && (
              <span className="muted small">{formatRecord(oppStanding)}</span>
            )}
          </span>
        </span>

        <span className="game-status">
          <GameStatus game={game} timeZone={timeZone} />
        </span>

        <Broadcasts game={game} />

        <span className="chevron">
          <Icon
            name="expand"
            fallback={
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </span>
      </button>

      {open && (
        <div className="game-details" id={detailsId}>
          <GameDetails game={game} data={data} />
        </div>
      )}
    </li>
  )
}

export function Broadcasts({ game }: { game: Game }) {
  return (
    <span className="game-broadcasts">
      {channelsFor(game.broadcasts).map((c) => (
        <span
          key={c.label}
          className={`chip ${c.scope}`}
          title={c.explain ?? `${c.scope === 'local' ? 'Local' : 'National'} ${c.kind === 'stream' ? 'streaming' : 'TV'}`}
        >
          <Icon name={c.kind === 'stream' ? 'stream' : 'tv'} size={13} />
          {c.label}
          <span className="sr-only">{c.scope === 'local' ? ' (local)' : ' (national)'}</span>
        </span>
      ))}
    </span>
  )
}

/** Label, preview, standings, season series and (for the next few games) who's out. */
export function GameDetails({ game, data }: { game: Game; data: AppData }) {
  const isNext = nextGames(data.schedule.games).some((g) => g.id === game.id)
  const preview = isNext ? data.previews?.games[game.id] : undefined
  return (
    <>
      {game.label && <p className="game-label">{game.label}</p>}
      {preview && (
        <div className="preview">
          <h3>
            <Icon name="preview" size={14} /> Preview
          </h3>
          <p>{preview.text}</p>
          <p className="preview-credit muted small">Written by Claude from the stats on this page.</p>
        </div>
      )}
      <StandingsTable abbrs={[TEAM.abbr, game.opponent]} standings={data.standings.teams} />
      <SeasonSeries opponent={game.opponent} h2h={data.h2h} />
      {isNext && data.availability && <InjuryReport game={game} availability={data.availability} />}
    </>
  )
}

function InjuryReport({ game, availability }: { game: Game; availability: AvailabilityFile }) {
  const updated = new Date(availability.updatedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  return (
    <div className="not-available">
      <h3>
        <Icon name="injury" size={14} /> Injury report <span className="muted small">· updated {updated}</span>
      </h3>
      <div className="na-teams">
        {[TEAM.abbr, game.opponent].map((abbr) => {
          const list = absencesForGame(availability.teams[abbr], game)
          return (
            <div key={abbr} className="na-team">
              <h4>
                <TeamLogo abbr={abbr} size={18} /> {abbr}
              </h4>
              {list.length === 0 ? (
                <p className="muted small">Nobody listed</p>
              ) : (
                <ul>
                  {list.map((a) => (
                    <li key={a.name}>
                      <span className="na-name">{a.name}</span>
                      <span className={`status-tag ${statusClass(a.status)}`}>{availabilityLabel(a)}</span>
                      <span className="muted small na-reason">
                        {a.reason}
                        {a.returnDate && ` · expected back ${formatReturn(a.returnDate)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const statusClass = (status: string) =>
  status === 'Out' ? 'out' : status === 'Doubtful' ? 'doubtful' : status === 'Probable' ? 'probable' : 'questionable'

const formatReturn = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

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
