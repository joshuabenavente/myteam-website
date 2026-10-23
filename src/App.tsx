import { useEffect, useState } from 'react'
import { GamePage } from './components/GamePage.tsx'
import { GamesCalendar } from './components/GamesCalendar.tsx'
import { GamesList } from './components/GamesList.tsx'
import { Icon } from './components/Icon.tsx'
import { PlayerPage } from './components/PlayerPage.tsx'
import { PlayerTracker } from './components/PlayerTracker.tsx'
import { SiteFooter } from './components/SiteFooter.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'
import { TeamPicker } from './components/TeamPicker.tsx'
import { TeamSummary } from './components/TeamSummary.tsx'
import { useAppData, type AppData } from './lib/data.ts'
import { formatUpdated, timeZoneAbbr } from './lib/format.ts'
import { headlineGame } from './lib/hero.ts'
import { LiveContext } from './lib/live.ts'
import { navigate, useRoute, type Route } from './lib/route.ts'
import { applyHead, snapshotFor } from './lib/head.ts'
import { gameHead, playerHead, rosterHead, teamHead, type Head } from './lib/seo.ts'
import { applyTheme, savedTeam, saveTeam, setAppIcons, TeamContext, teamFromSlug, type CurrentTeam } from './lib/team.ts'
import { TEAMS_BY_ABBR } from './lib/teams.ts'
import { useLiveScore } from './lib/useLiveScore.ts'
import './App.css'

type GamesView = 'list' | 'calendar'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

// ?live=OKC watches another team's game today, to try the live score outside the team's games.
const liveTestTeam = (() => {
  const t = new URLSearchParams(window.location.search).get('live')?.toUpperCase()
  return t && TEAMS_BY_ABBR[t] ? t : undefined
})()

function App() {
  const route = useRoute()
  const team = 'team' in route ? teamFromSlug(route.team) : undefined
  const saved = route.page === 'home' ? savedTeam() : undefined

  // myteam.fans/ goes straight to the team you last looked at.
  useEffect(() => {
    if (saved) navigate(`/${saved}`, { replace: true })
  }, [saved])

  if (saved) return null
  if (!team) return <TeamPicker unknown={'team' in route ? route.team : undefined} />
  return (
    <TeamContext.Provider value={team}>
      <TeamSite key={team.slug} route={route as Extract<Route, { team: string }>} team={team} />
    </TeamContext.Provider>
  )
}

function TeamSite({ route, team }: { route: Extract<Route, { team: string }>; team: CurrentTeam }) {
  const [gamesView, setGamesView] = useState<GamesView>('list')
  const { data, error } = useAppData(team.abbr)
  const headline = data && headlineGame(data.schedule.games)
  const live = useLiveScore(
    liveTestTeam ?? (headline ? team.abbr : undefined),
    liveTestTeam ? undefined : headline?.startUtc,
    liveTestTeam ? undefined : headline?.id,
  )
  // "+N more" in the header opens that game in the list.
  const [focus, setFocus] = useState<{ id: string; n: number }>()
  const showGame = (id: string) => {
    setGamesView('list')
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }))
  }

  useEffect(() => {
    applyTheme(team.theme)
    setAppIcons(team)
    // A shared link to another team doesn't replace yours; the picker does (see TeamPicker).
    if (!savedTeam()) saveTeam(team.slug)
  }, [team])

  // A title, description and canonical address per page, for search, history, tabs and screen readers.
  useEffect(() => {
    const head = pageHead(route, team, data)
    if (head) applyHead(head)
    else document.title = `${team.fullName} · myteam.fans`
  }, [route, team, data])
  const snapshot = error ? snapshotFor(window.location.pathname) : undefined

  return (
    <LiveContext.Provider value={live}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader route={route} data={data} timeZone={timeZone} onShowGame={showGame} />

      <main id="main" tabIndex={-1}>
        {data?.offline && <OfflineNote updatedAt={data.meta.updatedAt} />}
        {data && !Number.isNaN(Date.parse(data.meta.updatedAt)) && (
          <p className="snapshot-updated muted small">
            Published data last updated: <time dateTime={data.meta.updatedAt}>{formatUpdated(data.meta.updatedAt)}</time>.
            {' '}Live scores update separately.
          </p>
        )}
        {error && !snapshot && <p className="placeholder error">{error}</p>}
        {snapshot && (
          <>
            <p className="offline-note" role="status">
              <Icon name="offline" size={16} />
              Couldn't load the latest data. This is the page as last published.
            </p>
            {/* Built by seo.ts from escaped data. */}
            <div dangerouslySetInnerHTML={{ __html: snapshot }} />
          </>
        )}
        {!data && !error && <ListLoading />}

        {data && route.page === 'games' && (
          <section>
            <TeamSummary data={data} />
            <div className="toolbar">
              <div className="segmented" role="group" aria-label="View">
                <button aria-pressed={gamesView === 'list'} onClick={() => setGamesView('list')}>
                  <Icon name="list" size={16} /> List
                </button>
                <button aria-pressed={gamesView === 'calendar'} onClick={() => setGamesView('calendar')}>
                  <Icon name="calendar" size={16} /> Calendar
                </button>
              </div>
              <span className="muted small" title={timeZone}>
                Times in {timeZoneAbbr(timeZone)}
              </span>
            </div>
            {gamesView === 'list' ? (
              <GamesList key={focus?.n} data={data} timeZone={timeZone} focusId={focus?.id} />
            ) : (
              <GamesCalendar data={data} timeZone={timeZone} />
            )}
          </section>
        )}

        {data && route.page === 'players' && (
          <section>
            <PlayerTracker data={data} />
          </section>
        )}

        {data && route.page === 'player' && <PlayerPage id={route.id} data={data} timeZone={timeZone} />}

        {data && route.page === 'game' && (
          <GamePage id={route.id} data={data} timeZone={timeZone} testTeam={liveTestTeam} />
        )}
      </main>

      {data && <SiteFooter />}
    </LiveContext.Provider>
  )
}

/** No connection: say how old the saved data is. */
function OfflineNote({ updatedAt }: { updatedAt: string }) {
  const [now] = useState(() => new Date())
  const when = new Date(updatedAt)
  const today = when.toDateString() === now.toDateString()
  const label = when.toLocaleString('en-US', today ? { timeStyle: 'short' } : { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <p className="offline-note" role="status">
      <Icon name="offline" size={16} />
      Offline · showing data from {label}
    </p>
  )
}

/** Gray rows where the list will be, so the page keeps its shape while the data loads. */
function ListLoading() {
  return (
    <div className="list-loading" role="status">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="bone bone-row" aria-hidden="true" />
      ))}
    </div>
  )
}

/** The page's head (seo.ts), once its data is here; undefined while loading or not found. */
function pageHead(route: Extract<Route, { team: string }>, team: CurrentTeam, data?: AppData): Head | undefined {
  if (!data) return undefined
  if (route.page === 'games') return teamHead(team, data.schedule.season, data.schedule.games)
  if (route.page === 'players') return rosterHead(team, data.players)
  if (route.page === 'player') {
    const p = data.players.players.find((x) => x.id === route.id)
    return p && playerHead(team, p, data.players)
  }
  const g = data.schedule.games.find((x) => x.id === route.id)
  return g && gameHead(team, g)
}

export default App
