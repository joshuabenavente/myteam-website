import { useEffect, useState } from 'react'
import { GamePage } from './components/GamePage.tsx'
import { GamesCalendar } from './components/GamesCalendar.tsx'
import { GamesList } from './components/GamesList.tsx'
import { Icon } from './components/Icon.tsx'
import { PlayerPage } from './components/PlayerPage.tsx'
import { PlayerTracker } from './components/PlayerTracker.tsx'
import { Ridge } from './components/Ridge.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'
import { TeamSummary } from './components/TeamSummary.tsx'
import { TEAM } from './lib/config.ts'
import { useAppData, type AppData } from './lib/data.ts'
import { timeZoneAbbr } from './lib/format.ts'
import { headlineGame } from './lib/hero.ts'
import { LiveContext } from './lib/live.ts'
import { useRoute, type Route } from './lib/route.ts'
import { TEAMS_BY_ABBR } from './lib/teams.ts'
import { useLiveScore } from './lib/useLiveScore.ts'
import './App.css'

type GamesView = 'list' | 'calendar'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

// ?live=OKC watches another team's game today, to try the live score outside Denver's games.
const liveTestTeam = (() => {
  const t = new URLSearchParams(window.location.search).get('live')?.toUpperCase()
  return t && TEAMS_BY_ABBR[t] ? t : undefined
})()

function App() {
  const route = useRoute()
  const [gamesView, setGamesView] = useState<GamesView>('list')
  const { data, error } = useAppData()
  const headline = data && headlineGame(data.schedule.games)
  const live = useLiveScore(
    liveTestTeam ?? (headline ? TEAM.abbr : undefined),
    liveTestTeam ? undefined : headline?.startUtc,
    liveTestTeam ? undefined : headline?.id,
  )
  // "+N more" in the header opens that game in the list.
  const [focus, setFocus] = useState<{ id: string; n: number }>()
  const showGame = (id: string) => {
    setGamesView('list')
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }))
  }

  // A title per page, for browser history, tabs and screen readers.
  useEffect(() => {
    document.title = [pageTitle(route, data), 'Nuggets Tracker'].filter(Boolean).join(' · ')
  }, [route, data])

  return (
    <LiveContext.Provider value={live}>
      {/* A button, not a "#main" link: the hash is the router's. */}
      <button className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <SiteHeader route={route} data={data} timeZone={timeZone} onShowGame={showGame} />

      <main id="main" tabIndex={-1}>
        {error && <p className="placeholder error">{error}</p>}
        {!data && !error && <p className="placeholder">Loading…</p>}

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

      {data && (
        <footer className="site-footer">
          <Ridge />
          <div className="footer-inner">
            Updated {new Date(data.meta.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.
            Data from NBA.com, ESPN and{' '}
            <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer">
              Basketball-Reference.com
            </a>
            . Regular season and playoffs only.
          </div>
        </footer>
      )}
    </LiveContext.Provider>
  )
}

function pageTitle(route: Route, data?: AppData): string | undefined {
  if (route.page === 'players') return 'Roster'
  if (route.page === 'player') return data?.players.players.find((p) => p.id === route.id)?.name ?? 'Player'
  if (route.page === 'game') {
    const g = data?.schedule.games.find((x) => x.id === route.id)
    return g ? `${TEAM.abbr} ${g.home ? 'vs' : 'at'} ${g.opponent}` : 'Game'
  }
  return undefined
}

export default App
