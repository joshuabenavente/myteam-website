import { routeHref } from '../lib/route.ts'
import type { CurrentTeam } from '../lib/team.ts'
import { BrandIcon, Wordmark } from './Brand.tsx'
import { Icon } from './Icon.tsx'
import { TeamLogo } from './TeamLogo.tsx'

export type Section = 'games' | 'players' | 'today'

/**
 * The header's top row on every page: the logo, the team pill (which opens the team picker) and
 * the Games | Players | Today switcher. Games and Players are the team's; on the Today page
 * they lead to the team you follow, or to the picker if you haven't picked one.
 */
export function HeaderTop({ team, current }: { team?: CurrentTeam; current?: Section }) {
  const teamPage = (page: 'games' | 'players') => (team ? routeHref({ page }, team.slug) : routeHref({ page: 'picker' }))
  return (
    <div className="header-top">
      <a className="brand" href={team ? teamPage('games') : routeHref({ page: 'home' })}>
        {/* The wordmark on wide screens; the icon on phones, leaving the team pill room for the full name. */}
        <Wordmark height={30} className="brand-wide" decorative />
        <BrandIcon size={36} glass className="brand-narrow" />
        <span className="sr-only">myteam.fans{team && `, ${team.fullName} home`}</span>
      </a>
      <div className="header-actions">
        {team ? (
          <a className={`team-pill ${team.fullName.length > 18 ? 'long' : ''}`} href={routeHref({ page: 'picker' })}>
            <TeamLogo abbr={team.abbr} size={28} background="dark" />
            <span className="team-pill-name">
              <span className="team-pill-city">{team.city} </span>
              {team.name}
            </span>
            <Icon name="switch" size={16} />
            <span className="sr-only">, switch team</span>
          </a>
        ) : (
          <a className="team-pill" href={routeHref({ page: 'picker' })}>
            <span className="team-pill-name">Pick your team</span>
            <Icon name="switch" size={16} />
          </a>
        )}
      </div>
      <nav className="page-nav" aria-label="Pages">
        <a href={teamPage('games')} aria-current={current === 'games' ? 'page' : undefined}>
          <Icon name="games" /> Games
        </a>
        <a href={teamPage('players')} aria-current={current === 'players' ? 'page' : undefined}>
          <Icon name="players" /> Players
        </a>
        <a href={routeHref({ page: 'today' })} aria-current={current === 'today' ? 'page' : undefined}>
          <Icon name="today" /> Today
        </a>
      </nav>
    </div>
  )
}
