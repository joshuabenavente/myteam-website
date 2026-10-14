import { useState } from 'react'
import { absencesForGame, availabilityLabel, isGameTimeDecision, nextGames } from '../lib/availability.ts'
import { useGameLogs, type AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime } from '../lib/format.ts'
import { routeHref } from '../lib/route.ts'
import { useTeam } from '../lib/team.ts'
import { COLUMNS, change } from '../lib/stats.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { GameLogEntry, Player, StatTotals, TrackedGameType } from '../lib/types.ts'
import { Broadcasts } from './GameRow.tsx'
import { Icon } from './Icon.tsx'
import { RadarChart } from './RadarChart.tsx'
import { TeamLogo } from './TeamLogo.tsx'

// The hero's stat strip: a focused subset of the tracker's columns.
const STRIP = ['games', 'minutes', 'points', 'rebounds', 'assists', 'fgPct', 'threePct', 'ftPct']
const STRIP_COLUMNS = STRIP.map((k) => COLUMNS.find((c) => c.key === k)!)
// Phones show the five headline columns; these are in the tracker and game log.
const STRIP_PHONE_HIDDEN = ['games', 'minutes', 'ftPct']

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
      <div className="placeholder">
        <h1>Player not found</h1>
        <p>
          They may have left the roster. <a href={routeHref({ page: 'players' })}>Back to all players</a>
        </p>
      </div>
    )
  }
  return <PlayerView player={player} data={data} timeZone={timeZone} />
}

function PlayerView({ player, data, timeZone }: { player: Player; data: AppData; timeZone: string }) {
  const team = useTeam()
  const { season, lastSeason, teamGamesPlayed } = data.players
  const hasPlayoffs = !!(player.current.playoffs || player.lastFull.playoffs)
  const [type, setType] = useState<TrackedGameType>('regular')
  const [first, ...rest] = player.name.split(' ')
  const bio = player.bio ?? {}

  const rows: { label: string; short?: string; stats?: StatTotals; compareTo?: StatTotals }[] = [
    { label: season, stats: player.current[type], compareTo: player.lastToDate[type] ?? player.lastFull[type] },
    ...(teamGamesPlayed[type] > 0
      ? [
          {
            label: `${lastSeason} through ${teamGamesPlayed[type]} games`,
            short: `Same pt (${teamGamesPlayed[type]} g)`,
            stats: player.lastToDate[type],
          },
        ]
      : []),
    { label: lastSeason, stats: player.lastFull[type] },
  ]

  return (
    <div className="player-page">
      <a className="back-link" href={routeHref({ page: 'players' })}>
        <Icon name="prev" size={16} /> All players
      </a>

      <section className="player-hero" aria-label={player.name}>
        <div className="hero-backdrop" aria-hidden="true">
          {player.number && <span className="hero-number">{player.number}</span>}
          <span className="hero-wordmark">{team.name.toUpperCase()}</span>
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
            <TeamLogo abbr={team.abbr} size={28} background="dark" />
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

        <div className="hero-strip" tabIndex={0} role="region" aria-label="Season stats">
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
                  <th key={c.key} scope="col" title={c.title} className={STRIP_PHONE_HIDDEN.includes(c.key) ? 'strip-extra' : undefined}>
                    {c.key === 'games' ? 'GP' : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">
                    {r.short ? (
                      <>
                        <span className="label-full">{r.label}</span>
                        <span className="label-short">{r.short}</span>
                      </>
                    ) : (
                      r.label
                    )}
                  </th>
                  {STRIP_COLUMNS.map((c) => {
                    const v = r.stats && c.value(r.stats, 'perGame')
                    const before = r.compareTo && c.value(r.compareTo, 'perGame')
                    const d = v !== undefined && before !== undefined && !c.noChange ? change(c, v, before, 'perGame') : undefined
                    return (
                      <td key={c.key} className={STRIP_PHONE_HIDDEN.includes(c.key) ? 'strip-extra' : undefined}>
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

      {/* Side column first so reading order matches the phone layout; CSS places it right on desktop. */}
      <div className="player-columns">
        <div className="player-side">
          <Overview player={player} data={data} type={type} />
          <NextGame player={player} data={data} timeZone={timeZone} />
        </div>
        <GameLogList player={player} data={data} type={type} setType={setType} />
      </div>
    </div>
  )
}

/** Radar of key stats: this season over last season (or last season alone before games). */
function Overview({ player, data, type }: { player: Player; data: AppData; type: TrackedGameType }) {
  const { season, lastSeason, teamGamesPlayed } = data.players
  const current = player.current[type]
  const sameSpot = teamGamesPlayed[type] > 0 ? player.lastToDate[type] : undefined
  const comparison = sameSpot
    ? { label: `${lastSeason} at this point`, stats: sameSpot }
    : player.lastFull[type] && { label: lastSeason, stats: player.lastFull[type] }
  const primary = current ? { label: season, stats: current } : comparison
  if (!primary) return null
  return (
    <aside className="overview">
      <h2>At a glance{type === 'playoffs' && ' · playoffs'}</h2>
      <RadarChart primary={primary} comparison={current ? comparison : undefined} />
    </aside>
  )
}

function NextGame({ player, data, timeZone }: { player: Player; data: AppData; timeZone: string }) {
  const team = useTeam()
  const game = nextGames(data.schedule.games, 1)[0]
  if (!game) return null
  const opp = TEAMS_BY_ABBR[game.opponent]
  const { weekday, monthDay } = formatGameDate(game.startUtc, timeZone)
  const absence = absencesForGame(data.availability?.teams[team.abbr], game).find((a) => a.name === player.name)
  return (
    <aside className="next-game">
      <h2>Next game</h2>
      <div className="next-matchup">
        <TeamLogo abbr={team.abbr} size={44} />
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
            <Icon name="injury" size={14} /> {availabilityLabel(absence)}
            {isGameTimeDecision(absence) && ' · game-time decision'}
            {absence.reason && ` · ${absence.reason}`}
          </>
        ) : (
          'Not on the injury report'
        )}
      </p>
    </aside>
  )
}

/** Games shown before "Show all", newest first. */
const LOG_PREVIEW = 10

function GameLogList(props: {
  player: Player
  data: AppData
  /** Shared with the stat strip's Regular/Playoffs switch. */
  type: TrackedGameType
  setType: (t: TrackedGameType) => void
}) {
  const { player, data, type, setType } = props
  const team = useTeam()
  const logs = useGameLogs(team.abbr)
  const entry = logs?.players[player.id]
  const hasCurrent = !!entry && entry.current.regular.length + entry.current.playoffs.length > 0
  const [which, setWhich] = useState<'current' | 'last' | undefined>()
  const [showAll, setShowAll] = useState(false)
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
        <table className="log-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Match</th>
              <th scope="col">Result</th>
              <th scope="col" className="log-extra">
                MIN
              </th>
              <th scope="col">PTS</th>
              <th scope="col">REB</th>
              <th scope="col">AST</th>
              <th scope="col" className="log-extra">
                FG
              </th>
            </tr>
          </thead>
          <tbody>
            {(showAll ? games : games.slice(0, LOG_PREVIEW)).map((g) => (
              <LogRow key={`${g.date}-${g.opponent}`} game={g} />
            ))}
          </tbody>
        </table>
      )}
      {games.length > LOG_PREVIEW && (
        <button className="text-button show-all" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
          {showAll ? `Show the last ${LOG_PREVIEW} only` : `Show all ${games.length} games`}
        </button>
      )}
    </section>
  )
}

function LogRow({ game: g }: { game: GameLogEntry }) {
  const date = new Date(`${g.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  // "131-137 (OT)" -> score plus a compact overtime badge.
  const [, score = g.score, overtime] = g.score.match(/^(\S+)(?:\s*\((\d*OT)\))?/) ?? []
  return (
    <tr>
      <td className="log-date">{date}</td>
      <td>
        <span className="log-match">
          <span className="muted">{g.home ? 'vs' : '@'}</span>
          <TeamLogo abbr={g.opponent} size={22} />
          <span>{g.opponent}</span>
        </span>
      </td>
      <td className={`log-result ${g.result === 'W' ? 'win' : 'loss'}`}>
        <b>{g.result}</b> {score}
        {overtime && <span className="ot-badge">{overtime}</span>}
      </td>
      <td className="log-extra">{Math.round(g.minutes)}</td>
      <td className="log-pts">{g.points}</td>
      <td>{g.rebounds}</td>
      <td>{g.assists}</td>
      <td className="log-extra">
        {g.fgMade}-{g.fgAttempted}
      </td>
    </tr>
  )
}
