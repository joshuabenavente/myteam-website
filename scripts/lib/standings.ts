// Standings, records and head-to-head computed from game results.
//
// Calculated from regular season games rather than fetched, so preseason never leaks in
// (ESPN's standings include preseason results until the season starts).

import { TEAMS, TEAMS_BY_ABBR } from '../../src/lib/teams.ts'
import type { HeadToHead, TeamInfo, TrackedGameType, WinLoss } from '../../src/lib/types.ts'

export interface FinalGame {
  type: TrackedGameType
  startUtc: string
  home: string
  away: string
  homeScore: number
  awayScore: number
}

interface Tally {
  wins: number
  losses: number
  divWins: number
  divLosses: number
  confWins: number
  confLosses: number
  pointDiff: number
  /** true = win, in date order. */
  results: boolean[]
}

const pct = (w: number, l: number) => (w + l === 0 ? 0 : w / (w + l))

function tally(games: FinalGame[]): { [abbr: string]: Tally } {
  const out: { [abbr: string]: Tally } = {}
  for (const t of TEAMS) {
    out[t.abbr] = { wins: 0, losses: 0, divWins: 0, divLosses: 0, confWins: 0, confLosses: 0, pointDiff: 0, results: [] }
  }
  const sorted = games.filter((g) => g.type === 'regular').sort((a, b) => a.startUtc.localeCompare(b.startUtc))
  for (const g of sorted) {
    const home = TEAMS_BY_ABBR[g.home]
    const away = TEAMS_BY_ABBR[g.away]
    if (!home || !away) continue
    const homeWon = g.homeScore > g.awayScore
    for (const [team, opp, won, diff] of [
      [home, away, homeWon, g.homeScore - g.awayScore],
      [away, home, !homeWon, g.awayScore - g.homeScore],
    ] as const) {
      const r = out[team.abbr]
      if (won) r.wins++
      else r.losses++
      if (team.division === opp.division) {
        if (won) r.divWins++
        else r.divLosses++
      }
      if (team.conference === opp.conference) {
        if (won) r.confWins++
        else r.confLosses++
      }
      r.pointDiff += diff
      r.results.push(won)
    }
  }
  return out
}

/** Head-to-head wins for each team against the others in a group, from regular season games. */
function groupWinPct(group: string[], games: FinalGame[]): { [abbr: string]: number } {
  const w: { [abbr: string]: [number, number] } = Object.fromEntries(group.map((a) => [a, [0, 0]]))
  for (const g of games) {
    if (g.type !== 'regular' || !(g.home in w) || !(g.away in w)) continue
    const winner = g.homeScore > g.awayScore ? g.home : g.away
    const loser = winner === g.home ? g.away : g.home
    w[winner][0]++
    w[loser][1]++
  }
  return Object.fromEntries(group.map((a) => [a, pct(...w[a])]))
}

/**
 * Rank teams by win percentage, breaking ties with a simplified version of the NBA's
 * tiebreakers: head-to-head among the tied teams, division leader (conference ranking only),
 * division record (same division only), conference record, then point differential.
 */
function rank(abbrs: string[], t: { [abbr: string]: Tally }, games: FinalGame[], divisionLeaders?: Set<string>) {
  const byPct = new Map<number, string[]>()
  for (const a of abbrs) {
    const p = pct(t[a].wins, t[a].losses)
    byPct.set(p, [...(byPct.get(p) ?? []), a])
  }
  const ordered: string[] = []
  for (const p of [...byPct.keys()].sort((a, b) => b - a)) {
    const group = byPct.get(p)!
    if (group.length === 1) {
      ordered.push(group[0])
      continue
    }
    const h2h = groupWinPct(group, games)
    const sameDivision = new Set(group.map((a) => TEAMS_BY_ABBR[a].division)).size === 1
    const keys = (a: string) => [
      h2h[a],
      divisionLeaders?.has(a) ? 1 : 0,
      sameDivision ? pct(t[a].divWins, t[a].divLosses) : 0,
      pct(t[a].confWins, t[a].confLosses),
      t[a].pointDiff,
    ]
    ordered.push(
      ...[...group].sort((a, b) => {
        const ka = keys(a)
        const kb = keys(b)
        for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i]
        return a.localeCompare(b)
      }),
    )
  }
  return ordered
}

function streak(results: boolean[]): string | undefined {
  if (!results.length) return undefined
  const last = results[results.length - 1]
  let n = 0
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) n++
  return `${last ? 'W' : 'L'}${n}`
}

export function computeStandings(games: FinalGame[]): { [abbr: string]: TeamInfo } {
  const t = tally(games)
  const out: { [abbr: string]: TeamInfo } = {}
  const leaders = new Set<string>()

  for (const division of new Set(TEAMS.map((x) => x.division))) {
    const members = TEAMS.filter((x) => x.division === division).map((x) => x.abbr)
    const ordered = rank(members, t, games)
    leaders.add(ordered[0])
    const lead = t[ordered[0]]
    ordered.forEach((abbr, i) => {
      const r = t[abbr]
      const team = TEAMS_BY_ABBR[abbr]
      out[abbr] = {
        abbr,
        conference: team.conference,
        division,
        wins: r.wins,
        losses: r.losses,
        divisionRank: i + 1,
        conferenceRank: 0,
        divisionGamesBehind: (lead.wins - r.wins + (r.losses - lead.losses)) / 2,
        ...(streak(r.results) && { streak: streak(r.results) }),
      }
    })
  }

  for (const conference of ['East', 'West'] as const) {
    const members = TEAMS.filter((x) => x.conference === conference).map((x) => x.abbr)
    rank(members, t, games, leaders).forEach((abbr, i) => (out[abbr].conferenceRank = i + 1))
  }
  return out
}

/** The team's record against every opponent, split by regular season and playoffs. */
export function headToHead(games: FinalGame[], abbr: string): { [opp: string]: HeadToHead } {
  const out: { [opp: string]: HeadToHead } = {}
  const empty = (): WinLoss => ({ wins: 0, losses: 0 })
  for (const g of games) {
    if (g.home !== abbr && g.away !== abbr) continue
    const opp = g.home === abbr ? g.away : g.home
    const won = g.home === abbr ? g.homeScore > g.awayScore : g.awayScore > g.homeScore
    out[opp] ??= { regular: empty(), playoffs: empty() }
    if (won) out[opp][g.type].wins++
    else out[opp][g.type].losses++
  }
  return out
}
