import type { CSSProperties } from 'react'
import { chipStatus, shortName } from '../lib/hero.ts'
import { routeHref } from '../lib/route.ts'
import { dotColor } from '../lib/teamColors.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'

/**
 * One player who's out or day-to-day, as a pill. A neutral pill with a dot in the team's color, so
 * no team's colors sit on another's background: the dot is a team color that shows on
 * `background`, the same rule as the logo's dot. The pill links to the player's page when given
 * (under `teamSlug` for a player on the other team).
 */
export function InjuryChip(props: { abbr: string; background: string; name: string; status: string; detail?: string; playerId?: string; teamSlug?: string }) {
  const { abbr, background, name, status, detail, playerId, teamSlug } = props
  const team = TEAMS_BY_ABBR[abbr]
  const text = (
    <>
      <span className="chip-dot" aria-hidden="true" />
      <span className="chip-text">
        <span className="sr-only">{team.name}: </span>
        {shortName(name)} <span className="chip-status">{chipStatus({ status })}</span>
        {detail && <span className="sr-only"> ({detail})</span>}
      </span>
    </>
  )
  return (
    <li className="hero-chip team" style={{ '--chip-fill': dotColor(abbr, background) } as CSSProperties} title={detail ? `${name}: ${detail}` : undefined}>
      {playerId ? (
        <a className="hero-chip-link" href={routeHref({ page: 'player', id: playerId }, teamSlug)}>
          {text}
        </a>
      ) : (
        text
      )}
    </li>
  )
}
