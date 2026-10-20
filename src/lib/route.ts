// Path routing:
//   /                          team picker (or straight to the saved team)
//   /teams                     team picker, always
//   /today                     every game today (also /yesterday, /tomorrow)
//   /<team>                    games, e.g. /denver-nuggets
//   /<team>/players            roster
//   /<team>/players/<id>       one player's page
//   /<team>/games/<id>         one game's page (NBA game ID; "live" for the ?live= test team)
//
// GitHub Pages only serves files that exist, so the build writes a copy of index.html for each
// team page and serves deeper pages through 404.html (see vite.config.ts).

import { useEffect, useState } from 'react'
import { DAYS, type DayName } from './day.ts'

export type Page =
  | { page: 'games' }
  | { page: 'game'; id: string }
  | { page: 'players' }
  | { page: 'player'; id: string }

export type Route = { page: 'home' } | { page: 'picker' } | { page: 'day'; day: DayName } | (Page & { team: string })

export function parseRoute(pathname: string): Route {
  const [team, section, id] = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (!team) return { page: 'home' }
  if (team === 'teams') return { page: 'picker' }
  if ((DAYS as readonly string[]).includes(team)) return { page: 'day', day: team as DayName }
  if (section === 'players') return id ? { page: 'player', team, id } : { page: 'players', team }
  if (section === 'games' && id) return { page: 'game', team, id }
  return { page: 'games', team }
}

/** The team in the current address, for links built outside a team's page tree. */
const currentTeam = () => (typeof window === 'undefined' ? '' : (parseRoute(window.location.pathname) as { team?: string }).team ?? '')

/** A page's address; within the current team unless `team` is given. */
export function routeHref(
  r: Page | { page: 'picker' } | { page: 'home' } | { page: 'day'; day: DayName },
  team = currentTeam(),
): string {
  if (r.page === 'home') return '/'
  if (r.page === 'picker') return '/teams'
  if (r.page === 'day') return `/${r.day}`
  const base = `/${team}`
  if (r.page === 'games') return base
  if (r.page === 'game') return `${base}/games/${r.id}`
  if (r.page === 'players') return `${base}/players`
  return `${base}/players/${r.id}`
}

/** Old #/ addresses (before teams) were all Denver's. */
export function legacyPath(hash: string): string | undefined {
  if (!hash.startsWith('#/')) return undefined
  const rest = hash.slice(2).replace(/\/$/, '')
  return `/denver-nuggets${rest ? `/${rest}` : ''}`
}

/** Go to a path inside the app without reloading. */
export function navigate(path: string, { replace = false } = {}) {
  const url = path + (path.includes('?') ? '' : window.location.search)
  if (replace) window.history.replaceState(null, '', url)
  else window.history.pushState(null, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => {
    const legacy = legacyPath(window.location.hash)
    if (legacy) window.history.replaceState(null, '', legacy + window.location.search)
    else if (/.\/$/.test(window.location.pathname))
      window.history.replaceState(null, '', window.location.pathname.replace(/\/+$/, '') + window.location.search + window.location.hash)
    return parseRoute(window.location.pathname)
  })

  useEffect(() => {
    const onPop = () => {
      setRoute(parseRoute(window.location.pathname))
      window.scrollTo(0, 0)
    }
    // Same-site links change the page without a reload; new tabs and modified clicks behave normally.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element).closest?.('a')
      if (!a || a.target || a.hasAttribute('download') || a.origin !== window.location.origin) return
      if (a.pathname.startsWith('/data/')) return
      // In-page links (the skip link) scroll and move focus the usual way.
      if (a.hash && a.pathname === window.location.pathname) return
      e.preventDefault()
      if (a.pathname === window.location.pathname && a.search === window.location.search) return
      window.history.pushState(null, '', a.pathname + (a.search || window.location.search))
      onPop()
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick)
    }
  }, [])
  return route
}
