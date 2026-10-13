import { nextGames } from '../lib/availability.ts'
import { TEAM } from '../lib/config.ts'
import type { AppData } from '../lib/data.ts'
import { formatGameDate, formatRecord, ordinal } from '../lib/format.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'

/** Denver's record and standing, shown above the games; before opening night, when the season starts. */
export function TeamSummary({ data, timeZone }: { data: AppData; timeZone: string }) {
  const us = data.standings.teams[TEAM.abbr]
  if (!us) return null
  if (us.wins + us.losses === 0) {
    const opener = nextGames(data.schedule.games, 1)[0]
    if (!opener) return null
    const { weekday, monthDay } = formatGameDate(opener.startUtc, timeZone)
    const opp = TEAMS_BY_ABBR[opener.opponent]
    return (
      <div className="team-summary">
        <span className="big">Season tips off {monthDay}</span>
        <span className="muted">
          {weekday} {opener.home ? 'vs' : 'at'} {opp.city} {opp.name}
        </span>
      </div>
    )
  }
  return (
    <div className="team-summary">
      <span className="big">{formatRecord(us)}</span>
      <span>
        {ordinal(us.divisionRank)} in {us.division}
        {us.divisionGamesBehind > 0 && ` (${us.divisionGamesBehind} GB)`} · {ordinal(us.conferenceRank)} in the{' '}
        {us.conference}
        {us.streak && ` · ${us.streak}`}
      </span>
    </div>
  )
}
