// Game previews: gather the facts for an upcoming game and have Claude write ~3 sentences
// from them. Previews are cached by a hash of the facts and only rewritten when they change.

import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { absencesForGame, availabilityLabel, isGameTimeDecision } from '../../src/lib/availability.ts'
import { dayKey, ordinal } from '../../src/lib/format.ts'
import { TEAMS_BY_ABBR } from '../../src/lib/teams.ts'
import type { Absence, Game, HeadToHead, Player, TeamInfo, WinLoss } from '../../src/lib/types.ts'
import type { FinalGame } from './standings.ts'

const MODEL = 'claude-haiku-5-5'

const rec = (r: WinLoss) => `${r.wins}-${r.losses}`
const fullName = (abbr: string) => `${TEAMS_BY_ABBR[abbr].city} ${TEAMS_BY_ABBR[abbr].name}`

function teamFacts(t: TeamInfo | undefined, season: string) {
  if (!t) return undefined
  const played = t.wins + t.losses
  if (played === 0) return { gamesPlayed: 0, note: `has not played a ${season} game yet` }
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

/** The most recent finished game between the two teams, described from the followed team's side. */
function lastMeeting(results: FinalGame[], team: string, opp: string) {
  const g = results
    .filter((r) => (r.home === team && r.away === opp) || (r.home === opp && r.away === team))
    .sort((a, b) => b.startUtc.localeCompare(a.startUtc))[0]
  if (!g) return undefined
  const ours = g.home === team ? g.homeScore : g.awayScore
  const theirs = g.home === team ? g.awayScore : g.homeScore
  return {
    // Local (Mountain) date: evening games are already the next day in UTC.
    // Pacific date: no NBA game starts late enough to be the next day there.
    date: dayKey(g.startUtc, 'America/Los_Angeles'),
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
      status: availabilityLabel(a),
      ...(isGameTimeDecision(a) && { gameTimeDecision: true }),
      ...(a.reason && { reason: a.reason }),
      ...(p && avg(p.current.regular) && { thisSeason: avg(p.current.regular) }),
      ...(p && avg(p.lastFull.regular) && { lastSeason: avg(p.lastFull.regular) }),
    }
  })
}

/** "Nuggets lead 2-1", "tied 1-1" or "no games yet". */
function currentSeries(r: WinLoss, nick: string) {
  if (r.wins + r.losses === 0) return 'no games yet'
  if (r.wins === r.losses) return `tied ${rec(r)}`
  return `${nick} ${r.wins > r.losses ? 'lead' : 'trail'} ${rec(r)}`
}

/** "Nuggets won 3-0", "split 2-2" or "did not play". */
function finishedSeries(r: WinLoss, nick: string) {
  if (r.wins + r.losses === 0) return 'did not play'
  if (r.wins === r.losses) return `split ${rec(r)}`
  return `${nick} ${r.wins > r.losses ? 'won' : 'lost'} ${rec(r)}`
}

export interface PreviewInputs {
  team: string
  /** Season labels, e.g. "2026-27" and "2025-26". */
  season: string
  lastSeason: string
  game: Game
  /** The team's games before this one that haven't been played yet. */
  earlierUnplayed: Game[]
  /** The opponent's games before this one that haven't been played yet. */
  opponentEarlierUnplayed: unknown[]
  /** 1-based number of this game in the team's season (by type). */
  gameNumber: number
  standings: { [abbr: string]: TeamInfo }
  h2h?: { current: HeadToHead; last: HeadToHead }
  /** Finished games this season and last, for the last meeting. */
  results: FinalGame[]
  absences: { [abbr: string]: Absence[] }
  players?: Player[]
  /** The team's chance of winning (0-100) from ESPN's matchup predictor. */
  winProbability?: number
}

export function buildFacts(i: PreviewInputs) {
  const { team, game } = i
  const opp = game.opponent
  const nick = TEAMS_BY_ABBR[team].name
  const played = (r: WinLoss) => r.wins + r.losses > 0
  return {
    season: i.season,
    game: {
      matchup: `${fullName(team)} ${game.home ? 'vs' : 'at'} ${fullName(opp)}`,
      followedTeam: fullName(team),
      followedTeamIs: game.neutralSite ? `designated ${game.home ? 'home' : 'road'} team` : game.home ? 'home' : 'away',
      type: game.type === 'playoffs' ? 'playoffs' : 'regular season',
      followedTeamGameNumber: `${ordinal(i.gameNumber)} ${game.type === 'playoffs' ? 'playoff ' : ''}game of the season for the ${nick}`,
      ...(game.label && { note: game.label }),
      ...(game.neutralSite && { site: `neutral site, in ${game.neutralSite}` }),
      // Counts, not lists: they only exist to stop "season opener" claims, not to be recited.
      ...(i.earlierUnplayed.length > 0 && { followedTeamGamesStillToPlayBeforeThisOne: i.earlierUnplayed.length }),
    },
    recordsAreAsOfToday: true,
    followedTeam: teamFacts(i.standings[team], i.season),
    opponent: {
      name: fullName(opp),
      ...teamFacts(i.standings[opp], i.season),
      ...(i.opponentEarlierUnplayed.length > 0 && { gamesStillToPlayBeforeThisOne: i.opponentEarlierUnplayed.length }),
    },
    ...(i.h2h && {
      seasonSeries: {
        [`${i.season} so far`]: currentSeries(i.h2h.current.regular, nick),
        ...(played(i.h2h.current.playoffs) && { [`${i.season} playoffs`]: currentSeries(i.h2h.current.playoffs, nick) }),
        [i.lastSeason]: finishedSeries(i.h2h.last.regular, nick),
        ...(played(i.h2h.last.playoffs) && { [`${i.lastSeason} playoffs`]: finishedSeries(i.h2h.last.playoffs, nick) }),
      },
    }),
    ...(lastMeeting(i.results, team, opp) && { lastMeeting: lastMeeting(i.results, team, opp) }),
    notAvailable: {
      followedTeam: absenceFacts(absencesForGame(i.absences[team], game), i.players),
      opponent: absenceFacts(absencesForGame(i.absences[opp], game)),
    },
    // Rounded so small model updates don't trigger a rewrite.
    ...(i.winProbability !== undefined && {
      espnMatchupPredictorFollowedTeamWinChance: `${Math.round(i.winProbability / 5) * 5}%`,
    }),
  }
}

export const hashFacts = (facts: unknown) => createHash('sha256').update(JSON.stringify(facts)).digest('hex').slice(0, 16)

const SYSTEM = `You write short previews of upcoming NBA games for a fan site. Each preview is for fans of the followed team named in the facts; write from a neutral, informed point of view that keeps that team in focus.

Write exactly three sentences of plain prose: no markdown, headings, lists or emojis. Cover what to expect: how the teams are playing and the matchup history, picking whatever is most notable. If either team has players listed as not available, always name them.

Use only the facts in the user's message, and never infer anything beyond them about either team's schedule, roster, results or history. Records, standings and absences are as of today. If either team has games still to play before this one, those come first, so don't call this game that team's season opener or say how the teams will look at tip-off; describe where things stand now instead. Call this game a team's opener only if that team has no games still to play before it and has not played yet. Don't mention the other games still to play; they're only there so you don't call this an opener. Quote series results as worded in the facts, and write plain, natural sentences. Refer to seasons only by the labels in the facts. Don't add statistics, player roles, storylines, coaches or history that aren't there; your knowledge of rosters may be out of date, so if a player's importance isn't shown by the numbers given, don't characterize it. If a team hasn't played yet this season, say so naturally (for example "both teams open their seasons") instead of quoting 0-0 records. Skip anything that adds nothing, such as an empty absence list.

Don't mention tip-off time or TV channels; the app shows those. If a win chance from ESPN's matchup predictor is given, you may mention it once, attributed to ESPN; don't give betting advice.`

/** Changes whenever the instructions or model do, so previews are rewritten after a prompt change. */
export const PROMPT_VERSION = hashFacts({ SYSTEM, MODEL })

export interface GeneratedPreview {
  text: string
  usage: { input: number; output: number }
}

/** Ask Claude for a preview. Returns undefined if it declines or the reply isn't usable. */
export async function writePreview(client: Anthropic, facts: unknown): Promise<GeneratedPreview | undefined> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // Medium effort: low produced clumsy phrasing, and at Haiku prices the difference is negligible.
    output_config: { effort: 'medium' },
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
