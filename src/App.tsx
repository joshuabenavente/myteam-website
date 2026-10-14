import { useEffect, useState } from 'react'
import { AppearancePanel } from './components/AppearancePanel.tsx'
import { GamesCalendar } from './components/GamesCalendar.tsx'
import { GamesList } from './components/GamesList.tsx'
import { Icon } from './components/Icon.tsx'
import { PlayerPage } from './components/PlayerPage.tsx'
import { PlayerTracker } from './components/PlayerTracker.tsx'
import { Ridge } from './components/Ridge.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'
import { TeamSummary } from './components/TeamSummary.tsx'
import {
  applyAppearance,
  DEFAULT_APPEARANCE,
  disablePicker,
  IconStyleContext,
  loadAppearance,
  pickerEnabled,
  saveAppearance,
  type Appearance,
} from './lib/appearance.ts'
import { TEAM } from './lib/config.ts'
import { useAppData } from './lib/data.ts'
import { timeZoneAbbr } from './lib/format.ts'
import { headlineGame } from './lib/hero.ts'
import { LiveContext } from './lib/live.ts'
import { useRoute } from './lib/route.ts'
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
  const [picker, setPicker] = useState(pickerEnabled)
  const [appearance, setAppearance] = useState<Appearance>(() => (picker ? loadAppearance() : DEFAULT_APPEARANCE))

  useEffect(() => {
    applyAppearance(appearance)
    if (picker) saveAppearance(appearance)
  }, [appearance, picker])

  // "+N more" in the header opens that game in the list.
  const [focus, setFocus] = useState<{ id: string; n: number }>()
  const showGame = (id: string) => {
    setGamesView('list')
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }))
  }

  const turnOffPicker = () => {
    disablePicker()
    setPicker(false)
    setAppearance(DEFAULT_APPEARANCE)
  }

  return (
    <IconStyleContext.Provider value={appearance.icons}>
      <LiveContext.Provider value={live}>
        <SiteHeader route={route} data={data} timeZone={timeZone} onShowGame={showGame} />

        <main>
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
        {picker && <AppearancePanel value={appearance} onChange={setAppearance} onTurnOff={turnOffPicker} />}
      </LiveContext.Provider>
    </IconStyleContext.Provider>
  )
}

export default App
