// Game previews: gather the facts for an upcoming game and have Claude write ~3 sentences
// from them. Previews are cached by a hash of the facts and only rewritten when they change.

import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { absencesForGame } from '../../src/lib/availability.ts'
import { ordinal } from '../../src/lib/format.ts'
import { TEAMS_BY_ABBR } from '../../src/lib/teams.ts'
import type { Absence, Game, HeadToHead, Player, TeamInfo, WinLoss } from '../../src/lib/types.ts'
import type { FinalGame } from './standings.ts'

const MODEL = 'claude-opus-5-5'

const rec = (r: WinLoss) => `${r.wins}-${r.losses}`
const fullName = (abbr: string) => `${TEAMS_BY_ABBR[abbr].city} ${TEAMS_BY_ABBR[abbr].name}`

function teamFacts(t: TeamInfo | undefined) {
  if (!t) return undefined
  const played = t.wins + t.losses
  if (played === 0) return { gamesPlayed: 0 }
  return {
    gamesPlayed: played,
    record: rec(t),
    homeRecord: rec(t.home),
    roadRecord: rec(t.road),
    lastTen: rec(t.lastTen),
    streak: t.streak,
    division: `${ordinal(t.divisionRank)} in the ${t.division}${t.divisionGamesBehind > 0 ? `, ${t.divisionGamesBehind} games back` : ''}`,
    conference: `${ordinal(t.conferenceRank)} in the ${t.conference}`,
  }
}

/** The most recent finished game between the two teams, described from Denver's side. */
function lastMeeting(results: FinalGame[], team: string, opp: string) {
  const g = results
    .filter((r) => (r.home === team && r.away === opp) || (r.home === opp && r.away === team))
    .sort((a, b) => b.startUtc.localeCompare(a.startUtc))[0]
  if (!g) return undefined
  const ours = g.home === team ? g.homeScore : g.awayScore
  const theirs = g.home === team ? g.awayScore : g.homeScore
  return {
    date: g.startUtc.slice(0, 10),
    where: g.home === team ? `in ${TEAMS_BY_ABBR[team].city}` : `in ${TEAMS_BY_ABBR[opp].city}`,
    type: g.type === 'playoffs' ? 'playoffs' : 'regular season',
    result: `${TEAMS_BY_ABBR[team].name} ${ours > theirs ? 'won' : 'lost'} ${Math.max(ours, theirs)}-${Math.min(ours, theirs)}`,
  }
}

function absenceFacts(list: Absence[], players?: Player[]) {
  return list.map((a) => {
    const p = players?.find((x) => x.name === a.name)
    const avg = (t?: { points: number; minutes: number; games: number }) =>
      t && t.games ? `${(t.points / t.games).toFixed(1)} pts, ${(t.minutes / t.games).toFixed(1)} min per game` : undefined
    return {
      name: a.name,
      status: a.gameTimeDecision ? `${a.status} (game-time decision)` : a.status,
      ...(a.reason && { reason: a.reason }),
      ...(p && avg(p.current.regular) && { thisSeason: avg(p.current.regular) }),
      ...(p && avg(p.lastFull.regular) && { lastSeason: avg(p.lastFull.regular) }),
    }
  })
}

export interface PreviewInputs {
  team: string
  game: Game
  /** 1-based number of this game in Denver's season (by type). */
  gameNumber: number
  standings: { [abbr: string]: TeamInfo }
  h2h?: { current: HeadToHead; last: HeadToHead }
  /** Finished games this season and last, for the last meeting. */
  results: FinalGame[]
  absences: { [abbr: string]: Absence[] }
  players?: Player[]
  /** Denver's chance of winning (0-100) from ESPN's matchup predictor. */
  winProbability?: number
}

export function buildFacts(i: PreviewInputs) {
  const { team, game } = i
  const opp = game.opponent
  return {
    game: {
      matchup: `${fullName(team)} ${game.home ? 'vs' : 'at'} ${fullName(opp)}`,
      denverIs: game.home ? 'home' : 'away',
      type: game.type === 'playoffs' ? 'playoffs' : 'regular season',
      denverGameNumber: `${ordinal(i.gameNumber)} ${game.type === 'playoffs' ? 'playoff ' : ''}game of the season for Denver`,
      ...(game.label && { note: game.label }),
    },
    denver: teamFacts(i.standings[team]),
    opponent: { name: fullName(opp), ...teamFacts(i.standings[opp]) },
    ...(i.h2h && {
      seasonSeries: {
        thisSeason: rec(i.h2h.current.regular),
        ...(i.h2h.current.playoffs.wins + i.h2h.current.playoffs.losses > 0 && {
          thisSeasonPlayoffs: rec(i.h2h.current.playoffs),
        }),
        lastSeason: rec(i.h2h.last.regular),
        ...(i.h2h.last.playoffs.wins + i.h2h.last.playoffs.losses > 0 && {
          lastSeasonPlayoffs: rec(i.h2h.last.playoffs),
        }),
      },
    }),
    ...(lastMeeting(i.results, team, opp) && { lastMeeting: lastMeeting(i.results, team, opp) }),
    notAvailable: {
      denver: absenceFacts(absencesForGame(i.absences[team], game), i.players),
      opponent: absenceFacts(absencesForGame(i.absences[opp], game)),
    },
    // Rounded so small model updates don't trigger a rewrite.
    ...(i.winProbability !== undefined && {
      espnMatchupPredictorDenverWinChance: `${Math.round(i.winProbability / 5) * 5}%`,
    }),
  }
}

export const hashFacts = (facts: unknown) => createHash('sha256').update(JSON.stringify(facts)).digest('hex').slice(0, 16)

const SYSTEM = `You write short previews of upcoming Denver Nuggets games for a fan's personal schedule app.

Write exactly three sentences of plain prose: no markdown, headings, lists or emojis. Cover what to expect: how the teams are playing, the matchup history, and who is missing, picking whatever is most notable.

Use only the facts in the user's message. Don't add statistics, player roles, storylines, coaches or history that aren't there; your knowledge of rosters may be out of date, so if a player's importance isn't shown by the numbers given, don't characterize it. If a team hasn't played yet this season, say so naturally (for example "both teams open their seasons") instead of quoting 0-0 records. Skip anything that adds nothing, such as an empty absence list.

Don't mention tip-off time or TV channels; the app shows those. If a win chance from ESPN's matchup predictor is given, you may mention it once, attributed to ESPN; don't give betting advice.`

export interface GeneratedPreview {
  text: string
  usage: { input: number; output: number }
}

/** Ask Claude for a preview. Returns undefined if it declines or the reply isn't usable. */
export async function writePreview(client: Anthropic, facts: unknown): Promise<GeneratedPreview | undefined> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // A short writing task: low effort keeps thinking (and cost) small.
    output_config: { effort: 'low' },
    // If a safety classifier declines, retry on a fallback model chosen by the API.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    messages: [{ role: 'user', content: `Facts:\n\n${JSON.stringify(facts, null, 2)}` }],
  })
  const usage = { input: response.usage.input_tokens, output: response.usage.output_tokens }
  if (response.stop_reason !== 'end_turn') {
    console.warn(`  preview not used: stop_reason ${response.stop_reason}`)
    return undefined
  }
  const text = response.content
    .flatMap((b) => (b.type === 'text' ? [b.text] : []))
    .join('')
    .trim()
  if (!text || text.length > 1000) return undefined
  return { text, usage }
}
