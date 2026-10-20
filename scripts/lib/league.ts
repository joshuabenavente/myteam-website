// League-wide facts for the matchup tags (src/lib/tags.ts): the top scorers and each team's wins
// last season. Computed from the files already written for each team, so it needs no requests.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TEAMS } from '../../src/lib/teams.ts'
import type { LastSeasonFile, LeagueFile, PastGame, PlayersFile } from '../../src/lib/types.ts'

/** How many scorers to keep; the tags use the top 15. */
const SCORERS = 15
/** Teams must have played this many games before this season's scoring replaces last season's. */
const SEASON_STARTED = 10
/** Last season's qualifying minimum, like the NBA's leaderboard. */
const LAST_SEASON_MIN_GAMES = 40

export function buildLeagueFile(
  players: { [abbr: string]: PlayersFile | undefined },
  lastResults: { [abbr: string]: PastGame[] | undefined },
  seasons: { current: string; last: string },
): LeagueFile {
  const files = Object.entries(players).filter((e): e is [string, PlayersFile] => !!e[1])
  const played = files.map(([, f]) => f.teamGamesPlayed.regular).sort((a, b) => a - b)
  const useCurrent = played.length > 0 && played[Math.floor(played.length / 2)] >= SEASON_STARTED

  const rows: LeagueFile['scorers'] = []
  for (const [team, file] of files) {
    for (const p of file.players) {
      const s = (useCurrent ? p.current : p.lastFull).regular
      const minGames = useCurrent ? Math.max(5, Math.floor(0.6 * file.teamGamesPlayed.regular)) : LAST_SEASON_MIN_GAMES
      if (s && s.games >= minGames) rows.push({ name: p.name, team, ppg: Math.round((s.points / s.games) * 10) / 10, games: s.games })
    }
  }
  rows.sort((a, b) => b.ppg - a.ppg || a.name.localeCompare(b.name))

  const lastWins: LeagueFile['lastWins'] = {}
  for (const [team, games] of Object.entries(lastResults)) {
    if (!games) continue
    lastWins[team] = games.filter((g) => g.type === 'regular' && (g.home === team ? g.homeScore > g.awayScore : g.awayScore > g.homeScore)).length
  }
  return { scoringSeason: useCurrent ? seasons.current : seasons.last, scorers: rows.slice(0, SCORERS), lastWins }
}

/** Write league.json from the per-team files already in `outDir` (public/data). */
export function writeLeagueFile(outDir: string, seasons: { current: string; last: string }) {
  const read = <T>(path: string): T | undefined => (existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : undefined)
  const dir = (abbr: string) => join(outDir, 'teams', abbr.toLowerCase())
  const abbrs = TEAMS.map((t) => t.abbr)
  const players = Object.fromEntries(abbrs.map((a) => [a, read<PlayersFile>(join(dir(a), 'players.json'))]))
  const results = Object.fromEntries(abbrs.map((a) => [a, read<LastSeasonFile>(join(dir(a), 'last-season.json'))?.games]))
  writeFileSync(join(outDir, 'league.json'), JSON.stringify(buildLeagueFile(players, results, seasons), null, 1) + '\n')
}
