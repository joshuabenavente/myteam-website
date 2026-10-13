import { useEffect, useState } from 'react'
import { AppearancePanel } from './components/AppearancePanel.tsx'
import { GamesCalendar } from './components/GamesCalendar.tsx'
import { GamesList } from './components/GamesList.tsx'
import { Icon } from './components/Icon.tsx'
import { PlayerPage } from './components/PlayerPage.tsx'
import { PlayerTracker } from './components/PlayerTracker.tsx'
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
import { TEAM } from './lib/config'
import { useAppData } from './lib/data.ts'
import { timeZoneAbbr } from './lib/format.ts'
import { routeHref, useRoute } from './lib/route.ts'
import './App.css'

type GamesView = 'list' | 'calendar'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function App() {
  const route = useRoute()
  const [gamesView, setGamesView] = useState<GamesView>('list')
  const { data, error } = useAppData()
  const [picker, setPicker] = useState(pickerEnabled)
  const [appearance, setAppearance] = useState<Appearance>(() => (picker ? loadAppearance() : DEFAULT_APPEARANCE))

  useEffect(() => {
    applyAppearance(appearance)
    if (picker) saveAppearance(appearance)
  }, [appearance, picker])

  const turnOffPicker = () => {
    disablePicker()
    setPicker(false)
    setAppearance(DEFAULT_APPEARANCE)
  }

  return (
    <IconStyleContext.Provider value={appearance.icons}>
      <header className="site-header">
        <p className="site-title">{TEAM.name} Tracker</p>
        <nav className="tabs" aria-label="Pages">
          <a href={routeHref({ page: 'games' })} aria-current={route.page === 'games' ? 'page' : undefined}>
            <Icon name="games" /> Games
          </a>
          <a href={routeHref({ page: 'players' })} aria-current={route.page !== 'games' ? 'page' : undefined}>
            <Icon name="players" /> Players
          </a>
        </nav>
      </header>

      <main>
        {error && <p className="placeholder error">{error}</p>}
        {!data && !error && <p className="placeholder">Loading…</p>}

        {data && route.page === 'games' && (
          <section>
            <h1 className="sr-only">Games</h1>
            <TeamSummary data={data} timeZone={timeZone} />
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
              <GamesList data={data} timeZone={timeZone} />
            ) : (
              <GamesCalendar data={data} timeZone={timeZone} />
            )}
          </section>
        )}

        {data && route.page === 'players' && (
          <section>
            <h1 className="sr-only">Players</h1>
            <PlayerTracker data={data} />
          </section>
        )}

        {data && route.page === 'player' && <PlayerPage id={route.id} data={data} timeZone={timeZone} />}
      </main>

      {data && (
        <footer className="site-footer muted small">
          Updated {new Date(data.meta.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.
          Data from NBA.com, ESPN and{' '}
          <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer">
            Basketball-Reference.com
          </a>
          . Regular season and playoffs only.
        </footer>
      )}
      {picker && <AppearancePanel value={appearance} onChange={setAppearance} onTurnOff={turnOffPicker} />}
    </IconStyleContext.Provider>
  )
}

export default App
