import { useRef, useState } from 'react'
import type { AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime, timeZoneAbbr } from '../lib/format.ts'
import { nextGames } from '../lib/availability.ts'
import { countdownEyebrow, countdownLabel, daysUntil, headlineChannel, headlineGame, lastResult, listedFor } from '../lib/hero.ts'
import { liveFor, useLive } from '../lib/live.ts'
import { matchupTags } from '../lib/tags.ts'
import { nameKey } from '../lib/names.ts'
import { routeHref, type Route } from '../lib/route.ts'
import { seasonForDate } from '../lib/season.ts'
import { useTeam } from '../lib/team.ts'
import { teamTheme } from '../lib/teamColors.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import { BrandIcon, Wordmark } from './Brand.tsx'
import { InjuryChip } from './InjuryChip.tsx'
import { Icon } from './Icon.tsx'
import { LiveAnnouncer, LivePill } from './LivePill.tsx'
import { MiniBar } from './MiniBar.tsx'
import { TeamLogo } from './TeamLogo.tsx'
import { GradientControls } from './GradientControls.tsx'

/** Injury chips per team; the rest are behind "+N more". */
const CHIPS_PER_TEAM = 2

/**
 * Injury pills in the team page header. Off since October 2026: each game's injury report is in
 * its row on the team page and on its game page. Set to true to bring the pills back (the header
 * and its loading placeholder follow).
 */
const SHOW_HEADER_INJURIES = false

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
  // The Games page header keeps its full size while the data loads, so nothing jumps when it arrives.
  const full = route.page === 'games'
  const roster = route.page === 'players'
  const headerRef = useRef<HTMLElement>(null)
  const nav = (
    <nav className="page-nav" aria-label="Pages">
      <a
        href={routeHref({ page: 'games' })}
        aria-current={route.page === 'games' || route.page === 'game' ? 'page' : undefined}
      >
        <Icon name="games" /> Games
      </a>
      <a
        href={routeHref({ page: 'players' })}
        aria-current={route.page === 'players' || route.page === 'player' ? 'page' : undefined}
      >
        <Icon name="players" /> Players
      </a>
    </nav>
  )
  return (
    <>
      <header
        ref={headerRef}
        data-team={team.abbr}
        className={`site-header cards ${full || roster ? 'team-atmosphere ' : ''}${full ? 'full' : roster ? 'page' : 'compact'}`}
      >
        {(full || roster) && (
          <div className="header-atmosphere" aria-hidden="true">
            <span className="atmosphere-cloud cloud-main" />
            <span className="atmosphere-cloud cloud-light" />
            <span className="atmosphere-cloud cloud-accent" />
          </div>
        )}
        <div className="header-inner">
          <div className="header-top">
            <a className="brand" href={routeHref({ page: 'games' })}>
              {/* Icon and wordmark on wide screens; just the icon on phones. */}
              <BrandIcon size={36} glass className="brand-narrow" />
              <Wordmark height={30} className="brand-wide" decorative />
              <span className="sr-only">myteam.fans, {team.fullName} home</span>
            </a>
            <div className="header-actions">
              <a className={`team-pill ${team.fullName.length > 18 ? 'long' : ''}`} href={routeHref({ page: 'picker' })}>
                <TeamLogo abbr={team.abbr} size={28} background="dark" />
                <span className="team-pill-name">
                  <span className="team-pill-city">{team.city} </span>
                  {team.name}
                </span>
                <Icon name="switch" size={16} />
                <span className="sr-only">, switch team</span>
              </a>
            </div>
            {nav}
          </div>

          {/* The Games page's heading sits here so it comes before the next game's. */}
          {route.page === 'games' && <h1 className="sr-only">Games</h1>}
          {full && (data ? <NextGame data={data} timeZone={timeZone} onShowGame={onShowGame} /> : <NextGameLoading />)}
          {roster && <RosterIntro data={data} />}

        </div>
      </header>
      {(full || roster) && new URLSearchParams(window.location.search).get('tune') === '1' && (
        <GradientControls headerRef={headerRef} team={team.abbr} color={team.theme.mid} accent={team.theme.accent} />
      )}
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
  const listed = showPill || !SHOW_HEADER_INJURIES ? {} : (data.availability?.teams ?? {})
  const ours = listedFor(listed[team.abbr], game)
  const theirs = listedFor(listed[game.opponent], game)
  // The team's own chips link to the player's page.
  const rosterIds = new Map(data.players.players.map((p) => [nameKey(p.name), p.id]))
  const hidden = Math.max(0, ours.length - CHIPS_PER_TEAM) + Math.max(0, theirs.length - CHIPS_PER_TEAM)

  // Facts about the game (src/lib/tags.ts): shown before tip-off, like the injury pills were.
  const tags = showPill ? [] : matchupTags({ game, team: team.abbr, data, now: now.getTime() })

  const injuryChips = (
    <>
            {ours.slice(0, CHIPS_PER_TEAM).map((a) => (
              <InjuryChip key={a.name} abbr={team.abbr} background={teamTheme(team.abbr).dark} name={a.name} status={a.status} playerId={rosterIds.get(nameKey(a.name))} />
            ))}
            {theirs.slice(0, CHIPS_PER_TEAM).map((a) => (
              <InjuryChip key={a.name} abbr={game.opponent} background={teamTheme(team.abbr).dark} name={a.name} status={a.status} />
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
  const last = lastResult(data.schedule.games)
  return (
    <section className="cards-hero" aria-labelledby="hero-game-heading">
      <div className="countdown">
        <h2 id="hero-game-heading" className="eyebrow">
          {live ? 'Live now' : score?.state === 'final' ? 'Final' : countdownEyebrow({ season: data.schedule.season, opener, days })}
          {game.type === 'playoffs' && ' · Playoffs'}
          {game.type === 'playin' && ' · Play-in'}
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
            {game.label && game.type !== 'regular' && <span>{game.label}</span>}
            <span className="countdown-muted">
              {game.timeTbd ? 'Time TBD' : `${formatGameTime(game, timeZone)} ${timeZoneAbbr(timeZone, new Date(game.startUtc))}`}
              {channel && ` · ${channel.label}`}
            </span>
          </div>
        </div>
        {/* The last result stays in view until the next game starts (the live pill shows that one). */}
        {last && !showPill && (
          <a className="last-result" href={routeHref({ page: 'game', id: last.id })}>
            Last game:{' '}
            <strong>
              {last.score.team > last.score.opponent ? 'W' : 'L'} {last.score.team}–{last.score.opponent}
            </strong>{' '}
            {last.home ? 'vs' : 'at'} {last.opponent}
          </a>
        )}
        {(testLive || (showPill && watch) || tags.length > 0 || ours.length + theirs.length > 0) && (
          <ul className="hero-chips" aria-label="About this game">
            {testLive && <LivePill live={testLive} started href={routeHref({ page: 'game', id: 'live' })} />}
            {showPill && watch && (
              <LivePill live={watch} started={started} href={routeHref({ page: 'game', id: game.id })} />
            )}
            {tags.map((t) => (
              <li key={t.id + t.text} className="hero-chip soft tag" title={t.title}>
                {t.text}
                {t.title && <span className="sr-only">. {t.title}</span>}
              </li>
            ))}
            {injuryChips}
          </ul>
        )}
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

/** Gray shapes where the countdown and next-up cards will be. */
function NextGameLoading() {
  return (
    <div className="cards-hero loading" aria-hidden="true">
      <div className="countdown">
        <span className="bone bone-line" />
        <span className="bone bone-count" />
        {/* One row, for the matchup tags (or the injury pills, when on): the usual case. */}
        <span className="bone bone-chips" />
        {SHOW_HEADER_INJURIES && <span className="bone bone-chips short" />}
      </div>
      <div className="next-up">
        <span className="bone bone-line" />
        <div className="up-cards">
          <span className="bone bone-card" />
          <span className="bone bone-card" />
          <span className="bone bone-card" />
        </div>
      </div>
    </div>
  )
}

/** Drawn before the data arrives too (a stand-in chip for the counts), so the roster doesn't jump down. */
function RosterIntro({ data }: { data?: AppData }) {
  const players = data?.players.players ?? []
  // Before the data arrives: this season by the calendar (the state keeps the date out of render).
  const [calendarSeason] = useState(() => seasonForDate(new Date()).label)
  const season = data?.players.season ?? calendarSeason
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
        {!data && (
          <li className="hero-chip soft chip-loading" aria-hidden="true">
            00 players
          </li>
        )}
        {players.length > 0 && <li className="hero-chip soft">{players.length} players</li>}
        {twoWay > 0 && <li className="hero-chip outline">{twoWay} on two-way contracts</li>}
      </ul>
    </section>
  )
}
