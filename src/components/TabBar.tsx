import { routeHref, type Route } from '../lib/route.ts'
import { Icon } from './Icon.tsx'

/**
 * The glass app's tab bar, floating at the bottom of phone screens in place of the header's page
 * switcher (App.css, .tab-bar). Wider screens keep the header's.
 */
export function TabBar({ route }: { route: Route }) {
  const current = (on: boolean) => (on ? 'page' : undefined)
  return (
    <nav className="tab-bar" aria-label="Pages">
      <a href={routeHref({ page: 'games' })} aria-current={current(route.page === 'games' || route.page === 'game')}>
        <Icon name="games" size={22} />
        <span>Games</span>
      </a>
      <a href={routeHref({ page: 'players' })} aria-current={current(route.page === 'players' || route.page === 'player')}>
        <Icon name="players" size={22} />
        <span>Players</span>
      </a>
      <a href={routeHref({ page: 'picker' })}>
        <Icon name="switch" size={22} />
        <span>Teams</span>
      </a>
    </nav>
  )
}

/** Where a detail page's back chevron goes, in the glass app: a player's to the roster, a game's to the games. */
export function BackChevron({ route, className }: { route: Route; className: string }) {
  const to = route.page === 'player' ? { page: 'players' as const, label: 'Players' } : { page: 'games' as const, label: 'Games' }
  return (
    <a className={className} href={routeHref({ page: to.page })}>
      <Icon name="prev" size={22} />
      <span>
        <span className="sr-only">Back to </span>
        {to.label}
      </span>
    </a>
  )
}
