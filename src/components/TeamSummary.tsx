import { TEAM } from '../lib/config.ts'
import { formatRecord, ordinal } from '../lib/format.ts'
import type { AppData } from '../lib/data.ts'

/** Denver's record and standing, shown above the games. */
export function TeamSummary({ data }: { data: AppData }) {
  const us = data.standings.teams[TEAM.abbr]
  if (!us) return null
  const played = us.wins + us.losses > 0
  return (
    <div className="team-summary">
      <span className="big">{formatRecord(us)}</span>
      {played ? (
        <span>
          {ordinal(us.divisionRank)} in {us.division}
          {us.divisionGamesBehind > 0 && ` (${us.divisionGamesBehind} GB)`} · {ordinal(us.conferenceRank)} in the{' '}
          {us.conference}
          {us.streak && ` · ${us.streak}`}
        </span>
      ) : (
        <span className="muted">{data.schedule.season} season hasn't tipped off yet</span>
      )}
    </div>
  )
}
