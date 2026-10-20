import { useEffect, useState, type CSSProperties } from 'react'
import { useDaysData } from '../lib/data.ts'
import { cardState, dayChannels, gamesOn, liveFor, nextGameDay, orderForDay, type CardState } from '../lib/day.ts'
import { dayKey, formatGameTime, timeZoneAbbr } from '../lib/format.ts'
import { routeHref } from '../lib/route.ts'
import { applyTheme, savedTeam, setAppIcons, teamFromSlug } from '../lib/team.ts'
import { matchupColors } from '../lib/teamColors.ts'
import { TEAMS_BY_ABBR, teamSlug } from '../lib/teams.ts'
import type { DayGame } from '../lib/types.ts'
import { useDayScores } from '../lib/useDayScores.ts'
import { HeaderTop } from './HeaderTop.tsx'
import { OfflineNote } from './OfflineNote.tsx'
import { SiteFooter } from './SiteFooter.tsx'
import { TeamLogo } from './TeamLogo.tsx'

/** "Thu, Oct 22" for a "YYYY-MM-DD" date. */
const dateLabel = (key: string) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })

/** Every NBA game today, in the viewer's time zone, with live scores while they're on. */
export function TodayPage({ timeZone }: { timeZone: string }) {
  const { data, error } = useDaysData()
  // "Today" is as of page load, like the countdown on team pages.
  const [now] = useState(() => new Date())
  const key = dayKey(now, timeZone)
  const games = data ? gamesOn(data.days.games, key, timeZone) : []
  const scores = useDayScores(games)
  const followedSlug = savedTeam()
  const followed = followedSlug ? teamFromSlug(followedSlug) : undefined

  useEffect(() => {
    applyTheme()
    setAppIcons()
    document.title = "Today's games · myteam.fans"
  }, [])

  const cards = orderForDay(
    games.map((game) => ({ game, state: cardState(game, liveFor(scores, game)) })),
    followed?.abbr,
  )
  const next = data && games.length === 0 ? nextGameDay(data.days.games, key, timeZone) : undefined

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header cards page">
        <div className="header-inner">
          <HeaderTop team={followed} current="today" />
          <section className="hero-page">
            <p className="eyebrow">NBA</p>
            <h1>
              Today
              <span className="roster-season">
                <span className="roster-sep" aria-hidden="true">
                  {' '}
                  ·{' '}
                </span>
                {dateLabel(key)}
              </span>
            </h1>
            {data && (
              <ul className="hero-chips" aria-label="Summary">
                <li className="hero-chip soft">
                  {games.length === 0 ? 'No games' : games.length === 1 ? '1 game' : `${games.length} games`}
                </li>
                {games.length > 0 && <li className="hero-chip outline">Times in {timeZoneAbbr(timeZone, now)}</li>}
              </ul>
            )}
          </section>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="day-page">
        {data?.offline && <OfflineNote updatedAt={data.meta.updatedAt} />}
        {error && <p className="placeholder error">{error}</p>}
        {!data && !error && <p className="placeholder">Loading…</p>}
        {data && games.length === 0 && (
          <div className="day-empty">
            <p>No NBA games today.</p>
            {next && <p className="muted">Next games: {dateLabel(next)}</p>}
          </div>
        )}
        {cards.length > 0 && (
          <ul className="day-cards">
            {cards.map(({ game, state }) => (
              <li key={game.id}>
                <DayCard game={game} state={state} followed={followed?.abbr} followedSlug={followedSlug} timeZone={timeZone} />
              </li>
            ))}
          </ul>
        )}
      </main>
      {data && <SiteFooter updatedAt={data.meta.updatedAt} />}
    </>
  )
}

interface CardProps {
  game: DayGame
  state: CardState
  followed?: string
  followedSlug?: string
  timeZone: string
}

function DayCard({ game, state, followed, followedSlug, timeZone }: CardProps) {
  const mine = followed !== undefined && (game.home === followed || game.away === followed)
  // The game page lives under a team's address: yours if you're playing, otherwise the home team's.
  const slug = mine && followedSlug ? followedSlug : teamSlug(TEAMS_BY_ABBR[game.home])
  const scored = state.kind === 'live' || state.kind === 'final'
  const winner = state.kind === 'final' ? (state.home > state.away ? game.home : state.away > state.home ? game.away : '') : ''
  // Home on the left, away on the right, blending in the middle like the game page; a road team
  // in colors too close to the home team's switches to its second color.
  const [home, away] = matchupColors(game.home, game.away)
  const style = {
    '--home-fill': home.fill,
    '--home-text': home.text,
    '--away-fill': away.fill,
    '--away-text': away.text,
  } as CSSProperties
  const channels = dayChannels(game)
  const foot = [
    state.kind === 'scheduled' || state.kind === 'live' ? channels.map((c) => c.label).join(', ') : '',
    game.neutralSite && `in ${game.neutralSite}`,
    game.label,
  ].filter(Boolean)

  const side = (abbr: string, score: number | undefined, where: 'home' | 'away', text: string) => {
    const team = TEAMS_BY_ABBR[abbr]
    return (
      <span className={`day-side ${where} ${winner && winner !== abbr ? 'lost' : ''}`}>
        <TeamLogo abbr={abbr} size={40} background={text === '#ffffff' ? 'dark' : 'light'} />
        <span className="day-name">
          <span className="day-city">{team?.city}</span>
          <span className={`day-nick ${(team?.name.length ?? 0) > 10 ? 'long' : ''}`}>{team?.name ?? abbr}</span>
          <span className="day-meta">{where === 'home' ? 'Home' : 'Away'}</span>
        </span>
        {scored && <span className="day-score">{score}</span>}
      </span>
    )
  }

  return (
    <a className={`day-card ${state.kind} ${mine ? 'mine' : ''}`} href={routeHref({ page: 'game', id: game.id }, slug)} style={style}>
      <span className="day-matchup">
        {side(game.home, scored ? state.home : undefined, 'home', home.text)}
        <span className={`day-center ${state.kind}`}>
          {state.kind === 'live' && (
            <span className="day-when">
              <span className="live-dot" aria-hidden="true" /> Live
            </span>
          )}
          <span className="day-clock">
            {state.kind === 'scheduled' && formatGameTime(game, timeZone)}
            {(state.kind === 'live' || state.kind === 'final') && state.detail}
            {state.kind === 'pending' && 'Pending'}
            {state.kind === 'postponed' && 'Postponed'}
          </span>
        </span>
        {side(game.away, scored ? state.away : undefined, 'away', away.text)}
      </span>
      {(foot.length > 0 || mine) && (
        <span className="day-card-foot">
          <span>{foot.join(' · ')}</span>
          {mine && <span className="day-tag">Your team</span>}
        </span>
      )}
    </a>
  )
}
