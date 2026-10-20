// Fetch schedule, standings, head-to-head and player stats for every team, and write the JSON
// the app reads: shared files in public/data/, one folder per team in public/data/teams/<abbr>/.
//
//   node scripts/ingest.ts                  # schedules, standings, head-to-head, availability, previews
//   node scripts/ingest.ts --players        # also refresh player stats for the 5 stalest teams
//   node scripts/ingest.ts --players 12     # ...for the 12 stalest teams
//   node scripts/ingest.ts --players all    # ...for every team
//   node scripts/ingest.ts --teams DEN,OKC  # limit everything to these teams
//
// Player stats come from basketball-reference, which asks for under 20 requests a minute, so
// teams take turns: each hourly run refreshes a few, and every team comes round every ~6 hours.
//
// Previews are only written when ANTHROPIC_API_KEY is set.
//
// Each part is independent: if a source fails, its previous file is kept and the script
// exits non-zero after writing everything else.

import Anthropic from '@anthropic-ai/sdk'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { nextGames } from '../src/lib/availability.ts'
import { previousSeason, seasonForDate } from '../src/lib/season.ts'
import { sumGameLog } from '../src/lib/stats.ts'
import { bbrefAbbr, espnSlug, TEAMS, TEAMS_BY_ABBR } from '../src/lib/teams.ts'
import type {
  AvailabilityFile,
  GameLog,
  GameLogsFile,
  HeadToHeadFile,
  LastSeasonFile,
  MetaFile,
  Player,
  PlayersFile,
  PreviewsFile,
  ScheduleFile,
  SplitStats,
  StandingsFile,
  TrackedGameType,
} from '../src/lib/types.ts'
import { gameLogUrl, parseGameLog, parseRoster } from './lib/bbref.ts'
import { parseEspnResults, type EspnScheduleJson } from './lib/espn.ts'
import { getBbref, getJson, NBA_HEADERS } from './lib/http.ts'
import { nameKey, parseEspnRoster, type EspnPlayerInfo, type EspnRosterJson } from './lib/espnRoster.ts'
import { parseInjuries, type EspnInjuriesJson } from './lib/injuries.ts'
import { countedFinals, parseLeagueSchedule, teamGames, type NbaScheduleJson } from './lib/nba.ts'
import { writeLeagueFile } from './lib/league.ts'
import { buildFacts, hashFacts, PROMPT_VERSION, writePreview } from './lib/preview.ts'
import { computeStandings, headToHead, type FinalGame } from './lib/standings.ts'

const OUT_DIR = 'public/data'
const CACHE_DIR = 'data/cache'
const NBA_SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json'
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const ESPN_SCHEDULE_URL = (abbr: string, endYear: number, seasonType: number) =>
  `${ESPN}/teams/${espnSlug(TEAMS_BY_ABBR[abbr])}/schedule?season=${endYear}&seasontype=${seasonType}`
const ESPN_ROSTER_URL = (abbr: string) => `${ESPN}/teams/${espnSlug(TEAMS_BY_ABBR[abbr])}/roster`
const ESPN_INJURIES_URL = `${ESPN}/injuries`
const BBREF_TEAM_URL = (abbr: string, endYear: number) =>
  `https://www.basketball-reference.com/teams/${bbrefAbbr(abbr)}/${endYear}.html`

/** Teams refreshed per run with plain --players; 5 an hour covers all 30 every 6 hours. */
const PLAYER_BATCH = 5
/** Don't refresh a team's players more often than this. */
const PLAYER_MIN_AGE_MS = 5 * 60 * 60 * 1000

const current = seasonForDate(new Date())
const last = previousSeason(current)
const failures: string[] = []

const args = process.argv.slice(2)
/** A flag's value: undefined if absent, '' if given without one. */
function flag(name: string): string | undefined {
  const i = args.indexOf(name)
  if (i < 0) return undefined
  const next = args[i + 1]
  return next && !next.startsWith('--') ? next : ''
}
const only = flag('--teams')?.toUpperCase().split(',').filter(Boolean)
const teams = TEAMS.map((t) => t.abbr).filter((a) => !only?.length || only.includes(a))
const teamDir = (abbr: string) => join(OUT_DIR, 'teams', abbr.toLowerCase())

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

// --- schedules and standings (NBA CDN) ------------------------------------------------

const fetched = await step('NBA schedule', async () =>
  parseLeagueSchedule(await getJson<NbaScheduleJson>(NBA_SCHEDULE_URL, NBA_HEADERS)),
)
// Between seasons the feed still holds last season; keep the previous files until it rolls over.
const league = fetched?.season === current.label ? fetched : undefined
if (fetched && !league) console.warn(`NBA schedule is for ${fetched.season}, not ${current.label} yet; skipping`)

let finals: FinalGame[] = []
let standings: StandingsFile['teams'] = {}
if (league) {
  // Play-in games are on schedules but count toward no record, standing or head-to-head.
  finals = countedFinals(league.games)
  standings = computeStandings(finals)
  write(join(OUT_DIR, 'standings.json'), { season: current.label, teams: standings } satisfies StandingsFile)
  for (const abbr of teams) {
    write(join(teamDir(abbr), 'schedule.json'), {
      season: current.label,
      games: teamGames(league.games, abbr),
    } satisfies ScheduleFile)
  }
}

// --- head-to-head (this season from the NBA CDN, last season from ESPN) -----------------

// Last season's results never change, so each team's are fetched once and kept.
const resultsPath = join(CACHE_DIR, `results-${last.endYear}.json`)
const lastResults = readJson<{ [abbr: string]: FinalGame[] }>(resultsPath) ?? {}
for (const abbr of teams.filter((a) => !lastResults[a])) {
  await step(`${abbr} last season results`, async () => {
    const [regular, playoffs] = await Promise.all([
      getJson<EspnScheduleJson>(ESPN_SCHEDULE_URL(abbr, last.endYear, 2)),
      getJson<EspnScheduleJson>(ESPN_SCHEDULE_URL(abbr, last.endYear, 3)),
    ])
    lastResults[abbr] = [...parseEspnResults(regular, 'regular'), ...parseEspnResults(playoffs, 'playoffs')]
  })
}
write(resultsPath, lastResults, { compact: true })
// Published for the Games page's last-season results (NBA-03).
for (const abbr of teams.filter((a) => lastResults[a])) {
  write(join(teamDir(abbr), 'last-season.json'), { season: last.label, games: lastResults[abbr] } satisfies LastSeasonFile)
}

const h2hByTeam: { [abbr: string]: HeadToHeadFile['opponents'] } = {}
if (league) {
  const empty = () => ({ regular: { wins: 0, losses: 0 }, playoffs: { wins: 0, losses: 0 } })
  for (const abbr of teams.filter((a) => lastResults[a])) {
    const now = headToHead(finals, abbr)
    const before = headToHead(lastResults[abbr], abbr)
    const opponents: HeadToHeadFile['opponents'] = {}
    const scheduled = teamGames(league.games, abbr).map((g) => g.opponent)
    for (const opp of new Set([...scheduled, ...Object.keys(now), ...Object.keys(before)])) {
      opponents[opp] = { current: now[opp] ?? empty(), last: before[opp] ?? empty() }
    }
    h2hByTeam[abbr] = opponents
    write(join(teamDir(abbr), 'h2h.json'), {
      season: current.label,
      lastSeason: last.label,
      opponents,
    } satisfies HeadToHeadFile)
  }
}

// --- players (basketball-reference, a few teams per run) -------------------------------

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

/** The teams whose stats are oldest (never fetched first), skipping any refreshed recently. */
function playerTeams(arg: string): string[] {
  if (arg === 'all') return teams
  const age = (abbr: string) => Date.parse(readJson<PlayersFile>(join(teamDir(abbr), 'players.json'))?.updatedAt ?? '') || 0
  const due = teams.filter((a) => Date.now() - age(a) > PLAYER_MIN_AGE_MS).sort((a, b) => age(a) - age(b))
  return due.slice(0, Number(arg) || PLAYER_BATCH)
}

// Last season's game logs never change, so cache them between runs (shared by all teams, so a
// traded player is fetched once). The version in the name changes whenever the stored shape does.
const gameLogCachePath = join(CACHE_DIR, `gamelogs-v2-${last.endYear}.json`)

async function updatePlayers(abbr: string, cache: { [id: string]: GameLog }) {
  const teamGamesPlayed = { regular: 0, playoffs: 0 }
  for (const g of finals) if (g.home === abbr || g.away === abbr) teamGamesPlayed[g.type]++

  const rosterHtml = await getBbref(BBREF_TEAM_URL(abbr, current.endYear))
  if (!rosterHtml) throw new Error('team page not found')
  const roster = parseRoster(rosterHtml)
  if (!roster.length) throw new Error('roster table empty or missing')

  // Jersey numbers, photos and bio from ESPN; optional, matched by name.
  let espn = new Map<string, EspnPlayerInfo>()
  try {
    espn = parseEspnRoster(await getJson<EspnRosterJson>(ESPN_ROSTER_URL(abbr)))
  } catch (err) {
    console.warn(`  ESPN roster unavailable: ${(err as Error).message}`)
  }

  const empty: GameLog = { regular: [], playoffs: [] }
  const players: Player[] = []
  const logs: GameLogsFile['players'] = {}
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
  }

  const minutes = (x: Player) => x.current.regular?.minutes ?? 0
  const lastMinutes = (x: Player) => x.lastFull.regular?.minutes ?? 0
  players.sort((a, b) => minutes(b) - minutes(a) || lastMinutes(b) - lastMinutes(a))
  write(join(teamDir(abbr), 'players.json'), {
    season: current.label,
    lastSeason: last.label,
    updatedAt: new Date().toISOString(),
    teamGamesPlayed,
    players,
  } satisfies PlayersFile)
  write(
    join(teamDir(abbr), 'gamelogs.json'),
    { season: current.label, lastSeason: last.label, players: logs } satisfies GameLogsFile,
    { compact: true },
  )
}

const playersArg = flag('--players')
if (playersArg !== undefined && league) {
  const cache = readJson<{ [id: string]: GameLog }>(gameLogCachePath) ?? {}
  const due = playerTeams(playersArg)
  console.log(`players for ${due.length ? due.join(', ') : 'no teams (all refreshed recently)'}`)
  for (const abbr of due) {
    try {
      await step(`${abbr} players`, () => updatePlayers(abbr, cache))
    } finally {
      // Keep whatever was fetched, even if a later request failed.
      write(gameLogCachePath, cache, { compact: true })
    }
  }
}

// --- availability (ESPN injuries, all teams in one request) ------------------------------

const availabilityPath = join(OUT_DIR, 'availability.json')
const absences = await step('ESPN injuries', async () => {
  const injuries = parseInjuries(await getJson<EspnInjuriesJson>(ESPN_INJURIES_URL))
  const previous = readJson<AvailabilityFile>(availabilityPath)
  // Keep the old timestamp when nothing changed, so "updated" means the list last changed.
  const changed = JSON.stringify(previous?.teams) !== JSON.stringify(injuries)
  write(availabilityPath, {
    updatedAt: changed || !previous ? new Date().toISOString() : previous.updatedAt,
    teams: injuries,
  } satisfies AvailabilityFile)
  return injuries
})

// --- previews (Claude), each team's next game --------------------------------------------

if (league && absences && process.env.ANTHROPIC_API_KEY) {
  const client = new Anthropic()
  const spent = { input: 0, output: 0, calls: 0 }
  for (const abbr of teams) {
    await step(`${abbr} preview`, async () => {
      const schedule = teamGames(league.games, abbr)
      const previewsPath = join(teamDir(abbr), 'previews.json')
      const previous = readJson<PreviewsFile>(previewsPath)?.games ?? {}
      const players = readJson<PlayersFile>(join(teamDir(abbr), 'players.json'))?.players
      const games: PreviewsFile['games'] = {}
      for (const game of nextGames(schedule, 1)) {
        const gameNumber = schedule.filter((g) => g.type === game.type && g.startUtc <= game.startUtc).length
        const facts = buildFacts({
          team: abbr,
          season: current.label,
          lastSeason: last.label,
          game,
          earlierUnplayed: schedule.filter((g) => g.status === 'scheduled' && g.startUtc < game.startUtc),
          opponentEarlierUnplayed: league.games.filter(
            (g) =>
              g.status === 'scheduled' &&
              g.startUtc < game.startUtc &&
              (g.home === game.opponent || g.away === game.opponent) &&
              g.id !== game.id,
          ),
          gameNumber,
          standings,
          h2h: h2hByTeam[abbr]?.[game.opponent],
          results: [...finals, ...(lastResults[abbr] ?? [])],
          absences,
          players,
        })
        const factsHash = hashFacts({ facts, prompt: PROMPT_VERSION })
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
          console.log(`  ${abbr} preview vs ${game.opponent}: ${preview.text}`)
        } else if (previous[game.id]) {
          games[game.id] = previous[game.id]
        }
      }
      write(previewsPath, { games } satisfies PreviewsFile)
    })
  }
  if (spent.calls) console.log(`  ${spent.calls} preview(s): ${spent.input} input + ${spent.output} output tokens`)
}

// --- league (top scorers and last season's wins, for the matchup tags) -----------------

writeLeagueFile(OUT_DIR, { current: current.label, last: last.label })

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
