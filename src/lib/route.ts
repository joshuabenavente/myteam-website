// Minimal hash routing, so pages work on GitHub Pages without server rewrites.
//   #/            games
//   #/players     player tracker
//   #/players/id  one player's page
//   #/games/id    one game's page (NBA game ID; "live" for the ?live= test team's game)

import { useEffect, useState } from 'react'

export type Route =
  | { page: 'games' }
  | { page: 'game'; id: string }
  | { page: 'players' }
  | { page: 'player'; id: string }

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'players') return parts[1] ? { page: 'player', id: parts[1] } : { page: 'players' }
  if (parts[0] === 'games' && parts[1]) return { page: 'game', id: parts[1] }
  return { page: 'games' }
}

export function routeHref(r: Route): string {
  if (r.page === 'games') return '#/'
  if (r.page === 'game') return `#/games/${r.id}`
  if (r.page === 'players') return '#/players'
  return `#/players/${r.id}`
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
