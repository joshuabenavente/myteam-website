import { TEAM } from '../lib/config.ts'
import type { AppData } from '../lib/data.ts'
import { formatRecord, ordinal } from '../lib/format.ts'

/** Denver's record and standing, shown above the games once the season is under way. */
export function TeamSummary({ data }: { data: AppData }) {
  const us = data.standings.teams[TEAM.abbr]
  if (!us) return null
  // Before opening night the header's next game says when the season starts.
  if (us.wins + us.losses === 0) return null
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
