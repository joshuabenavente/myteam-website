import { useEffect, useState, type CSSProperties } from 'react'
import { routeHref } from '../lib/route.ts'
import { applyTheme, savedTeam, saveTeam } from '../lib/team.ts'
import { TEAM_COLORS } from '../lib/teamColors.ts'
import { TEAMS, teamSlug, type Team } from '../lib/teams.ts'
import { Wordmark } from './Brand.tsx'
import { Icon } from './Icon.tsx'
import { SiteFooter } from './SiteFooter.tsx'
import { TeamLogo } from './TeamLogo.tsx'

const DIVISIONS = {
  East: ['Atlantic', 'Central', 'Southeast'],
  West: ['Northwest', 'Pacific', 'Southwest'],
} as const

/** All 30 teams by conference and division, with a search box. */
export function TeamPicker({ unknown }: { unknown?: string }) {
  const [query, setQuery] = useState('')
  const saved = savedTeam()

  useEffect(() => {
    applyTheme()
    document.title = 'Pick your team · myteam.fans'
  }, [])

  const q = query.trim().toLowerCase()
  const matches = (t: Team) => !q || `${t.city} ${t.name} ${t.abbr}`.toLowerCase().includes(q)
  const any = TEAMS.some(matches)

  return (
    <>
      <button className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <header className="site-header page picker-header">
        <div className="header-inner">
          <div className="header-top">
            <span className="brand">
              <Wordmark height={30} />
            </span>
          </div>
          <section className="hero-page">
            <p className="eyebrow">NBA</p>
            <h1>Pick your team</h1>
            <p className="picker-lede">Schedule, live scores, injuries and player stats for any team.</p>
          </section>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="picker">
        {unknown && (
          <p className="placeholder">
            There's no team at /{unknown}. Pick one below.
          </p>
        )}
        <label className="picker-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search teams</span>
          <input type="search" placeholder="Search teams" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {!any && <p className="muted">No teams match “{query}”.</p>}

        {(Object.keys(DIVISIONS) as (keyof typeof DIVISIONS)[]).map((conf) => {
          const divisions = DIVISIONS[conf]
            .map((d) => [d, TEAMS.filter((t) => t.division === d && matches(t))] as const)
            .filter(([, teams]) => teams.length > 0)
          if (divisions.length === 0) return null
          return (
            <section key={conf} className="picker-conf" aria-labelledby={`conf-${conf}`}>
              <h2 id={`conf-${conf}`}>{conf}ern Conference</h2>
              <div className="picker-divisions">
                {divisions.map(([division, teams]) => (
                  <div key={division} className="picker-division">
                    <h3>{division}</h3>
                    <ul>
                      {teams.map((t) => {
                        const slug = teamSlug(t)
                        return (
                          <li key={t.abbr}>
                            <a
                              className={`team-tile ${slug === saved ? 'current' : ''}`}
                              href={routeHref({ page: 'games' }, slug)}
                              onClick={() => saveTeam(slug)}
                              style={{ '--tile-color': TEAM_COLORS[t.abbr]?.[0] } as CSSProperties}
                            >
                              <TeamLogo abbr={t.abbr} size={40} />
                              <span className="tile-name">
                                <span className="tile-city">{t.city}</span>
                                <span className="tile-nick">{t.name}</span>
                              </span>
                              {slug === saved && <span className="tile-badge">Your team</span>}
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </main>
      <SiteFooter />
    </>
  )
}
