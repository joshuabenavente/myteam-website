import type { StandingsFile, TeamInfo } from '../lib/types.ts'
import { formatRecord } from '../lib/format.ts'
import { TEAMS_BY_ABBR } from '../lib/teams.ts'
import { TeamLogo } from './TeamLogo.tsx'

/** Games behind a leader: half a game per win or loss of difference. */
const gamesBehind = (t: TeamInfo, leader: TeamInfo) => (leader.wins - t.wins + (t.losses - leader.losses)) / 2

/**
 * The followed team's conference, in our standings order (NBA-05). Ties are broken with
 * simplified rules, so the order can differ from the NBA's official standings; the footnote says so.
 */
export function ConferenceStandings({ abbr, standings }: { abbr: string; standings: StandingsFile['teams'] }) {
  const us = standings[abbr]
  if (!us) return null
  const rows = Object.values(standings)
    .filter((t) => t.conference === us.conference)
    .sort((a, b) => a.conferenceRank - b.conferenceRank)
  const leader = rows[0]
  return (
    <div className="conference-standings">
      <table className="standings">
        <caption className="sr-only">{us.conference}ern Conference standings</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Rank</span>
            </th>
            <th scope="col">Team</th>
            <th scope="col">W-L</th>
            <th scope="col">GB</th>
            <th scope="col">L10</th>
            <th scope="col">Strk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const gb = gamesBehind(t, leader)
            return (
              <tr key={t.abbr} className={t.abbr === abbr ? 'us' : undefined} aria-current={t.abbr === abbr ? 'true' : undefined}>
                <td className="rank">{t.conferenceRank}</td>
                <th scope="row">
                  <span className="standings-team">
                    <TeamLogo abbr={t.abbr} size={20} />
                    {TEAMS_BY_ABBR[t.abbr]?.name ?? t.abbr}
                  </span>
                </th>
                <td>{formatRecord(t)}</td>
                <td>{gb > 0 ? gb.toFixed(1).replace(/\.0$/, '') : '—'}</td>
                <td>{formatRecord(t.lastTen)}</td>
                <td>{t.streak ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="muted small">Ties are broken with simplified rules, so the order can differ from the NBA's official standings until late in the season.</p>
    </div>
  )
}
