import { useTeam } from '../lib/team.ts'
import type { AppData } from '../lib/data.ts'
import { formatRecord, ordinal } from '../lib/format.ts'
import { pastScores, scoring, seasonScores, type Scoring } from '../lib/stats.ts'
import { ConferenceStandings } from './ConferenceStandings.tsx'

/** "114.2 scored · 110.8 allowed · +3.4 margin" per game. */
function ScoringLine({ s, label }: { s: Scoring; label?: string }) {
  const margin = `${s.margin > 0 ? '+' : s.margin < 0 ? '−' : ''}${Math.abs(s.margin).toFixed(1)}`
  return (
    <span className="team-scoring">
      {label && <span className="muted">{label}: </span>}
      {s.pointsFor.toFixed(1)} scored · {s.pointsAgainst.toFixed(1)} allowed · {margin} margin
      <span className="muted"> per game</span>
    </span>
  )
}

/**
 * The team's record, standing and scoring (NBA-05, NBA-06), above the games. Before the first
 * game it shows only last season's scoring, labeled with that season.
 */
export function TeamSummary({ data }: { data: AppData }) {
  const team = useTeam()
  const us = data.standings.teams[team.abbr]
  if (!us) return null

  if (us.wins + us.losses === 0) {
    // Before opening night the header's next game says when the season starts.
    const last = data.lastSeason && scoring(pastScores(data.lastSeason.games, team.abbr))
    if (!last || !data.lastSeason) return null
    return (
      <div className="team-summary">
        <ScoringLine s={last} label={`${data.lastSeason.season} regular season`} />
      </div>
    )
  }

  const now = scoring(seasonScores(data.schedule.games))
  return (
    <div className="team-summary">
      <span className="big">{formatRecord(us)}</span>
      <span>
        {ordinal(us.divisionRank)} in {us.division}
        {us.divisionGamesBehind > 0 && ` (${us.divisionGamesBehind} GB)`} · {ordinal(us.conferenceRank)} in the{' '}
        {us.conference}
        {us.streak && ` · ${us.streak}`}
      </span>
      {now && <ScoringLine s={now} />}
      <details className="standings-disclosure">
        <summary>{us.conference} standings</summary>
        <ConferenceStandings abbr={team.abbr} standings={data.standings.teams} />
      </details>
    </div>
  )
}
