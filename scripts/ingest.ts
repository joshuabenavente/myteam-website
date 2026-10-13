// Fetch schedule, standings, head-to-head and player stats, and write the JSON the app reads.
//
//   node scripts/ingest.ts             # schedule, standings, head-to-head
//   node scripts/ingest.ts --players   # also refresh player stats from basketball-reference
//
// Each part is independent: if a source fails, its previous file is kept and the script
// exits non-zero after writing everything else.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { TEAM } from '../src/lib/config.ts'
import { previousSeason, seasonForDate } from '../src/lib/season.ts'
import type {
  HeadToHeadFile,
  MetaFile,
  Player,
  PlayersFile,
  ScheduleFile,
  SplitStats,
  StandingsFile,
  TrackedGameType,
} from '../src/lib/types.ts'
import { gameLogUrl, parseGameLog, parseRoster, sumGameLog, type GameLogRow } from './lib/bbref.ts'
import { parseEspnResults, type EspnScheduleJson } from './lib/espn.ts'
import { getBbref, getJson, NBA_HEADERS } from './lib/http.ts'
import { parseLeagueSchedule, teamGames, type NbaScheduleJson } from './lib/nba.ts'
import { computeStandings, headToHead, type FinalGame } from './lib/standings.ts'

const OUT_DIR = 'public/data'
const CACHE_DIR = 'data/cache'
const NBA_SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json'
const ESPN_SCHEDULE_URL = (endYear: number, seasonType: number) =>
  `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${TEAM.espnSlug}/schedule?season=${endYear}&seasontype=${seasonType}`
const BBREF_TEAM_URL = (endYear: number) =>
  `https://www.basketball-reference.com/teams/${TEAM.bbrefAbbr}/${endYear}.html`

const current = seasonForDate(new Date())
const last = previousSeason(current)
const failures: string[] = []

function write(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 1) + '\n')
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
if (league) {
  finals = league.games.filter((g) => g.status === 'final')
  write(join(OUT_DIR, 'schedule.json'), {
    season: current.label,
    games: teamGames(league.games, TEAM.abbr),
  } satisfies ScheduleFile)
  write(join(OUT_DIR, 'standings.json'), {
    season: current.label,
    teams: computeStandings(finals),
  } satisfies StandingsFile)
}

// --- head-to-head (current from NBA CDN, last season from ESPN) ------------------------

const lastSeasonResults = await step('ESPN last season results', async () => {
  const [regular, playoffs] = await Promise.all([
    getJson<EspnScheduleJson>(ESPN_SCHEDULE_URL(last.endYear, 2)),
    getJson<EspnScheduleJson>(ESPN_SCHEDULE_URL(last.endYear, 3)),
  ])
  return [...parseEspnResults(regular, 'regular'), ...parseEspnResults(playoffs, 'playoffs')]
})

if (league && lastSeasonResults) {
  const games = teamGames(league.games, TEAM.abbr)
  const now = headToHead(finals, TEAM.abbr)
  const before = headToHead(lastSeasonResults, TEAM.abbr)
  const empty = () => ({ regular: { wins: 0, losses: 0 }, playoffs: { wins: 0, losses: 0 } })
  const opponents: HeadToHeadFile['opponents'] = {}
  for (const opp of new Set([...games.map((g) => g.opponent), ...Object.keys(now), ...Object.keys(before)])) {
    opponents[opp] = { current: now[opp] ?? empty(), last: before[opp] ?? empty() }
  }
  write(join(OUT_DIR, 'h2h.json'), { season: current.label, lastSeason: last.label, opponents } satisfies HeadToHeadFile)
}

// --- players (basketball-reference) ---------------------------------------------------

type GameLog = { [K in TrackedGameType]: GameLogRow[] }
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

    // Last season's game logs never change, so cache them between runs.
    const cachePath = join(CACHE_DIR, `gamelogs-${last.endYear}.json`)
    const cache = readJson<{ [id: string]: GameLog }>(cachePath) ?? {}
    const empty: GameLog = { regular: [], playoffs: [] }

    const players: Player[] = []
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
        players.push({
          ...p,
          current: split(currentLog),
          lastFull: split(lastLog),
          lastToDate: split(lastLog, teamGamesPlayed),
        })
        console.log(`  ${p.name}`)
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
