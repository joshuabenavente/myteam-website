// Phase 1: check which data sources respond from the current machine (meant to run in GitHub Actions)
// and whether they carry the fields the app needs. Writes a Markdown report; never fails the build.
//
//   node scripts/probe-sources.ts [report-path]

import { appendFileSync, writeFileSync } from 'node:fs'
import { LOCAL_BROADCAST, TEAM } from '../src/lib/config.ts'
import { gameTypeFromNbaId, previousSeason, seasonForDate } from '../src/lib/season.ts'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

// stats.nba.com rejects requests without browser-like headers.
const NBA_STATS_HEADERS = {
  Referer: 'https://www.nba.com/',
  Origin: 'https://www.nba.com',
  Accept: 'application/json, text/plain, */*',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
}

// basketball-reference allows ~20 requests/minute; stay well under it.
const BBREF_DELAY_MS = 4000

const current = seasonForDate(new Date())
const last = previousSeason(current)

interface Probe {
  source: string
  purpose: string
  url: string
  headers?: Record<string, string>
  delayBefore?: number
  /** Inspect a successful response body and summarize what it contains. */
  inspect: (body: string) => string
}

interface Result {
  probe: Probe
  status: string
  ms: number
  ok: boolean
  notes: string
}

// --- inspectors -------------------------------------------------------------

function inspectNbaSchedule(body: string): string {
  const sched = JSON.parse(body).leagueSchedule
  const games: any[] = sched.gameDates.flatMap((d: any) => d.games)
  const ours = games.filter(
    (g) => g.homeTeam?.teamTricode === TEAM.abbr || g.awayTeam?.teamTricode === TEAM.abbr,
  )
  const counts = { regular: 0, playoffs: 0, excluded: 0 }
  for (const g of ours) counts[gameTypeFromNbaId(g.gameId)]++

  const networks = new Set<string>()
  let withBroadcast = 0
  for (const g of ours) {
    const b = g.broadcasters ?? {}
    const names = Object.values(b)
      .flatMap((list: any) => (Array.isArray(list) ? list : []))
      .map((x: any) => x.broadcasterDisplay ?? x.broadcasterAbbreviation)
      .filter(Boolean)
    if (names.length) withBroadcast++
    names.forEach((n: string) => networks.add(n))
  }
  const hasLocal = [...networks].some((n) => n.toLowerCase().includes(LOCAL_BROADCAST.toLowerCase()))
  return [
    `season ${sched.seasonYear}`,
    `${TEAM.abbr} games: ${counts.regular} regular, ${counts.playoffs} playoff, ${counts.excluded} excluded`,
    `${withBroadcast}/${ours.length} with broadcasters`,
    `${LOCAL_BROADCAST} listed: ${hasLocal ? 'yes' : 'NO'}`,
    `networks: ${[...networks].sort().join(', ') || 'none'}`,
    `sample time: ${ours[0]?.gameDateTimeUTC ?? 'n/a'}`,
  ].join('<br>')
}

function inspectEspnSchedule(body: string): string {
  const events: any[] = JSON.parse(body).events ?? []
  const networks = new Set<string>()
  let withBroadcast = 0
  for (const e of events) {
    const names = (e.competitions?.[0]?.broadcasts ?? [])
      .map((b: any) => b.media?.shortName ?? b.names?.[0])
      .filter(Boolean)
    if (names.length) withBroadcast++
    names.forEach((n: string) => networks.add(n))
  }
  const completed = events.filter((e) => e.competitions?.[0]?.status?.type?.completed).length
  return [
    `${events.length} events (${completed} completed)`,
    `${withBroadcast}/${events.length} with broadcasts`,
    `networks: ${[...networks].sort().join(', ') || 'none'}`,
  ].join('<br>')
}

function inspectEspnStandings(body: string): string {
  const groups: any[] = JSON.parse(body).children ?? []
  const describe = (g: any): string => {
    const entries = g.standings?.entries ?? []
    const inner = (g.children ?? []).map(describe).join('; ')
    return `${g.name} (${entries.length})${inner ? ` [${inner}]` : ''}`
  }
  const ours = JSON.stringify(groups).includes(`"abbreviation":"${TEAM.abbr}"`)
  return [`groups: ${groups.map(describe).join('; ') || 'none'}`, `${TEAM.abbr} present: ${ours ? 'yes' : 'NO'}`].join(
    '<br>',
  )
}

function inspectNbaStats(body: string): string {
  const sets: any[] = JSON.parse(body).resultSets ?? []
  return sets.map((s) => `${s.name}: ${s.rowSet?.length ?? 0} rows`).join('<br>') || 'no resultSets'
}

function inspectNbaStatsSchedule(body: string): string {
  const sched = JSON.parse(body).leagueSchedule
  const games: any[] = (sched?.gameDates ?? []).flatMap((d: any) => d.games)
  const ours = games.filter(
    (g) => g.homeTeam?.teamTricode === TEAM.abbr || g.awayTeam?.teamTricode === TEAM.abbr,
  )
  const withScores = ours.filter((g) => g.homeTeam?.score != null).length
  return `season ${sched?.seasonYear}<br>${TEAM.abbr} games: ${ours.length} (${withScores} with scores)`
}


/** basketball-reference hides some tables inside HTML comments, so search the raw text. */
function inspectBbref(expectedTables: string[]) {
  return (body: string): string => {
    const ids = [...body.matchAll(/<table[^>]*\sid="([^"]+)"/g)].map((m) => m[1])
    const missing = expectedTables.filter((t) => !ids.includes(t))
    const rows = (id: string) => {
      const start = body.indexOf(`id="${id}"`)
      if (start < 0) return 0
      const end = body.indexOf('</table>', start)
      return (body.slice(start, end).match(/<tr[\s>]/g) ?? []).length
    }
    return [
      `tables: ${ids.join(', ') || 'none'}`,
      ...expectedTables.filter((t) => ids.includes(t)).map((t) => `${t}: ~${rows(t)} rows`),
      missing.length ? `missing expected: ${missing.join(', ')}` : 'all expected tables found',
      /cloudflare|just a moment/i.test(body.slice(0, 5000)) ? '⚠️ looks like a Cloudflare challenge page' : '',
    ]
      .filter(Boolean)
      .join('<br>')
  }
}

// --- probes -----------------------------------------------------------------

const espnBase = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const bbrefBase = 'https://www.basketball-reference.com'

const probes: Probe[] = [
  {
    source: 'NBA CDN',
    purpose: 'Current schedule, times, broadcasters',
    url: 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json',
    inspect: inspectNbaSchedule,
  },
  {
    source: 'ESPN',
    purpose: `Team schedule ${current.label} (regular)`,
    url: `${espnBase}/teams/${TEAM.espnSlug}/schedule?season=${current.endYear}&seasontype=2`,
    inspect: inspectEspnSchedule,
  },
  {
    source: 'ESPN',
    purpose: `Team schedule ${last.label} (regular)`,
    url: `${espnBase}/teams/${TEAM.espnSlug}/schedule?season=${last.endYear}&seasontype=2`,
    inspect: inspectEspnSchedule,
  },
  {
    source: 'ESPN',
    purpose: `Team schedule ${last.label} (playoffs)`,
    url: `${espnBase}/teams/${TEAM.espnSlug}/schedule?season=${last.endYear}&seasontype=3`,
    inspect: inspectEspnSchedule,
  },
  {
    source: 'ESPN',
    purpose: 'Standings by division',
    url: `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${current.endYear}&level=3`,
    inspect: inspectEspnStandings,
  },
  {
    source: 'NBA Stats',
    purpose: 'Standings (official, with division rank)',
    url: `https://stats.nba.com/stats/leaguestandingsv3?LeagueID=00&Season=${current.label}&SeasonType=Regular%20Season`,
    headers: NBA_STATS_HEADERS,
    inspect: inspectNbaStats,
  },
  {
    source: 'NBA Stats',
    purpose: `Full schedule ${last.label} (for last-season H2H)`,
    url: `https://stats.nba.com/stats/scheduleleaguev2?LeagueID=00&Season=${last.label}`,
    headers: NBA_STATS_HEADERS,
    inspect: inspectNbaStatsSchedule,
  },
  {
    source: 'NBA Stats',
    purpose: `Player game logs ${last.label} (fallback for stats)`,
    url: `https://stats.nba.com/stats/playergamelogs?LeagueID=00&Season=${last.label}&SeasonType=Regular%20Season&TeamID=${TEAM.nbaTeamId}`,
    headers: NBA_STATS_HEADERS,
    inspect: inspectNbaStats,
  },
  {
    source: 'basketball-reference',
    purpose: `Team page ${current.label} (roster + per game)`,
    url: `${bbrefBase}/teams/${TEAM.bbrefAbbr}/${current.endYear}.html`,
    inspect: inspectBbref(['roster', 'per_game_stats']),
  },
  {
    source: 'basketball-reference',
    purpose: `Team page ${last.label} (last season totals)`,
    url: `${bbrefBase}/teams/${TEAM.bbrefAbbr}/${last.endYear}.html`,
    delayBefore: BBREF_DELAY_MS,
    inspect: inspectBbref(['roster', 'per_game_stats']),
  },
  {
    source: 'basketball-reference',
    purpose: `Team games ${last.label} (H2H + game numbering)`,
    url: `${bbrefBase}/teams/${TEAM.bbrefAbbr}/${last.endYear}_games.html`,
    delayBefore: BBREF_DELAY_MS,
    inspect: inspectBbref(['games']),
  },
  {
    source: 'basketball-reference',
    purpose: `Player game log ${last.label} (stats "at this point")`,
    url: `${bbrefBase}/players/j/jokicni01/gamelog/${last.endYear}`,
    delayBefore: BBREF_DELAY_MS,
    inspect: inspectBbref(['player_game_log_reg', 'player_game_log_post']),
  },
]

// --- runner -----------------------------------------------------------------

async function run(probe: Probe): Promise<Result> {
  if (probe.delayBefore) await new Promise((r) => setTimeout(r, probe.delayBefore))
  const started = Date.now()
  try {
    const res = await fetch(probe.url, {
      headers: { 'User-Agent': USER_AGENT, ...probe.headers },
      signal: AbortSignal.timeout(30_000),
    })
    const body = await res.text()
    const ms = Date.now() - started
    const status = `${res.status} (${(body.length / 1024).toFixed(0)} KB)`
    if (!res.ok) return { probe, status, ms, ok: false, notes: body.slice(0, 120).replace(/\s+/g, ' ') }
    try {
      return { probe, status, ms, ok: true, notes: probe.inspect(body) }
    } catch (err) {
      return { probe, status, ms, ok: false, notes: `unexpected format: ${(err as Error).message}` }
    }
  } catch (err) {
    const cause = (err as Error & { cause?: Error }).cause
    return { probe, status: 'error', ms: Date.now() - started, ok: false, notes: cause?.message ?? (err as Error).message }
  }
}

const results: Result[] = []
for (const probe of probes) {
  const r = await run(probe)
  console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${probe.source} - ${probe.purpose}: ${r.status}`)
  results.push(r)
}

const escape = (s: string) => s.replaceAll('|', '\\|')
const report = [
  `# Data source probe`,
  ``,
  `Run at ${new Date().toISOString()} · current season ${current.label} · last season ${last.label}`,
  ``,
  `| | Source | Purpose | HTTP | Time | Findings |`,
  `|---|---|---|---|---|---|`,
  ...results.map(
    (r) =>
      `| ${r.ok ? '✅' : '❌'} | ${r.probe.source} | [${escape(r.probe.purpose)}](${r.probe.url}) | ${r.status} | ${r.ms} ms | ${escape(r.notes)} |`,
  ),
  ``,
].join('\n')

writeFileSync(process.argv[2] ?? 'probe-report.md', report)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} sources OK`)
