import { useState, type CSSProperties } from 'react'
import { TEAM } from '../lib/config.ts'
import type { AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime, formatRecord, timeZoneAbbr } from '../lib/format.ts'
import { chipStatus, countdownLabel, headlineChannel, headlineGame, listedFor, shortName } from '../lib/hero.ts'
import { routeHref, type Route } from '../lib/route.ts'
import { badgeColors } from '../lib/teamColors.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import type { Absence } from '../lib/types.ts'
import { Icon } from './Icon.tsx'
import { TeamLogo } from './TeamLogo.tsx'

/** Injury chips per team; the rest are behind "+N more". */
const CHIPS_PER_TEAM = 2

interface Props {
  route: Route
  data?: AppData
  timeZone: string
  /** Open a game's details in the list below (for "+N more"). */
  onShowGame: (id: string) => void
}

/** The navy header: brand and season record, the next game on the Games page, and the page switcher. */
export function SiteHeader({ route, data, timeZone, onShowGame }: Props) {
  const full = route.page === 'games' && !!data
  const us = data?.standings.teams[TEAM.abbr]
  return (
    <header className={`site-header ${full ? 'full' : 'compact'}`}>
      <Ridge />
      <div className="header-inner">
        <div className="header-top">
          <a className="brand" href={routeHref({ page: 'games' })}>
            <BrandMark />
            <span className="site-title">{TEAMS_BY_ABBR[TEAM.abbr].name} Tracker</span>
          </a>
          {data && (
            <span className="season-pill">
              {data.schedule.season}
              {us && (
                <span className="season-record">
                  <span className="sr-only">, Denver's record </span>
                  {formatRecord(us)}
                </span>
              )}
            </span>
          )}
        </div>

        {/* The Games page's heading sits here so it comes before the next game's. */}
        {route.page === 'games' && <h1 className="sr-only">Games</h1>}
        {full && <NextGame data={data} timeZone={timeZone} onShowGame={onShowGame} />}

        <nav className="page-nav" aria-label="Pages">
          <a href={routeHref({ page: 'games' })} aria-current={route.page === 'games' ? 'page' : undefined}>
            <Icon name="games" /> Games
          </a>
          <a href={routeHref({ page: 'players' })} aria-current={route.page !== 'games' ? 'page' : undefined}>
            <Icon name="players" /> Players
          </a>
        </nav>
      </div>
    </header>
  )
}

function NextGame({ data, timeZone, onShowGame }: { data: AppData; timeZone: string; onShowGame: (id: string) => void }) {
  // The countdown is as of page load, like the rest of the data.
  const [now] = useState(() => new Date())
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
  const live = game.status === 'live'
  const channel = headlineChannel(game)
  const listed = data.availability?.teams ?? {}
  const ours = listedFor(listed[TEAM.abbr], game)
  const theirs = listedFor(listed[game.opponent], game)
  const hidden = Math.max(0, ours.length - CHIPS_PER_TEAM) + Math.max(0, theirs.length - CHIPS_PER_TEAM)
  const eyebrow = [live ? 'Live now' : 'Next game', game.type === 'playoffs' && 'Playoffs'].filter(Boolean).join(' · ')
  const [away, home] = game.home ? [game.opponent, TEAM.abbr] : [TEAM.abbr, game.opponent]

  return (
    <section className="hero-game" aria-labelledby="hero-game-heading">
      <h2 id="hero-game-heading" className="eyebrow">
        {eyebrow}
      </h2>

      <div className="matchup" aria-hidden="true">
        <TeamBadge abbr={away} />
        <span className="matchup-at">at</span>
        <TeamBadge abbr={home} />
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
          {game.label && game.type === 'playoffs' && <span className="hero-label"> · {game.label}</span>}
        </p>
        <ul className="hero-chips" aria-label="About this game">
          <li className="hero-chip soft">{live ? 'In progress' : countdownLabel(game, now, timeZone)}</li>
          {channel && (
            <li className="hero-chip outline">
              {live && 'Watch on '}
              {channel.label}
            </li>
          )}
          {ours.slice(0, CHIPS_PER_TEAM).map((a) => (
            <InjuryChip key={a.name} abbr={TEAM.abbr} absence={a} />
          ))}
          {theirs.slice(0, CHIPS_PER_TEAM).map((a) => (
            <InjuryChip key={a.name} abbr={game.opponent} absence={a} />
          ))}
          {hidden > 0 && (
            <li>
              <button className="hero-chip outline more" onClick={() => onShowGame(game.id)}>
                +{hidden} more<span className="sr-only"> listed out or day-to-day: open the injury report</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}

function InjuryChip({ abbr, absence }: { abbr: string; absence: Absence }) {
  const c = badgeColors(abbr)
  const team = TEAMS_BY_ABBR[abbr]
  return (
    <li
      className={`hero-chip team ${c.outline ? 'outlined' : ''}`}
      style={{ '--chip-fill': c.fill, '--chip-ring': c.ring, '--chip-text': c.text } as CSSProperties}
    >
      <span className="sr-only">{team.name}: </span>
      {shortName(absence.name)} {chipStatus(absence)}
    </li>
  )
}

/** A team circle in its colors with the team logo, or the abbreviation if the logo can't load. */
function TeamBadge({ abbr }: { abbr: string }) {
  const c = badgeColors(abbr)
  return (
    <span
      className={`team-badge ${c.outline ? 'outlined' : ''}`}
      style={{ '--chip-fill': c.fill, '--chip-ring': c.ring, '--chip-text': c.text } as CSSProperties}
    >
      <span className="badge-abbr">{abbr}</span>
      <TeamLogo abbr={abbr} size={72} background="dark" />
    </span>
  )
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="17" fill="#fec524" />
      <path d="M7 23 L13.5 13.5 L17 18 L20.5 14 L27 23 Z" fill="#0e2240" />
    </svg>
  )
}

/** Two faint mountain ridges along the bottom of the header. */
function Ridge() {
  return (
    <svg className="header-ridge" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 110 L90 70 L170 95 L270 40 L360 85 L450 55 L560 100 L660 45 L760 90 L860 60 L960 95 L1060 50 L1140 80 L1200 65 L1200 140 L0 140 Z"
        fill="rgb(255 255 255 / 5%)"
      />
      <path
        d="M0 125 L120 95 L230 118 L330 82 L440 112 L540 92 L650 120 L760 88 L880 115 L990 90 L1100 116 L1200 98 L1200 140 L0 140 Z"
        fill="rgb(254 197 36 / 10%)"
      />
    </svg>
  )
}
