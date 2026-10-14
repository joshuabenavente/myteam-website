import { useRef, useState, type CSSProperties } from 'react'
import type { AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime, formatRecord, timeZoneAbbr } from '../lib/format.ts'
import { nextGames } from '../lib/availability.ts'
import { chipStatus, countdownLabel, daysUntil, headlineChannel, headlineGame, listedFor, shortName } from '../lib/hero.ts'
import { liveFor, useLive } from '../lib/live.ts'
import { nameKey } from '../lib/names.ts'
import { routeHref, type Route } from '../lib/route.ts'
import { useTeam } from '../lib/team.ts'
import { badgeColors, dotColor, teamTheme } from '../lib/teamColors.ts'
import { teamLogoUrl, TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { Absence } from '../lib/types.ts'
import { BrandIcon, Wordmark } from './Brand.tsx'
import { Icon } from './Icon.tsx'
import { LiveAnnouncer, LivePill } from './LivePill.tsx'
import { MiniBar } from './MiniBar.tsx'
import { TeamLogo } from './TeamLogo.tsx'

/** Injury chips per team; the rest are behind "+N more". */
const CHIPS_PER_TEAM = 2

/**
 * Prototype: ?banner=cards shows a compact banner (countdown plus "next up" game cards) instead of
 * the big next-game hero. Remembered on this device until ?banner=hero.
 */
const cardsBanner = (() => {
  try {
    const param = new URLSearchParams(window.location.search).get('banner')
    if (param) window.localStorage.setItem('myteam:banner', param)
    return (param ?? window.localStorage.getItem('myteam:banner')) === 'cards'
  } catch {
    return false
  }
})()

interface Props {
  route: Route
  data?: AppData
  timeZone: string
  /** Open a game's details in the list below (for "+N more"). */
  onShowGame: (id: string) => void
}

/** The navy header: brand and season record, the next game on the Games page, and the page switcher. */
export function SiteHeader({ route, data, timeZone, onShowGame }: Props) {
  const team = useTeam()
  const full = route.page === 'games' && !!data
  const roster = route.page === 'players' && !!data
  // Before the first game, "0-0" says nothing; the pill shows just the season.
  const played = data?.standings.teams[team.abbr]
  const us = played && played.wins + played.losses > 0 ? played : undefined
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
        className={`site-header ${full ? 'full' : roster ? 'page' : 'compact'} ${cardsBanner ? 'cards' : ''}`}
      >
        <div className="header-inner">
          <div className="header-top">
            <a className="brand" href={routeHref({ page: 'games' })}>
              {/* The wordmark on wide screens; the icon on phones, leaving the team pill room for the full name. */}
              <Wordmark height={30} className="brand-wide" decorative />
              <BrandIcon size={36} glass className="brand-narrow" />
              <span className="sr-only">myteam.fans, {team.fullName} home</span>
            </a>
            <div className="header-actions">
              {data && (
                <span className={`season-pill ${us ? '' : 'season-only'}`}>
                  <span className="season-label">
                    <span className="season-century">{data.schedule.season.slice(0, 2)}</span>
                    {data.schedule.season.slice(2)}
                  </span>
                  {us && (
                    <span className="season-record">
                      <span className="sr-only">, {team.name} record </span>
                      {formatRecord(us)}
                    </span>
                  )}
                </span>
              )}
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
            {cardsBanner && nav}
          </div>

          {/* The Games page's heading sits here so it comes before the next game's. */}
          {route.page === 'games' && <h1 className="sr-only">Games</h1>}
          {full && <NextGame data={data} timeZone={timeZone} onShowGame={onShowGame} />}
          {roster && <RosterIntro data={data} />}

          {!cardsBanner && nav}
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
      <section className="hero-game" aria-labelledby="hero-game-heading">
        <h2 id="hero-game-heading" className="eyebrow">
          {played ? 'Season complete' : 'Schedule'}
        </h2>
        <p className="hero-date">{played ? 'See you next season' : 'Coming soon'}</p>
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
  const eyebrow = [live ? 'Live now' : score?.state === 'final' ? 'Final' : 'Next game', game.type === 'playoffs' && 'Playoffs']
    .filter(Boolean)
    .join(' · ')

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

  if (cardsBanner) {
    const us = data.standings.teams[team.abbr]
    const opener = !!us && us.wins + us.losses === 0 && game.type === 'regular'
    const days = daysUntil(game, now, timeZone)
    const upcoming = nextGames(data.schedule.games, 3)
    return (
      <section className="cards-hero" aria-labelledby="hero-game-heading">
        <div className="countdown">
          <h2 id="hero-game-heading" className="eyebrow">
            {live ? 'Live now' : score?.state === 'final' ? 'Final' : opener ? `${data.schedule.season} season tips off in` : 'Next game in'}
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

  return (
    <section className="hero-game" aria-labelledby="hero-game-heading">
      <h2 id="hero-game-heading" className="eyebrow">
        {eyebrow}
      </h2>

      <div className="matchup" aria-hidden="true">
        {/* The team always on the left, as on the game page and in the live score. */}
        <TeamBadge abbr={team.abbr} followed={team.abbr} />
        <span className="matchup-at">{game.home ? 'vs' : 'at'}</span>
        <TeamBadge abbr={game.opponent} followed={team.abbr} />
      </div>

      <div className="hero-game-body">
        <p className="hero-date">
          <span>
            {weekday}, {monthDay}
          </span>
          <span className="hero-time">
            <span className="hero-sep" aria-hidden="true">
              {' · '}
            </span>
            {game.timeTbd ? 'Time TBD' : formatGameTime(game, timeZone)}
            {!game.timeTbd && <span className="hero-tz"> {timeZoneAbbr(timeZone, new Date(game.startUtc))}</span>}
          </span>
        </p>
        <p className="hero-opponent">
          {game.home ? 'vs' : 'at'} {opp.city} {opp.name}
          {game.neutralSite && <span className="hero-label"> · in {game.neutralSite}</span>}
          {game.label && game.type === 'playoffs' && <span className="hero-label"> · {game.label}</span>}
        </p>
        <ul className="hero-chips" aria-label="About this game">
          {testLive && <LivePill live={testLive} started href={routeHref({ page: 'game', id: 'live' })} />}
          {showPill && watch ? (
            <LivePill live={watch} started={started} href={routeHref({ page: 'game', id: game.id })} />
          ) : (
            <li className="hero-chip soft">{started ? 'In progress' : countdownLabel(game, now, timeZone)}</li>
          )}
          {channel && (
            <li className="hero-chip outline">
              {live && 'Watch on '}
              {channel.label}
            </li>
          )}
          {injuryChips}
        </ul>
        <LiveAnnouncer score={testLive?.score ?? score} />
      </div>
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

/** A team circle in its colors with the team logo, or the abbreviation if the logo can't load. */
/** A team circle in its colors: the abbreviation until the logo has loaded (or if it can't). */
function TeamBadge({ abbr, followed }: { abbr: string; followed: string }) {
  const c = badgeColors(abbr, followed)
  const [logo, setLogo] = useState<'loading' | 'loaded' | 'failed'>('loading')
  return (
    <span
      className={`team-badge ${c.outline ? 'outlined' : ''} logo-${logo}`}
      style={{ '--chip-fill': c.fill, '--chip-ring': c.ring, '--chip-text': c.text } as CSSProperties}
    >
      {logo !== 'loaded' && <span className="badge-abbr">{abbr}</span>}
      {logo !== 'failed' && (
        <img
          className="logo"
          src={teamLogoUrl(abbr, true)}
          width={72}
          height={72}
          alt=""
          onLoad={() => setLogo('loaded')}
          onError={() => setLogo('failed')}
        />
      )}
    </span>
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
