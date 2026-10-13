import { useState } from 'react'
import { absencesForGame, nextGames } from '../lib/availability.ts'
import { TEAM } from '../lib/config.ts'
import { useGameLogs, type AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime } from '../lib/format.ts'
import { routeHref } from '../lib/route.ts'
import { COLUMNS, change } from '../lib/stats.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { GameLogEntry, Player, StatTotals, TrackedGameType } from '../lib/types.ts'
import { Broadcasts } from './GameRow.tsx'
import { Icon } from './Icon.tsx'
import { TeamLogo } from './TeamLogo.tsx'

// The hero's stat strip: a focused subset of the tracker's columns.
const STRIP = ['games', 'minutes', 'points', 'rebounds', 'assists', 'fgPct', 'threePct', 'ftPct']
const STRIP_COLUMNS = STRIP.map((k) => COLUMNS.find((c) => c.key === k)!)

function age(birthDate: string): number {
  const born = new Date(`${birthDate}T12:00:00Z`)
  const now = new Date()
  let years = now.getUTCFullYear() - born.getUTCFullYear()
  if (now.getUTCMonth() < born.getUTCMonth() || (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate())) years--
  return years
}

const formatBorn = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function PlayerPage({ id, data, timeZone }: { id: string; data: AppData; timeZone: string }) {
  const player = data.players.players.find((p) => p.id === id)
  if (!player) {
    return (
      <p className="placeholder">
        Player not found. <a href={routeHref({ page: 'players' })}>Back to all players</a>
      </p>
    )
  }
  return <PlayerView player={player} data={data} timeZone={timeZone} />
}

function PlayerView({ player, data, timeZone }: { player: Player; data: AppData; timeZone: string }) {
  const { season, lastSeason, teamGamesPlayed } = data.players
  const hasPlayoffs = !!(player.current.playoffs || player.lastFull.playoffs)
  const [type, setType] = useState<TrackedGameType>('regular')
  const [first, ...rest] = player.name.split(' ')
  const bio = player.bio ?? {}

  const rows: { label: string; stats?: StatTotals; compareTo?: StatTotals }[] = [
    { label: season, stats: player.current[type], compareTo: player.lastToDate[type] ?? player.lastFull[type] },
    ...(teamGamesPlayed[type] > 0
      ? [{ label: `${lastSeason} through ${teamGamesPlayed[type]} games`, stats: player.lastToDate[type] }]
      : []),
    { label: lastSeason, stats: player.lastFull[type] },
  ]

  return (
    <div className="player-page">
      <a className="back-link" href={routeHref({ page: 'players' })}>
        <Icon name="prev" size={16} fallback="‹" /> All players
      </a>

      <section className="player-hero" aria-label={player.name}>
        <div className="hero-backdrop" aria-hidden="true">
          {player.number && <span className="hero-number">{player.number}</span>}
          <span className="hero-wordmark">NUGGETS</span>
        </div>

        <div className="hero-photo">
          {player.headshot ? (
            <img src={player.headshot} alt="" />
          ) : (
            <svg viewBox="0 0 600 436" aria-hidden="true">
              <circle cx="300" cy="170" r="95" />
              <path d="M110 436c10-120 90-190 190-190s180 70 190 190z" />
            </svg>
          )}
        </div>

        <div className="hero-info">
          <h1 className="hero-name">
            <span className="first">{first}</span>
            <span className="last">{rest.join(' ')}</span>
          </h1>
          <p className="hero-id">
            <TeamLogo abbr={TEAM.abbr} size={28} />
            {player.number && <span className="hero-jersey">#{player.number}</span>}
            <span className="hero-pos">{player.position}</span>
            {player.twoWay && <span className="badge">Two-way</span>}
          </p>

          <dl className="hero-measure">
            {bio.height && (
              <div>
                <dt>Height</dt>
                <dd>{bio.height}</dd>
              </div>
            )}
            {bio.weight && (
              <div>
                <dt>Weight</dt>
                <dd>
                  {bio.weight}
                  <small>lbs</small>
                </dd>
              </div>
            )}
            {bio.birthDate && (
              <div>
                <dt>Age</dt>
                <dd>{age(bio.birthDate)}</dd>
              </div>
            )}
          </dl>

          <dl className="hero-facts">
            {bio.birthDate && (
              <>
                <dt>Born</dt>
                <dd>{formatBorn(bio.birthDate)}</dd>
              </>
            )}
            {bio.birthPlace && (
              <>
                <dt>From</dt>
                <dd>{bio.birthPlace}</dd>
              </>
            )}
            {bio.college && (
              <>
                <dt>College</dt>
                <dd>{bio.college}</dd>
              </>
            )}
            {bio.experience !== undefined && (
              <>
                <dt>Experience</dt>
                <dd>{bio.experience === 0 ? 'Rookie' : `${bio.experience} ${bio.experience === 1 ? 'season' : 'seasons'}`}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="hero-strip">
          {hasPlayoffs && (
            <div className="strip-toggle segmented" role="group" aria-label="Games">
              <button aria-pressed={type === 'regular'} onClick={() => setType('regular')}>
                Regular season
              </button>
              <button aria-pressed={type === 'playoffs'} onClick={() => setType('playoffs')}>
                Playoffs
              </button>
            </div>
          )}
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Season</span>
                </th>
                {STRIP_COLUMNS.map((c) => (
                  <th key={c.key} scope="col" title={c.title}>
                    {c.key === 'games' ? 'GP' : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {STRIP_COLUMNS.map((c) => {
                    const v = r.stats && c.value(r.stats, 'perGame')
                    const before = r.compareTo && c.value(r.compareTo, 'perGame')
                    const d = v !== undefined && before !== undefined && !c.noChange ? change(c, v, before, 'perGame') : undefined
                    return (
                      <td key={c.key}>
                        {v === undefined ? '—' : c.format(v, 'perGame')}
                        {d && d.direction !== 'same' && (
                          <span className={`delta ${d.good ? 'good' : 'bad'}`}>{d.direction === 'up' ? '▲' : '▼'}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="player-columns">
        <GameLogList player={player} data={data} />
        <NextGame player={player} data={data} timeZone={timeZone} />
      </div>
    </div>
  )
}

function NextGame({ player, data, timeZone }: { player: Player; data: AppData; timeZone: string }) {
  const game = nextGames(data.schedule.games, 1)[0]
  if (!game) return null
  const opp = TEAMS_BY_ABBR[game.opponent]
  const { weekday, monthDay } = formatGameDate(game.startUtc, timeZone)
  const absence = absencesForGame(data.availability?.teams[TEAM.abbr], game).find((a) => a.name === player.name)
  return (
    <aside className="next-game">
      <h2>Next game</h2>
      <div className="next-matchup">
        <TeamLogo abbr={TEAM.abbr} size={44} />
        <span className="next-vs">{game.home ? 'vs' : '@'}</span>
        <TeamLogo abbr={game.opponent} size={44} />
      </div>
      <p className="next-opp">
        {opp.city} {opp.name}
      </p>
      <p className="muted">
        {weekday}, {monthDay} · {formatGameTime(game, timeZone)}
      </p>
      <Broadcasts game={game} />
      <p className={`next-status ${absence ? 'out' : ''}`}>
        {absence ? (
          <>
            <Icon name="injury" size={14} /> {absence.status}
            {absence.reason && ` · ${absence.reason}`}
          </>
        ) : (
          'Not on the injury report'
        )}
      </p>
    </aside>
  )
}

function GameLogList({ player, data }: { player: Player; data: AppData }) {
  const logs = useGameLogs()
  const entry = logs?.players[player.id]
  const hasCurrent = !!entry && entry.current.regular.length + entry.current.playoffs.length > 0
  const [which, setWhich] = useState<'current' | 'last' | undefined>()
  const [type, setType] = useState<TrackedGameType>('regular')
  // Default to this season once it has games; until then show last season.
  const season = which ?? (hasCurrent ? 'current' : 'last')
  const games = entry ? [...entry[season][type]].reverse() : []
  const hasPlayoffs = !!entry && entry[season].playoffs.length > 0

  return (
    <section className="game-log">
      <div className="game-log-head">
        <h2>Game log</h2>
        <div className="game-log-controls">
          <div className="segmented" role="group" aria-label="Season">
            <button aria-pressed={season === 'current'} onClick={() => setWhich('current')}>
              {data.players.season}
            </button>
            <button aria-pressed={season === 'last'} onClick={() => setWhich('last')}>
              {data.players.lastSeason}
            </button>
          </div>
          {hasPlayoffs && (
            <div className="segmented" role="group" aria-label="Games">
              <button aria-pressed={type === 'regular'} onClick={() => setType('regular')}>
                Regular
              </button>
              <button aria-pressed={type === 'playoffs'} onClick={() => setType('playoffs')}>
                Playoffs
              </button>
            </div>
          )}
        </div>
      </div>

      {!logs ? (
        <p className="muted">Loading games…</p>
      ) : games.length === 0 ? (
        <p className="muted">No games {season === 'current' ? `yet in ${data.players.season}` : `in ${data.players.lastSeason}`}.</p>
      ) : (
        <>
          <div className="log-row log-header" aria-hidden="true">
            <span>Date</span>
            <span>Match</span>
            <span>Result</span>
            <span className="log-extra">MIN</span>
            <span>PTS</span>
            <span>REB</span>
            <span>AST</span>
            <span className="log-extra">FG</span>
          </div>
          <ol className="log-list">
            {games.map((g) => (
              <LogRow key={`${g.date}-${g.opponent}`} game={g} />
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

function LogRow({ game: g }: { game: GameLogEntry }) {
  const date = new Date(`${g.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return (
    <li className="log-row">
      <span className="log-date">{date}</span>
      <span className="log-match">
        <span className="muted">{g.home ? 'vs' : '@'}</span>
        <TeamLogo abbr={g.opponent} size={22} />
        <span>{g.opponent}</span>
      </span>
      <span className={`log-result ${g.result === 'W' ? 'win' : 'loss'}`}>
        <b>{g.result}</b> {g.score}
      </span>
      <span className="log-extra">{Math.round(g.minutes)}</span>
      <span className="log-pts">{g.points}</span>
      <span>{g.rebounds}</span>
      <span>{g.assists}</span>
      <span className="log-extra">
        {g.fgMade}-{g.fgAttempted}
      </span>
    </li>
  )
}
