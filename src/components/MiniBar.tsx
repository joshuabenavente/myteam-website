import { useEffect, useState, type RefObject } from 'react'
import { useTeam } from '../lib/team.ts'
import type { AppData } from '../lib/data.ts'
import { formatGameDate, formatGameTime } from '../lib/format.ts'
import { glassOn, hasBack } from '../lib/glass.ts'
import { headlineGame } from '../lib/hero.ts'
import { liveFor, resultFor, scoreLine, useLive } from '../lib/live.ts'
import { routeHref, type Route } from '../lib/route.ts'
import { BrandIcon } from './Brand.tsx'
import { Icon } from './Icon.tsx'
import { BackChevron } from './TabBar.tsx'

interface Props {
  /** The full header; the bar shows once it has scrolled out of view. */
  headerRef: RefObject<HTMLElement | null>
  route: Route
  data?: AppData
  timeZone: string
}

/** A slim bar pinned to the top once the header scrolls away: the next game (or live score) and the page switcher. */
export function MiniBar({ headerRef, route, data, timeZone }: Props) {
  const team = useTeam()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting))
    observer.observe(header)
    return () => observer.disconnect()
  }, [headerRef])

  return (
    // Hidden bars are inert so keyboard and screen reader users don't meet a second, invisible nav.
    <div className={`mini-bar ${shown ? 'shown' : ''}`} inert={!shown}>
      <div className="mini-inner">
        {glassOn() && hasBack(route) ? (
          <BackChevron route={route} className="mini-back" />
        ) : (
          <a className="mini-brand" href={routeHref({ page: 'games' })}>
            <BrandIcon size={30} />
            <span className="sr-only">{team.fullName} home</span>
          </a>
        )}
        {data && <MiniGame data={data} timeZone={timeZone} />}
        <nav className="mini-nav" aria-label="Pages (compact)">
          <a
            href={routeHref({ page: 'games' })}
            aria-current={route.page === 'games' || route.page === 'game' ? 'page' : undefined}
          >
            <Icon name="games" size={16} />
            <span className="mini-label">Games</span>
          </a>
          <a
            href={routeHref({ page: 'players' })}
            aria-current={route.page === 'players' || route.page === 'player' ? 'page' : undefined}
          >
            <Icon name="players" size={16} />
            <span className="mini-label">Players</span>
          </a>
        </nav>
      </div>
    </div>
  )
}

/** "at OKC · Thu, Oct 22 · 7:30 PM", or the live score linking to the game page. */
function MiniGame({ data, timeZone }: { data: AppData; timeZone: string }) {
  const team = useTeam()
  const watch = useLive()
  const game = headlineGame(data.schedule.games)
  if (!game) return <span className="mini-game" />
  const score = liveFor(watch, game.id)
  const href = routeHref({ page: 'game', id: game.id })

  if (score?.state === 'in' || score?.state === 'delayed') {
    return (
      <a className="mini-game mini-live" href={href}>
        <span className="live-dot" aria-hidden="true" />
        <span>
          {score.state === 'delayed' ? 'Delayed' : `${scoreLine(score, team.abbr)} · ${score.detail}`}
        </span>
      </a>
    )
  }
  if (score?.state === 'final') {
    return (
      <a className="mini-game" href={href}>
        {score.detail} · {resultFor(score, team.abbr) ?? scoreLine(score, team.abbr)}
      </a>
    )
  }
  const { weekday, monthDay } = formatGameDate(game.startUtc, timeZone)
  return (
    <span className="mini-game">
      <span className="mini-next">Next</span> {game.home ? 'vs' : 'at'} {game.opponent}
      <span className="mini-when">
        {' · '}
        <span className="mini-weekday">{weekday}, </span>
        {monthDay} · {formatGameTime(game, timeZone)}
      </span>
    </span>
  )
}
