import { useRef, useState, type CSSProperties } from 'react'
import type { AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime, timeZoneAbbr } from '../lib/format.ts'
import { nextGames } from '../lib/availability.ts'
import { chipStatus, countdownLabel, daysUntil, headlineChannel, headlineGame, listedFor, shortName } from '../lib/hero.ts'
import { liveFor, useLive } from '../lib/live.ts'
import { nameKey } from '../lib/names.ts'
import { routeHref, type Route } from '../lib/route.ts'
import { useTeam } from '../lib/team.ts'
import { dotColor, teamTheme } from '../lib/teamColors.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { Absence } from '../lib/types.ts'
import { HeaderTop } from './HeaderTop.tsx'
import { LiveAnnouncer, LivePill } from './LivePill.tsx'
import { MiniBar } from './MiniBar.tsx'

/** Injury chips per team; the rest are behind "+N more". */
const CHIPS_PER_TEAM = 2

interface Props {
  route: Route
  data?: AppData
  timeZone: string
  /** Open a game's details in the list below (for "+N more"). */
  onShowGame: (id: string) => void
}

/** The team-colored header: logo, season and team pills, page switcher, and on the Games page the countdown and next games. */
export function SiteHeader({ route, data, timeZone, onShowGame }: Props) {
  const team = useTeam()
  const full = route.page === 'games' && !!data
  const roster = route.page === 'players' && !!data
  const headerRef = useRef<HTMLElement>(null)
  return (
    <>
      <header
        ref={headerRef}
        className={`site-header cards ${full ? 'full' : roster ? 'page' : 'compact'}`}
      >
        <div className="header-inner">
          <HeaderTop
            team={team}
            current={route.page === 'games' || route.page === 'game' ? 'games' : route.page === 'players' || route.page === 'player' ? 'players' : undefined}
          />

          {/* The Games page's heading sits here so it comes before the next game's. */}
          {route.page === 'games' && <h1 className="sr-only">Games</h1>}
          {full && <NextGame data={data} timeZone={timeZone} onShowGame={onShowGame} />}
          {roster && <RosterIntro data={data} />}

        </div>
      </header>
      <MiniBar headerRef={headerRef} route={route} data={data} timeZone={timeZone} />
    </>
  )
}

function NextGame({ data, timeZone, onShowGame }: { data: AppData; timeZone: string; onShowGame: (id: string) => void }) {
  // The countdown is as of page load, like the rest of the data.
  const [now] = useState(() => new Date())
  const team = useTeam()
  const watch = useLive()
  const game = headlineGame(data.schedule.games)
  if (!game) {
    const played = data.schedule.games.some((g) => g.status === 'final')
    return (
      <section className="cards-hero" aria-labelledby="hero-game-heading">
        <div className="countdown">
          <h2 id="hero-game-heading" className="eyebrow">
            {played ? 'Season complete' : 'Schedule'}
          </h2>
          <p className="countdown-number word">{played ? 'See you next season' : 'Coming soon'}</p>
        </div>
      </section>
    )
  }

  const opp = TEAMS_BY_ABBR[game.opponent]
  const { weekday, monthDay } = formatGameDate(game.startUtc, timeZone)
  // In ?live= test mode the watched game isn't on the schedule; show its pill alongside.
  const testLive = watch && !watch.gameId ? watch : undefined
  const score = liveFor(watch, game.id)
  const started =
    game.status === 'live' || (watch?.gameId === game.id && (watch.checkedAt ?? 0) >= Date.parse(game.startUtc))
  // The live pill takes the countdown's place once the game is on (or over, until the next data update).
  const showPill = !!score && score.state !== 'pre' ? true : started
  const live = score ? score.state === 'in' || score.state === 'delayed' : started
  const channel = headlineChannel(game)
  // Once the game is on (or just finished) the score matters, not who's out; drop the injury chips.
  const listed = showPill ? {} : (data.availability?.teams ?? {})
  const ours = listedFor(listed[team.abbr], game)
  const theirs = listedFor(listed[game.opponent], game)
  // The team's own chips link to the player's page.
  const rosterIds = new Map(data.players.players.map((p) => [nameKey(p.name), p.id]))
  const hidden = Math.max(0, ours.length - CHIPS_PER_TEAM) + Math.max(0, theirs.length - CHIPS_PER_TEAM)

  const injuryChips = (
    <>
            {ours.slice(0, CHIPS_PER_TEAM).map((a) => (
              <InjuryChip key={a.name} abbr={team.abbr} followed={team.abbr} absence={a} playerId={rosterIds.get(nameKey(a.name))} />
            ))}
            {theirs.slice(0, CHIPS_PER_TEAM).map((a) => (
              <InjuryChip key={a.name} abbr={game.opponent} followed={team.abbr} absence={a} />
            ))}
            {hidden > 0 && (
              <li>
                <button className="hero-chip outline more" onClick={() => onShowGame(game.id)}>
                  +{hidden} more<span className="sr-only"> listed out or day-to-day: open the injury report</span>
                </button>
              </li>
            )}
    </>
  )

  const us = data.standings.teams[team.abbr]
  const opener = !!us && us.wins + us.losses === 0 && game.type === 'regular'
  const days = daysUntil(game, now, timeZone)
  const upcoming = nextGames(data.schedule.games, 3)
  return (
    <section className="cards-hero" aria-labelledby="hero-game-heading">
      <div className="countdown">
        <h2 id="hero-game-heading" className="eyebrow">
          {live ? 'Live now' : score?.state === 'final' ? 'Final' : opener ? `${data.schedule.season} season tips off in` : 'Next game in'}
          {game.type === 'playoffs' && ' · Playoffs'}
        </h2>
        <div className="countdown-row">
          {/* Once the game is on, the live pill below takes over from the countdown. */}
          {!showPill && (
            <span className={`countdown-number ${days > 0 ? '' : 'word'}`}>
              {days > 0 ? days : countdownLabel(game, now, timeZone)}
            </span>
          )}
          <div className="countdown-info">
            {days > 0 && !showPill && <span className="countdown-unit">{days === 1 ? 'day' : 'days'}</span>}
            <span>
              {weekday}, {monthDay}
            </span>
            <a className="countdown-opp" href={routeHref({ page: 'game', id: game.id })}>
              {game.home ? 'vs' : 'at'} {opp.city}
              {game.neutralSite && ` · in ${game.neutralSite}`}
            </a>
            {game.label && game.type === 'playoffs' && <span>{game.label}</span>}
            <span className="countdown-muted">
              {game.timeTbd ? 'Time TBD' : `${formatGameTime(game, timeZone)} ${timeZoneAbbr(timeZone, new Date(game.startUtc))}`}
              {channel && ` · ${channel.label}`}
            </span>
          </div>
        </div>
        <ul className="hero-chips" aria-label="About this game">
          {testLive && <LivePill live={testLive} started href={routeHref({ page: 'game', id: 'live' })} />}
          {showPill && watch && (
            <LivePill live={watch} started={started} href={routeHref({ page: 'game', id: game.id })} />
          )}
          {injuryChips}
        </ul>
        <LiveAnnouncer score={testLive?.score ?? score} />
      </div>

      {upcoming.length > 0 && (
        <div className="next-up">
          <h2 className="eyebrow">Next up</h2>
          <ul className="up-cards">
            {upcoming.map((g, i) => {
              const d = formatGameDate(g.startUtc, timeZone)
              const ch = headlineChannel(g)
              return (
                <li key={g.id} className={g.id === game.id ? 'up-same' : undefined}>
                  <a className={`up-card ${i === 0 ? 'first' : ''}`} href={routeHref({ page: 'game', id: g.id })}>
                    <span className="up-date">
                      {d.weekday} {d.monthDay}
                    </span>
                    <span className="up-matchup">
                      {g.home ? 'vs' : '@'} {g.opponent}
                    </span>
                    <span className="up-meta">
                      {g.timeTbd ? 'Time TBD' : formatGameTime(g, timeZone)}
                      {ch && ` · ${ch.label}`}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

function InjuryChip(props: { abbr: string; followed: string; absence: Absence; playerId?: string }) {
  const { abbr, followed, absence, playerId } = props
  // A neutral chip with a dot in the team's color, so no team's colors sit on another's header.
  // The same rule as the logo's dot: a team color that shows on this header.
  const dot = dotColor(abbr, teamTheme(followed).dark)
  const team = TEAMS_BY_ABBR[abbr]
  const text = (
    <>
      <span className="chip-dot" aria-hidden="true" />
      <span className="sr-only">{team.name}: </span>
      {shortName(absence.name)} {chipStatus(absence)}
    </>
  )
  return (
    <li
      className="hero-chip team"
      style={{ '--chip-fill': dot } as CSSProperties}
    >
      {playerId ? (
        <a className="hero-chip-link" href={routeHref({ page: 'player', id: playerId })}>
          {text}
        </a>
      ) : (
        text
      )}
    </li>
  )
}

function RosterIntro({ data }: { data: AppData }) {
  const { players, season } = data.players
  const twoWay = players.filter((p) => p.twoWay).length
  return (
    <section className="hero-page">
      <p className="eyebrow">Players</p>
      <h1>
        Roster{' '}
        <span className="roster-season">
          <span className="roster-sep" aria-hidden="true">
            ·{' '}
          </span>
          {season}
        </span>
      </h1>
      <ul className="hero-chips" aria-label="Roster">
        {players.length > 0 && <li className="hero-chip soft">{players.length} players</li>}
        {twoWay > 0 && <li className="hero-chip outline">{twoWay} on two-way contracts</li>}
      </ul>
    </section>
  )
}
