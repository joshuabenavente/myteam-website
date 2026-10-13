// Fetch schedule, standings, head-to-head and player stats, and write the JSON the app reads.
//
//   node scripts/ingest.ts             # schedule, standings, head-to-head, availability, previews
//   node scripts/ingest.ts --players   # also refresh player stats from basketball-reference
//
// Previews are only written when ANTHROPIC_API_KEY is set.
//
// Each part is independent: if a source fails, its previous file is kept and the script
// exits non-zero after writing everything else.

import Anthropic from '@anthropic-ai/sdk'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { nextGames } from '../src/lib/availability.ts'
import { TEAM } from '../src/lib/config.ts'
import { previousSeason, seasonForDate } from '../src/lib/season.ts'
import type {
  AvailabilityFile,
  GameLog,
  GameLogsFile,
  HeadToHeadFile,
  MetaFile,
  Player,
  PlayersFile,
  PreviewsFile,
  ScheduleFile,
  SplitStats,
  StandingsFile,
  TrackedGameType,
} from '../src/lib/types.ts'
import { gameLogUrl, parseGameLog, parseRoster, sumGameLog } from './lib/bbref.ts'
import {
  findEspnEventId,
  parseEspnResults,
  winProbability,
  type EspnScheduleJson,
  type EspnSummaryJson,
  type EspnTeamScheduleJson,
} from './lib/espn.ts'
import { getBbref, getJson, NBA_HEADERS } from './lib/http.ts'
import { nameKey, parseEspnRoster, type EspnPlayerInfo, type EspnRosterJson } from './lib/espnRoster.ts'
import { parseInjuries, type EspnInjuriesJson } from './lib/injuries.ts'
import { parseLeagueSchedule, teamGames, type NbaScheduleJson } from './lib/nba.ts'
import { buildFacts, hashFacts, writePreview } from './lib/preview.ts'
import { computeStandings, headToHead, type FinalGame } from './lib/standings.ts'

const OUT_DIR = 'public/data'
const CACHE_DIR = 'data/cache'
const NBA_SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json'
const ESPN_SCHEDULE_URL = (endYear: number, seasonType: number) =>
  `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${TEAM.espnSlug}/schedule?season=${endYear}&seasontype=${seasonType}`
const ESPN_ROSTER_URL = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${TEAM.espnSlug}/roster`
const ESPN_INJURIES_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries'
const ESPN_SUMMARY_URL = (eventId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`
const BBREF_TEAM_URL = (endYear: number) =>
  `https://www.basketball-reference.com/teams/${TEAM.bbrefAbbr}/${endYear}.html`

const current = seasonForDate(new Date())
const last = previousSeason(current)
const failures: string[] = []

function write(path: string, data: unknown, { compact = false } = {}) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, compact ? undefined : 1) + '\n')
  console.log(`wrote ${path}`)
}

function readJson<T>(path: string): T | undefined {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : undefined
}

async function step<T>(name: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn()
  } catch (err) {
    console.error(`FAILED ${name}: ${(err as Error).message}`)
    failures.push(name)
    return undefined
  }
}

// --- schedule and standings (NBA CDN) -------------------------------------------------

const fetched = await step('NBA schedule', async () =>
  parseLeagueSchedule(await getJson<NbaScheduleJson>(NBA_SCHEDULE_URL, NBA_HEADERS)),
)
// Between seasons the feed still holds last season; keep the previous files until it rolls over.
const league = fetched?.season === current.label ? fetched : undefined
if (fetched && !league) console.warn(`NBA schedule is for ${fetched.season}, not ${current.label} yet; skipping`)

let finals: FinalGame[] = []
let standings: StandingsFile['teams'] = {}
if (league) {
  finals = league.games.filter((g) => g.status === 'final')
  standings = computeStandings(finals)
  write(join(OUT_DIR, 'schedule.json'), {
    season: current.label,
    games: teamGames(league.games, TEAM.abbr),
  } satisfies ScheduleFile)
  write(join(OUT_DIR, 'standings.json'), { season: current.label, teams: standings } satisfies StandingsFile)
}

// --- head-to-head (current from NBA CDN, last season from ESPN) ------------------------

const lastSeasonResults = await step('ESPN last season results', async () => {
  const [regular, playoffs] = await Promise.all([
    getJson<EspnScheduleJson>(ESPN_SCHEDULE_URL(last.endYear, 2)),
    getJson<EspnScheduleJson>(ESPN_SCHEDULE_URL(last.endYear, 3)),
  ])
  return [...parseEspnResults(regular, 'regular'), ...parseEspnResults(playoffs, 'playoffs')]
})

let h2hOpponents: HeadToHeadFile['opponents'] | undefined
if (league && lastSeasonResults) {
  const games = teamGames(league.games, TEAM.abbr)
  const now = headToHead(finals, TEAM.abbr)
  const before = headToHead(lastSeasonResults, TEAM.abbr)
  const empty = () => ({ regular: { wins: 0, losses: 0 }, playoffs: { wins: 0, losses: 0 } })
  const opponents: HeadToHeadFile['opponents'] = {}
  for (const opp of new Set([...games.map((g) => g.opponent), ...Object.keys(now), ...Object.keys(before)])) {
    opponents[opp] = { current: now[opp] ?? empty(), last: before[opp] ?? empty() }
  }
  h2hOpponents = opponents
  write(join(OUT_DIR, 'h2h.json'), { season: current.label, lastSeason: last.label, opponents } satisfies HeadToHeadFile)
}

// --- players (basketball-reference) ---------------------------------------------------

const TYPES: TrackedGameType[] = ['regular', 'playoffs']

/** Totals per game type, optionally only through each type's team game number. */
function split(log: GameLog, through?: { [K in TrackedGameType]: number }): SplitStats {
  const out: SplitStats = {}
  for (const type of TYPES) {
    const totals = sumGameLog(log[type], through?.[type])
    if (totals) out[type] = totals
  }
  return out
}

if (process.argv.includes('--players') && league) {
  await step('players', async () => {
    const teamGamesPlayed = { regular: 0, playoffs: 0 }
    for (const g of finals) if (g.home === TEAM.abbr || g.away === TEAM.abbr) teamGamesPlayed[g.type]++

    const rosterHtml = await getBbref(BBREF_TEAM_URL(current.endYear))
    if (!rosterHtml) throw new Error('team page not found')
    const roster = parseRoster(rosterHtml)
    if (!roster.length) throw new Error('roster table empty or missing')

    // Jersey numbers, photos and bio from ESPN; optional, matched by name.
    let espn = new Map<string, EspnPlayerInfo>()
    try {
      espn = parseEspnRoster(await getJson<EspnRosterJson>(ESPN_ROSTER_URL))
    } catch (err) {
      console.warn(`  ESPN roster unavailable: ${(err as Error).message}`)
    }

    // Last season's game logs never change, so cache them between runs. The version in the
    // name changes whenever the stored shape does, which refetches them once.
    const cachePath = join(CACHE_DIR, `gamelogs-v2-${last.endYear}.json`)
    const cache = readJson<{ [id: string]: GameLog }>(cachePath) ?? {}
    const empty: GameLog = { regular: [], playoffs: [] }

    const players: Player[] = []
    const logs: GameLogsFile['players'] = {}
    try {
      for (const p of roster) {
        let lastLog = cache[p.id]
        if (!lastLog) {
          const html = await getBbref(gameLogUrl(p.id, last.endYear))
          lastLog = html ? parseGameLog(html) : empty
          cache[p.id] = lastLog
        }
        let currentLog = empty
        if (teamGamesPlayed.regular + teamGamesPlayed.playoffs > 0) {
          const html = await getBbref(gameLogUrl(p.id, current.endYear))
          if (html) currentLog = parseGameLog(html)
        }
        const extra = espn.get(nameKey(p.name))
        players.push({
          ...p,
          ...(extra?.number && { number: extra.number }),
          ...(extra?.headshot && { headshot: extra.headshot }),
          // Prefer ESPN's bio, but keep basketball-reference's experience (seasons before this one).
          bio: { ...p.bio, ...extra?.bio, ...(p.bio.experience !== undefined && { experience: p.bio.experience }) },
          current: split(currentLog),
          lastFull: split(lastLog),
          lastToDate: split(lastLog, teamGamesPlayed),
        })
        logs[p.id] = { current: currentLog, last: lastLog }
        console.log(`  ${p.name}${extra ? '' : ' (not on ESPN roster)'}`)
      }
    } finally {
      // Keep whatever was fetched, even if a later request failed.
      write(cachePath, cache)
    }

    const minutes = (x: Player) => x.current.regular?.minutes ?? 0
    const lastMinutes = (x: Player) => x.lastFull.regular?.minutes ?? 0
    players.sort((a, b) => minutes(b) - minutes(a) || lastMinutes(b) - lastMinutes(a))
    write(join(OUT_DIR, 'players.json'), {
      season: current.label,
      lastSeason: last.label,
      teamGamesPlayed,
      players,
    } satisfies PlayersFile)
    write(join(OUT_DIR, 'gamelogs.json'), { season: current.label, lastSeason: last.label, players: logs } satisfies GameLogsFile, {
      compact: true,
    })
  })
}

// --- availability (ESPN injuries) ----------------------------------------------------

const availabilityPath = join(OUT_DIR, 'availability.json')
const absences = await step('ESPN injuries', async () => {
  const teams = parseInjuries(await getJson<EspnInjuriesJson>(ESPN_INJURIES_URL))
  const previous = readJson<AvailabilityFile>(availabilityPath)
  // Keep the old timestamp when nothing changed, so "updated" means the list last changed.
  const changed = JSON.stringify(previous?.teams) !== JSON.stringify(teams)
  write(availabilityPath, {
    updatedAt: changed || !previous ? new Date().toISOString() : previous.updatedAt,
    teams,
  } satisfies AvailabilityFile)
  return teams
})

// --- previews (Claude) ----------------------------------------------------------------

if (league && absences && process.env.ANTHROPIC_API_KEY) {
  await step('previews', async () => {
    const schedule = teamGames(league.games, TEAM.abbr)
    const upcoming = nextGames(schedule)
    const previewsPath = join(OUT_DIR, 'previews.json')
    const previous = readJson<PreviewsFile>(previewsPath)?.games ?? {}
    const players = readJson<PlayersFile>(join(OUT_DIR, 'players.json'))?.players

    // Win probabilities from ESPN's matchup predictor (optional).
    const chances: { [gameId: string]: number } = {}
    try {
      const types = [...new Set(upcoming.map((g) => (g.type === 'playoffs' ? 3 : 2)))]
      const espnSchedules = await Promise.all(
        types.map((t) => getJson<EspnTeamScheduleJson>(ESPN_SCHEDULE_URL(current.endYear, t))),
      )
      for (const g of upcoming) {
        const id = espnSchedules.map((s) => findEspnEventId(s, g.opponent, g.startUtc)).find(Boolean)
        if (!id) continue
        const chance = winProbability(await getJson<EspnSummaryJson>(ESPN_SUMMARY_URL(id)), TEAM.abbr)
        if (chance !== undefined) chances[g.id] = chance
      }
    } catch (err) {
      console.warn(`  ESPN predictor unavailable: ${(err as Error).message}`)
    }

    const client = new Anthropic()
    const games: PreviewsFile['games'] = {}
    const spent = { input: 0, output: 0, calls: 0 }
    for (const game of upcoming) {
      const gameNumber = schedule.filter((g) => g.type === game.type && g.startUtc <= game.startUtc).length
      const facts = buildFacts({
        team: TEAM.abbr,
        season: current.label,
        lastSeason: last.label,
        game,
        earlierUnplayed: schedule.filter((g) => g.status === 'scheduled' && g.startUtc < game.startUtc),
        gameNumber,
        standings,
        h2h: h2hOpponents?.[game.opponent],
        results: [...finals, ...(lastSeasonResults ?? [])],
        absences,
        players,
        winProbability: chances[game.id],
      })
      const factsHash = hashFacts(facts)
      if (previous[game.id]?.factsHash === factsHash) {
        games[game.id] = previous[game.id]
        continue
      }
      const preview = await writePreview(client, facts)
      if (preview) {
        spent.input += preview.usage.input
        spent.output += preview.usage.output
        spent.calls++
        games[game.id] = { text: preview.text, generatedAt: new Date().toISOString(), factsHash }
        console.log(`  preview for ${game.opponent}: ${preview.text}`)
      } else if (previous[game.id]) {
        games[game.id] = previous[game.id]
      }
    }
    if (spent.calls) {
      console.log(`  ${spent.calls} preview(s): ${spent.input} input + ${spent.output} output tokens`)
    }
    write(previewsPath, { games } satisfies PreviewsFile)
  })
}

// --- meta -----------------------------------------------------------------------------

if (league) {
  write(join(OUT_DIR, 'meta.json'), {
    updatedAt: new Date().toISOString(),
    season: current.label,
    sources: ['NBA.com', 'ESPN', 'Basketball-Reference.com'],
  } satisfies MetaFile)
}

if (failures.length) {
  console.error(`\n${failures.length} part(s) failed: ${failures.join(', ')}`)
  process.exit(1)
}
