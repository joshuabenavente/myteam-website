import { useState } from 'react'
import { TEAM } from './lib/config'
import './App.css'

type Page = 'games' | 'players'
type GamesView = 'list' | 'calendar'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function App() {
  const [page, setPage] = useState<Page>('games')
  const [gamesView, setGamesView] = useState<GamesView>('list')

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
        {page === 'games' ? (
          <section>
            <div className="toolbar">
              <div className="segmented" role="group" aria-label="View">
                <button aria-pressed={gamesView === 'list'} onClick={() => setGamesView('list')}>
                  List
                </button>
                <button aria-pressed={gamesView === 'calendar'} onClick={() => setGamesView('calendar')}>
                  Calendar
                </button>
              </div>
              <span className="muted">Times shown in {timeZone}</span>
            </div>
            <p className="placeholder">
              {gamesView === 'list' ? 'Game list' : 'Calendar'} coming in phase {gamesView === 'list' ? 3 : 4}.
            </p>
          </section>
        ) : (
          <section>
            <p className="placeholder">Player tracker coming in phase 5.</p>
          </section>
        )}
      </main>
    </>
  )
}

export default App
