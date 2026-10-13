import { useState } from 'react'
import { GamesCalendar } from './components/GamesCalendar.tsx'
import { GamesList } from './components/GamesList.tsx'
import { TeamSummary } from './components/TeamSummary.tsx'
import { TEAM } from './lib/config'
import { useAppData } from './lib/data.ts'
import { timeZoneAbbr } from './lib/format.ts'
import './App.css'

type Page = 'games' | 'players'
type GamesView = 'list' | 'calendar'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function App() {
  const [page, setPage] = useState<Page>('games')
  const [gamesView, setGamesView] = useState<GamesView>('list')
  const { data, error } = useAppData()

  return (
    <>
      <header className="site-header">
        <h1>{TEAM.name} Tracker</h1>
        <nav className="tabs" aria-label="Pages">
          <button aria-current={page === 'games'} onClick={() => setPage('games')}>
            Games
          </button>
          <button aria-current={page === 'players'} onClick={() => setPage('players')}>
            Players
          </button>
        </nav>
      </header>

      <main>
        {error && <p className="placeholder error">{error}</p>}
        {!data && !error && <p className="placeholder">Loading…</p>}

        {data && page === 'games' && (
          <section>
            <TeamSummary data={data} />
            <div className="toolbar">
              <div className="segmented" role="group" aria-label="View">
                <button aria-pressed={gamesView === 'list'} onClick={() => setGamesView('list')}>
                  List
                </button>
                <button aria-pressed={gamesView === 'calendar'} onClick={() => setGamesView('calendar')}>
                  Calendar
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

        {data && page === 'players' && (
          <section>
            <p className="placeholder">Player tracker coming in phase 5.</p>
          </section>
        )}
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
    </>
  )
}

export default App
