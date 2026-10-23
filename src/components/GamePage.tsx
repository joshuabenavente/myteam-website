import { useState, type CSSProperties } from 'react'
import { absencesForGame, availabilityLabel } from '../lib/availability.ts'
import { usePlayersFile, type AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime, formatRecord, formatUpdated } from '../lib/format.ts'
import {
  BOX_COLUMNS,
  periodLabel,
  playsByPeriod,
  type BoxPlayer,
  type GameSummary,
  type InjuryListing,
  type Play,
  type TeamSide,
} from '../lib/gameSummary.ts'
import { staleMinutes, type LiveScore } from '../lib/live.ts'
import { idsByName, nameKey } from '../lib/names.ts'
import { routeHref } from '../lib/route.ts'
import { matchupColors } from '../lib/teamColors.ts'
import { TEAMS_BY_ABBR, teamSlug } from '../lib/teams.ts'
import type { Game } from '../lib/types.ts'
import { useTeam } from '../lib/team.ts'
import { useGameSummary } from '../lib/useGameSummary.ts'
import { Broadcasts, GameDetails } from './GameRow.tsx'
import { Icon } from './Icon.tsx'
import { InjuryChip } from './InjuryChip.tsx'
import { LiveAnnouncer } from './LivePill.tsx'
import { TeamLogo } from './TeamLogo.tsx'

interface Props {
  /** NBA game ID, or "live" for the ?live= test team's game today. */
  id: string
  data: AppData
  timeZone: string
  /** The ?live= test team, if any. */
  testTeam?: string
}

/** A game's score, box scores, injuries and play-by-play, live from ESPN. */
export function GamePage({ id, data, timeZone, testTeam }: Props) {
  const game = id === 'live' ? undefined : data.schedule.games.find((g) => g.id === id)
  const current = useTeam()
  const team = id === 'live' ? testTeam : game ? current.abbr : undefined
  if (!team) {
    return (
      <div className="game-page">
        <BackLink />
        <h1>Game not found</h1>
        <p className="muted">It may have been taken off the schedule.</p>
      </div>
    )
  }
  return <GameView key={id} team={team} game={game} data={data} timeZone={timeZone} />
}

function BackLink() {
  return (
    <a className="back-link" href={routeHref({ page: 'games' })}>
      <Icon name="prev" size={16} /> All games
    </a>
  )
}

/** The injury panel's color, for choosing a dot that shows on it (see .sb-injuries in App.css). */
const PANEL = '#0f1626'

function GameView({ team, game, data, timeZone }: { team: string; game?: Game; data: AppData; timeZone: string }) {
  const status = useGameSummary(team, game?.startUtc)
  const s = status.summary
  // The followed team is always on the left.
  const left = s ? (s.home.abbr === team ? s.home : s.away) : undefined
  const right = s ? (s.home.abbr === team ? s.away : s.home) : undefined
  const opponent = right?.abbr ?? game?.opponent
  // The other team's players, so its names link to their profiles too.
  const opponentPlayers = usePlayersFile(opponent)
  const leftHome = s ? s.home.abbr === team : !!game?.home
  const stale = staleMinutes(status)
  const started = !!s && s.state !== 'pre' && s.state !== 'postponed'

  if (!opponent) {
    return (
      <div className="game-page">
        <BackLink />
        <h1>{status.notFound ? `No ${team} game today` : 'Loading…'}</h1>
        <GameRefreshStatus failed={status.failed} stale={stale !== undefined} />
      </div>
    )
  }

  const [lc, rc] = matchupColors(team, opponent)
  const style = {
    '--left-fill': lc.fill,
    '--left-text': lc.text,
    '--right-fill': rc.fill,
    '--right-text': rc.text,
  } as CSSProperties
  const oppTeam = TEAMS_BY_ABBR[opponent]

  const rosterIds = idsByName(data.players.players)
  const opponentIds = idsByName(opponentPlayers?.players ?? [])
  const opponentSlug = opponent ? teamSlug(TEAMS_BY_ABBR[opponent]) : undefined

  // Before ESPN answers (or if it can't), fall back to the schedule's injury report.
  const injuriesFor = (abbr: string, side?: TeamSide): InjuryListing[] =>
    (side?.injuries?.length ? side.injuries : undefined) ??
    (game
      ? absencesForGame(data.availability?.teams[abbr], game).map((a) => ({
          name: a.name,
          status: availabilityLabel(a),
          ...(a.reason && { detail: a.reason }),
        }))
      : [])

  // Where the injury lists come from: ESPN's live game report once it has one, otherwise the
  // site's own report, with when it last changed.
  const fromEspn = !!(left?.injuries?.length || right?.injuries?.length)
  const anyListed = injuriesFor(team, left).length + injuriesFor(opponent, right).length > 0
  const injuryNote = !anyListed
    ? undefined
    : fromEspn
      ? 'Injury report from ESPN'
      : data.availability && `Injury report updated ${formatUpdated(data.availability.updatedAt)}`

  return (
    <div className="game-page" style={style}>
      <BackLink />
      <h1 className="sr-only">
        {TEAMS_BY_ABBR[team].name} {leftHome ? 'vs' : 'at'} {oppTeam.name}
      </h1>

      <section className="scoreboard" aria-label="Score">
        <TeamHalf
          side="left"
          abbr={team}
          score={left?.score}
          record={recordFor(team, data)}
          where={game?.neutralSite ? `in ${game.neutralSite}` : leftHome ? 'Home' : 'Away'}
          light={lc.text !== '#ffffff'}
          started={started}
        />
        <div className="sb-center">
          <Status summary={s} game={game} timeZone={timeZone} />
          {s && s.home.periods.length > 0 && <LineScore left={left!} right={right!} />}
        </div>
        <TeamHalf
          side="right"
          abbr={opponent}
          score={right?.score}
          record={recordFor(opponent, data)}
          where={game?.neutralSite ? 'Neutral site' : leftHome ? 'Away' : 'Home'}
          light={rc.text !== '#ffffff'}
          started={started}
        />
        <Injuries side="left" abbr={team} team={TEAMS_BY_ABBR[team]?.name ?? team} list={injuriesFor(team, left)} rosterIds={rosterIds} />
        <Injuries side="right" abbr={opponent} team={oppTeam?.name ?? opponent} list={injuriesFor(opponent, right)} rosterIds={opponentIds} teamSlug={opponentSlug} />
      </section>

      {injuryNote && <p className="injury-updated muted small">{injuryNote}</p>}
      {s && <LiveAnnouncer score={announceable(s)} />}
      <GameRefreshStatus failed={status.failed} stale={stale !== undefined} />
      <p className="game-updated muted small" aria-live="off">
        {status.failed && !s
          ? "Couldn't reach ESPN for this game. It will keep trying."
          : stale !== undefined
            ? `Couldn't refresh · last updated ${stale} min ago`
            : status.updatedAt && s?.state === 'in'
              ? 'Updates every 20 seconds'
              : ''}
      </p>

      {started && left && right && <BoxScores left={left} right={right} ids={rosterIds} opponentIds={opponentIds} opponentSlug={opponentSlug} />}
      {started && s && s.plays.length > 0 && <PlayByPlay summary={s} left={left!} right={right!} />}
      {/* Before tip-off: the same channels and details as the game's row in the list (NBA-04). */}
      {game && !started && (
        <section className="game-page-details" aria-label="About this game">
          <Broadcasts game={game} />
          <GameDetails game={game} data={data} onGamePage />
        </section>
      )}
      {s && !started && s.state !== 'postponed' && (
        <p className="placeholder">Box scores and play-by-play start at tip-off.</p>
      )}
    </div>
  )
}

/** The wording stays stable through repeated failed polls and changing stale-minute counts. */
function GameRefreshStatus({ failed, stale }: { failed: boolean; stale: boolean }) {
  const message = stale
    ? 'Game details may be stale. Trying to refresh.'
    : failed ? 'Could not refresh game details. Trying again.' : ''
  return <span className="sr-only" role="status">{message}</span>
}

/** This season's record from our standings, once there is one. ESPN's counts preseason games. */
function recordFor(abbr: string, data: AppData): string | undefined {
  const t = data.standings.teams[abbr]
  return t && t.wins + t.losses > 0 ? formatRecord(t) : undefined
}

/** The milestone announcer only needs the score and state, shaped like the live pill's. */
const announceable = (s: GameSummary): LiveScore => ({
  state: s.state,
  detail: s.detail,
  milestone: s.milestone,
  away: { abbr: s.away.abbr, score: s.away.score },
  home: { abbr: s.home.abbr, score: s.home.score },
})

function TeamHalf(props: {
  side: 'left' | 'right'
  abbr: string
  score?: number
  record?: string
  where: string
  light: boolean
  started: boolean
}) {
  const { side, abbr, score, record, where, light, started } = props
  const t = TEAMS_BY_ABBR[abbr]
  return (
    <div className={`sb-team ${side}`}>
      <TeamLogo abbr={abbr} size={64} background={light ? 'light' : 'dark'} />
      <div className="sb-name">
        <span className="sb-city">{t.city}</span>
        <span className="sb-nick">{t.name}</span>
        <span className="sb-meta">
          {where}
          {record && ` · ${record}`}
        </span>
      </div>
      {started && score !== undefined && (
        <span className="sb-score" aria-label={`${t.name} ${score}`}>
          {score}
        </span>
      )}
    </div>
  )
}

function Status({ summary, game, timeZone }: { summary?: GameSummary; game?: Game; timeZone: string }) {
  if (summary?.state === 'in' || summary?.state === 'delayed') {
    return (
      <div className="sb-status">
        <span className="live-pill small">
          <span className="live-dot" aria-hidden="true" />
          {summary.state === 'delayed' ? 'Delayed' : 'Live'}
        </span>
        <span className="sb-clock">{summary.detail}</span>
      </div>
    )
  }
  if (summary?.state === 'final' || summary?.state === 'postponed') {
    return (
      <div className="sb-status">
        <span className="sb-clock">{summary.detail}</span>
      </div>
    )
  }
  const start = game?.startUtc ?? summary?.startUtc
  if (!start) return null
  const { weekday, monthDay } = formatGameDate(start, timeZone)
  return (
    <div className="sb-status">
      <span className="sb-when">
        {weekday}, {monthDay}
      </span>
      <span className="sb-clock">{game ? formatGameTime(game, timeZone) : 'Today'}</span>
    </div>
  )
}

function LineScore({ left, right }: { left: TeamSide; right: TeamSide }) {
  const periods = Math.max(left.periods.length, right.periods.length)
  const head = Array.from({ length: periods }, (_, i) => (i < 4 ? String(i + 1) : i === 4 ? 'OT' : `${i - 3}OT`))
  return (
    <table className="line-score">
      <caption className="sr-only">Points by quarter</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="sr-only">Team</span>
          </th>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
          <th scope="col">T</th>
        </tr>
      </thead>
      <tbody>
        {[left, right].map((t) => (
          <tr key={t.abbr}>
            <th scope="row">{t.abbr}</th>
            {head.map((h, i) => (
              <td key={h}>{t.periods[i] ?? ''}</td>
            ))}
            <td className="line-total">{t.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Pills like the team page's, on the dark panel; the followed team's link to the player's page. */
function Injuries(props: { side: 'left' | 'right'; abbr: string; team: string; list: InjuryListing[]; rosterIds?: Map<string, string>; teamSlug?: string }) {
  const { side, abbr, team, list, rosterIds, teamSlug: slug } = props
  if (list.length === 0) return <div className={`sb-injuries ${side} empty`} />
  return (
    <div className={`sb-injuries ${side}`}>
      <h2>{team} injury report</h2>
      <ul className="hero-chips" aria-label={`${team} injury report`}>
        {list.map((i) => (
          <InjuryChip key={i.name} abbr={abbr} background={PANEL} name={i.name} status={i.status} detail={i.detail} playerId={rosterIds?.get(nameKey(i.name))} teamSlug={slug} />
        ))}
      </ul>
    </div>
  )
}

/** `ids`: the followed team's players by name; `opponentIds`: the other team's, whose pages live under its own address. */
function BoxScores(props: { left: TeamSide; right: TeamSide; ids: Map<string, string>; opponentIds: Map<string, string>; opponentSlug?: string }) {
  const { left, right, ids, opponentIds, opponentSlug } = props
  const [shown, setShown] = useState<'left' | 'right'>('left')
  return (
    <section className="box-scores" aria-labelledby="box-heading">
      <div className="section-head">
        <h2 id="box-heading">Box score</h2>
        {/* On phones one team at a time; on wider screens both are shown and this is hidden. */}
        <div className="segmented box-switch" role="group" aria-label="Team">
          {(['left', 'right'] as const).map((k) => (
            <button key={k} aria-pressed={shown === k} onClick={() => setShown(k)}>
              {TEAMS_BY_ABBR[(k === 'left' ? left : right).abbr].name}
            </button>
          ))}
        </div>
      </div>
      <BoxTable side={left} position="left" hiddenOnPhone={shown !== 'left'} ids={ids} />
      <BoxTable side={right} position="right" hiddenOnPhone={shown !== 'right'} ids={opponentIds} slug={opponentSlug} />
    </section>
  )
}

function BoxTable(props: { side: TeamSide; position: 'left' | 'right'; hiddenOnPhone: boolean; ids?: Map<string, string>; slug?: string }) {
  const { side, position, hiddenOnPhone, ids, slug } = props
  const t = TEAMS_BY_ABBR[side.abbr]
  const starters = side.players.filter((p) => p.starter)
  const bench = side.players.filter((p) => !p.starter)
  const name = (p: BoxPlayer) => {
    const id = ids?.get(nameKey(p.name))
    const label = (
      <>
        <span className="box-full">{p.name}</span>
        <span className="box-short" aria-hidden="true">
          {p.shortName}
        </span>
      </>
    )
    return id ? <a href={routeHref({ page: 'player', id }, slug)}>{label}</a> : label
  }
  const row = (p: BoxPlayer) => (
    <tr key={p.id}>
      <th scope="row" className="box-player">
        {name(p)}
        {p.position && p.position !== 'NA' && <span className="muted small box-pos"> {p.position}</span>}
      </th>
      {BOX_COLUMNS.map((c) => (
        <td key={c} className={c === 'PTS' ? 'box-pts' : undefined}>
          {p.stats[c] ?? ''}
        </td>
      ))}
    </tr>
  )
  const group = (label: string, list: BoxPlayer[]) =>
    list.length > 0 && (
      <tbody>
        <tr className="box-group">
          <th scope="rowgroup" colSpan={BOX_COLUMNS.length + 1}>
            {label}
          </th>
        </tr>
        {list.map(row)}
      </tbody>
    )
  return (
    <div className={`box-team ${position} ${hiddenOnPhone ? 'phone-hidden' : ''}`}>
      <h3 className="box-title">
        <TeamLogo abbr={side.abbr} size={22} /> {t.city} {t.name}
      </h3>
      <div className="table-scroll">
        <table className="box-table">
          <thead>
            <tr>
              <th scope="col">Player</th>
              {BOX_COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          {group('Starters', starters)}
          {group('Bench', bench)}
          <tbody>
            <tr className="box-totals">
              <th scope="row">Team</th>
              {BOX_COLUMNS.map((c) => (
                <td key={c}>{side.totals[c] ?? ''}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {side.didNotPlay.length > 0 && (
        <p className="box-dnp muted small">
          <strong>Did not play:</strong>{' '}
          {side.didNotPlay.map((p) => `${p.name}${p.reason ? ` (${p.reason.toLowerCase()})` : ''}`).join(', ')}
        </p>
      )}
    </div>
  )
}

type PlayFilter = 'all' | 'scoring' | 'team'

function PlayByPlay({ summary, left, right }: { summary: GameSummary; left: TeamSide; right: TeamSide }) {
  const [filter, setFilter] = useState<PlayFilter>('all')
  const keep = (p: Play) => (filter === 'scoring' ? p.scoring : filter === 'team' ? p.team === left.abbr : true)
  const groups = playsByPeriod(summary.plays)
    .map(([period, plays]) => [period, plays.filter(keep)] as const)
    .filter(([, plays]) => plays.length > 0)
  const leftIsHome = summary.home.abbr === left.abbr
  const score = (p: Play) => (leftIsHome ? `${p.homeScore}–${p.awayScore}` : `${p.awayScore}–${p.homeScore}`)
  return (
    <section className="plays" aria-labelledby="plays-heading">
      <div className="section-head">
        <h2 id="plays-heading">Play-by-play</h2>
        <div className="segmented" role="group" aria-label="Show">
          {(
            [
              ['all', 'All plays'],
              ['scoring', 'Scoring'],
              ['team', `${TEAMS_BY_ABBR[left.abbr].name} only`],
            ] as const
          ).map(([k, label]) => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {groups.map(([period, plays], i) => (
        <details key={period} className="play-period" open={i === 0}>
          <summary>
            {periodLabel(period)} <span className="muted small">· {plays.length} plays</span>
          </summary>
          <ol className="play-list">
            {plays.map((p) => (
              <li key={p.id} className={`${p.scoring ? 'scoring' : ''} ${p.team === left.abbr ? 'left' : p.team === right.abbr ? 'right' : ''}`}>
                <span className="play-clock">{p.clock}</span>
                <span className="play-dot" aria-hidden="true" />
                <span className="play-text">
                  {p.team && <span className="sr-only">{TEAMS_BY_ABBR[p.team]?.name}: </span>}
                  {p.text}
                </span>
                {p.scoring && <span className="play-score">{score(p)}</span>}
              </li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  )
}
