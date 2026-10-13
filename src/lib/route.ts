// Minimal hash routing, so pages work on GitHub Pages without server rewrites.
//   #/            games
//   #/players     player tracker
//   #/players/id  one player's page

import { useEffect, useState } from 'react'

export type Route = { page: 'games' } | { page: 'players' } | { page: 'player'; id: string }

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'players') return parts[1] ? { page: 'player', id: parts[1] } : { page: 'players' }
  return { page: 'games' }
}

export const routeHref = (r: Route) =>
  r.page === 'games' ? '#/' : r.page === 'players' ? '#/players' : `#/players/${r.id}`

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
